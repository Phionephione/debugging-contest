// =================================================================
// == COMPLETE BACKEND CODE (index.js) - FINAL WITH SCORE RESET   ==
// =================================================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const User = require('./models/User');
const Settings = require('./models/Settings');
const Problem = require('./models/Problem');
const Submission = require('./models/Submission');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));

// --- API Endpoints ---
app.use('/api/auth', require('./routes/auth'));
app.get('/', (req, res) => res.send('<h1>Debugging Contest API is running!</h1>'));
app.get('/api/problems', async (req, res) => { try { const p = await Problem.find({}, '_id title description language marks'); res.json(p); } catch (e) { res.status(500).json({ msg: "Server error" }); } });
app.get('/api/problems/:id', auth, async (req, res) => { try { const p = await Problem.findById(req.params.id); if(!p) return res.status(404).json({ msg: 'Problem not found' }); res.json({ title: p.title, buggyCode: p.buggyCode, language: p.language, marks: p.marks }); } catch (e) { res.status(500).json({ msg: 'Server error' }); } });
app.get('/api/settings', async (req, res) => { try { let s = await Settings.findOne(); if (!s) { s = new Settings(); await s.save(); } res.json(s); } catch (err) { res.status(500).send('Server Error'); } });

// --- Admin Routes ---
app.post('/api/admin/problems', [auth, adminAuth], async (req, res) => { const { title, description, language, buggyCode, marks, testCases } = req.body; try { const newProblem = new Problem({ title, description, language, buggyCode, marks, testCases }); const problem = await newProblem.save(); res.json(problem); } catch (err) { console.error(err.message); res.status(500).send('Server Error'); } });
app.delete('/api/admin/problems/:id', [auth, adminAuth], async (req, res) => { try { const problem = await Problem.findByIdAndDelete(req.params.id); if (!problem) return res.status(404).json({ msg: 'Problem not found' }); res.json({ msg: 'Problem removed successfully' }); } catch (err) { console.error(err.message); res.status(500).send('Server Error'); } });
app.put('/api/admin/problems/:id', [auth, adminAuth], async (req, res) => { const { marks } = req.body; try { const updatedProblem = await Problem.findByIdAndUpdate(req.params.id, { marks }, { new: true }); if (!updatedProblem) return res.status(404).json({ msg: 'Problem not found' }); res.json(updatedProblem); } catch (err) { console.error(err.message); res.status(500).send('Server Error'); } });
app.post('/api/admin/settings', [auth, adminAuth], async (req, res) => { const { isLeaderboardVisible } = req.body; try { let s = await Settings.findOneAndUpdate({}, { isLeaderboardVisible }, { new: true, upsert: true }); res.json(s); } catch (err) { res.status(500).send('Server Error'); } });
app.post('/api/admin/generate-problem', [auth, adminAuth], async (req, res) => { const { prompt, language } = req.body; try { const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"}); let languageSpecificInstructions = ''; if (language === 'c' || language === 'cpp' || language === 'java') { languageSpecificInstructions = `The "code" field MUST be a complete, runnable program including a main function and all necessary headers. It must read from standard input (like scanf or Scanner) and print ONLY the required output. For Java, the main public class MUST be named "Main".`; } else { languageSpecificInstructions = `The "code" field MUST be a simple, interactive script that uses input() or prompt() to get user data.`; } const fullPrompt = `You are an assistant that only responds with JSON. The user wants a problem generated in the language: **${language}**. Based on the user's request, generate a JSON object with "title", "description", "code", and "testCases". ${languageSpecificInstructions} The "testCases" field must be an array of two distinct objects with "input" and "expectedOutput" string fields. User Request: "${prompt}"`; const result = await model.generateContent(fullPrompt); const responseText = result.response.text(); const jsonMatch = responseText.match(/\{[\s\S]*\}/); if (!jsonMatch) { throw new Error("AI did not return a parsable JSON object."); } const jsonString = jsonMatch[0]; const jsonResponse = JSON.parse(jsonString); res.json(jsonResponse); } catch (error) { console.error("AI Generation Error:", error); res.status(500).json({ msg: "Failed to generate or parse content from AI." }); } });

// --- NEW PROTECTED ADMIN ROUTE TO RESET ALL SCORES ---
app.delete('/api/admin/reset-scores', [auth, adminAuth], async (req, res) => {
    try {
        // This command deletes EVERY document in the submissions collection
        await Submission.deleteMany({});
        console.log(`ADMIN ACTION: All submissions have been deleted by user ${req.user.id}`);
        res.json({ msg: 'All submissions and scores have been reset successfully.' });
    } catch (err) {
        console.error("Score Reset Error:", err.message);
        res.status(500).send('Server Error during score reset.');
    }
});

// --- Run & Submit Routes ---
// ... (These do not need to change) ...
app.post('/api/run', auth, async (req, res) => { const { problemId, language, code, input } = req.body; if (code === undefined) return res.status(400).json({ msg: 'Missing code' }); const problem = await Problem.findById(problemId); if (!problem) return res.status(404).json({ msg: 'Problem not found' }); let language_id; let finalCodeForJudge0 = code; let shimCode = ''; switch (language.toLowerCase()) { case 'javascript': language_id = 63; shimCode = `const _stdin = require('fs').readFileSync(0).toString().split('\\n');\nlet _stdin_idx = 0;\nconst prompt = () => _stdin[_stdin_idx++];\n`; finalCodeForJudge0 = shimCode + code; break; case 'python': language_id = 71; shimCode = `import sys\n_stdin = sys.stdin.read().split('\\n')\n_stdin_idx = 0\ndef _input_shim(prompt=''):\n    global _stdin_idx\n    val = _stdin[_stdin_idx]\n    _stdin_idx += 1\n    return val\ninput = _input_shim\n`; finalCodeForJudge0 = shimCode + code; break; case 'c': case 'cpp': case 'java': language_id = { c: 50, cpp: 54, java: 62 }[language.toLowerCase()]; const separator = "\n\n---!!!SEPARATOR!!!---\n"; const boilerplate = problem.buggyCode.includes(separator) ? problem.buggyCode.split(separator)[1] : ''; finalCodeForJudge0 = code + "\n" + boilerplate; break; default: return res.status(400).json({ msg: `Language not supported.` }); } const options = { method: 'POST', url: 'https://' + process.env.RAPIDAPI_HOST + '/run', params: { base64_encoded: 'true', fields: '*' }, headers: { 'content-type': 'application/json', 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, 'X-RapidAPI-Host': process.env.RAPIDAPI_HOST }, data: { language: language, stdin: input || '', files: [{ name: 'script.py', content: finalCodeForJudge0 }] } }; try { const response = await axios.request(options); const output = response.data.stdout || response.data.stderr || "No output"; res.json({ output }); } catch (error) { console.error("OneCompiler API Error:", error.response ? error.response.data : error.message); res.status(500).json({ msg: 'Error running code via OneCompiler API.' }); } });
app.post('/api/submit', auth, async (req, res) => { const { problemId, code } = req.body; const problem = await Problem.findById(problemId); if (!problem) return res.status(404).json({ msg: 'Problem not found' }); const user = await User.findById(req.user.id).select('-password'); let allTestsPassed = true; let results = []; for (const test of problem.testCases) { const output = await runCodeWithOneCompiler(problem.language, code, test.input); if (output.trim() !== test.expectedOutput.trim()) { allTestsPassed = false; results.push({ input: test.input, output: output.trim(), expected: test.expectedOutput.trim(), passed: false }); break; } else { results.push({ input: test.input, output: output.trim(), expected: test.expectedOutput.trim(), passed: true }); } } if (allTestsPassed) { const alreadySolved = await Submission.findOne({ userId: req.user.id, problemId, status: 'Correct' }); if (!alreadySolved) { const newSubmission = new Submission({ userId: req.user.id, username: user.username, problemId, problemTitle: problem.title, status: 'Correct' }); await newSubmission.save(); } } const scoreData = await Submission.aggregate([ { $match: { userId: new mongoose.Types.ObjectId(req.user.id), status: 'Correct' } }, { $group: { _id: "$problemId" } }, { $lookup: { from: 'problems', localField: '_id', foreignField: '_id', as: 'problemDetails' } }, { $unwind: '$problemDetails' }, { $group: { _id: null, score: { $sum: '$problemDetails.marks' } } } ]); const newTotalScore = scoreData.length > 0 ? scoreData[0].score : 0; res.json({ success: allTestsPassed, results: results, newTotalScore: newTotalScore }); });
app.get('/api/leaderboard', async (req, res) => { try { const leaderboard = await Submission.aggregate([ { $match: { status: 'Correct' } }, { $group: { _id: { userId: "$userId", problemId: "$problemId", username: "$username" } } }, { $lookup: { from: 'problems', localField: '_id.problemId', foreignField: '_id', as: 'problemDetails' }}, { $unwind: '$problemDetails' }, { $group: { _id: '$_id.username', score: { $sum: '$problemDetails.marks' } }}, { $sort: { score: -1 } }, { $project: { _id: 0, username: '$_id', score: 1 } } ]); res.json(leaderboard); } catch(err) { console.error("Leaderboard Error:", err); res.status(500).json({ msg: 'Error fetching leaderboard' }); } });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));