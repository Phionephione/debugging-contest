
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Check for required secrets on startup ---
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_API_KEY'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`FATAL ERROR: Environment variable ${varName} is not defined.`);
        process.exit(1);
    }
}

const User = require('./models/User');
const Settings = require('./models/Settings');
const Problem = require('./models/Problem');
const Submission = require('./models/Submission');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected...')).catch(err => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
});

// --- API Endpoints (No changes to most routes) ---
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
app.post('/api/admin/generate-problem', [auth, adminAuth], async (req, res) => { const { prompt, language } = req.body; try { const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"}); const fullPrompt = `You are an assistant that only responds with JSON. The user wants a problem generated in the language: **${language}**. Based on the user's request, generate a JSON object with "title", "description", "code", and "testCases". The "code" MUST be a complete, runnable program. The "testCases" MUST be an array of two distinct objects with "input" and "expectedOutput" string fields. User Request: "${prompt}"`; const result = await model.generateContent(fullPrompt); const responseText = result.response.text(); const jsonMatch = responseText.match(/\{[\s\S]*\}/); if (!jsonMatch) { throw new Error("AI did not return a parsable JSON object."); } const jsonString = jsonMatch[0]; const jsonResponse = JSON.parse(jsonString); res.json(jsonResponse); } catch (error) { console.error("AI Generation Error:", error); res.status(500).json({ msg: "Failed to generate or parse content from AI." }); } });

// --- THIS IS THE NEW, REUSABLE GEMINI COMPILER FUNCTION ---
const executeCodeWithGemini = async (language, code, input) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const masterPrompt = `You are a strict code interpreter. Act like an online compiler. Analyze the provided code and simulate its execution with the given input. Rules: 1. If there's a compile or syntax error, respond ONLY with the exact error message. 2. If there's a runtime error, respond ONLY with that error. 3. If the code runs successfully, respond ONLY with the program's final standard output. Do not add any extra text or explanations. Language: ${language}. Input (stdin): "${input || ''}". Code: \n\n${code}`;
        const result = await model.generateContent(masterPrompt);
        const output = result.response.text();
        return output.trim();
    } catch (e) {
        console.error("AI Run Error:", e);
        throw new Error("The AI compiler failed to run.");
    }
};

// --- "RUN" ROUTE NOW USES THE REUSABLE FUNCTION ---
app.post('/api/run', auth, async (req, res) => {
    try {
        const { language, code, input } = req.body;
        const output = await executeCodeWithGemini(language, code, input);
        res.json({ output });
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

// --- "SUBMIT" ROUTE NOW ALSO USES THE REUSABLE FUNCTION ---
app.post('/api/submit', auth, async (req, res) => {
    const { problemId, code } = req.body;
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ msg: 'Problem not found' });
    const user = await User.findById(req.user.id).select('-password');
    let allTestsPassed = true;
    let results = [];

    for (const test of problem.testCases) {
        try {
            const output = await executeCodeWithGemini(problem.language, code, test.input);
            if (output !== test.expectedOutput.trim()) {
                allTestsPassed = false;
                results.push({ input: test.input, output: output, expected: test.expectedOutput.trim(), passed: false });
                break;
            } else {
                results.push({ input: test.input, output: output, expected: test.expectedOutput.trim(), passed: true });
            }
        } catch (e) {
            allTestsPassed = false;
            results.push({ input: test.input, output: e.message, expected: test.expectedOutput.trim(), passed: false });
            break;
        }
    }
    
    if (allTestsPassed) { const alreadySolved = await Submission.findOne({ userId: req.user.id, problemId, status: 'Correct' }); if (!alreadySolved) { const newSubmission = new Submission({ userId: req.user.id, username: user.username, problemId, problemTitle: problem.title, status: 'Correct' }); await newSubmission.save(); } }
    const scoreData = await Submission.aggregate([ { $match: { userId: new mongoose.Types.ObjectId(req.user.id), status: 'Correct' } }, { $group: { _id: "$problemId" } }, { $lookup: { from: 'problems', localField: '_id', foreignField: '_id', as: 'problemDetails' } }, { $unwind: '$problemDetails' }, { $group: { _id: null, score: { $sum: '$problemDetails.marks' } } } ]);
    const newTotalScore = scoreData.length > 0 ? scoreData[0].score : 0;
    res.json({ success: allTestsPassed, results: results, newTotalScore: newTotalScore });
});

// --- LEADERBOARD ROUTE ---
app.get('/api/leaderboard', async (req, res) => { try { const leaderboard = await Submission.aggregate([ { $match: { status: 'Correct' } }, { $group: { _id: { userId: "$userId", problemId: "$problemId", username: "$username" } } }, { $lookup: { from: 'problems', localField: '_id.problemId', foreignField: '_id', as: 'problemDetails' }}, { $unwind: '$problemDetails' }, { $group: { _id: '$_id.username', score: { $sum: '$problemDetails.marks' } }}, { $sort: { score: -1 } }, { $project: { _id: 0, username: '$_id', score: 1 } } ]); res.json(leaderboard); } catch(err) { console.error("Leaderboard Error:", err); res.status(500).json({ msg: 'Error fetching leaderboard' }); } });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));