// =================================================================
// == components/CreateProblem.js - FINAL SIMPLIFIED VERSION      ==
// =================================================================
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

function CreateProblem() {
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('python');
    const [marks, setMarks] = useState(10);
    const [buggyCode, setBuggyCode] = useState('');
    const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleGenerate = async () => { /* ... Unchanged ... */ };
    const handleTestCaseChange = (i, e) => { /* ... Unchanged ... */ };
    const addTestCase = () => setTestCases([...testCases, { input: '', expectedOutput: '' }]);
    const removeTestCase = (i) => { const v = [...testCases]; v.splice(i, 1); setTestCases(v); };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- NO MORE SEPARATOR LOGIC! EVER! ---
        const newProblem = { title, description, language, marks, buggyCode, testCases };
        try {
            await axios.post('http://localhost:5000/api/admin/problems', newProblem);
            setMessage('Problem created successfully! Redirecting...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) { setMessage('Error creating problem.'); console.error(err); }
    };
    
    // Re-pasting for completeness
    const handleGenerateFull = async () => { if (!aiPrompt) { alert("Please enter a prompt for the AI."); return; } setIsGenerating(true); setMessage('Generating with AI...'); try { const res = await axios.post('http://localhost:5000/api/admin/generate-problem', { prompt: aiPrompt, language }); setTitle(res.data.title); setDescription(res.data.description); setBuggyCode(res.data.code); if (res.data.testCases && res.data.testCases.length > 0) { setTestCases(res.data.testCases); } setMessage('AI generation complete! Now you can introduce a bug.'); setTimeout(() => setMessage(''), 5000); } catch (err) { setMessage('Error generating from AI.'); console.error(err); } setIsGenerating(false); };
    const handleTestCaseChangeFull = (i, e) => { const v = [...testCases]; v[i][e.target.name] = e.target.value; setTestCases(v); };

    return (
        <div className="admin-form-container">
            <h1>Create New Problem</h1>
            <div className="ai-generator-section"><h2>Generate with AI</h2><p>Enter a simple prompt and let the AI create the problem foundation for you.</p><div className="form-group"><label>AI Prompt</label><input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., a python function to check for a palindrome" /></div><button type="button" onClick={handleGenerateFull} disabled={isGenerating} className="generate-btn">{isGenerating ? 'Generating...' : 'Generate with AI'}</button></div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="form-group"><label>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
                <div className="form-group-inline"><div className="form-group"><label>Language</label><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="javascript">JavaScript</option><option value="python">Python</option><option value="c">C</option><option value="cpp">C++</option><option value="java">Java</option></select></div><div className="form-group"><label>Marks</label><input type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} required /></div></div>
                <div className="form-group">
                    <label>Buggy Code</label>
                    <p style={{color: '#aaa', marginTop: '-10px', fontSize: '14px'}}>
                        Provide the complete, runnable code for the problem. The user will see this entire code block.
                    </p>
                    <Editor height="30vh" language={language} value={buggyCode} onChange={(v) => setBuggyCode(v || '')} theme="vs-dark" />
                </div>
                <div className="form-group"><label>Test Cases</label>{testCases.map((tc, i) => (<div key={i} className="test-case-group"><textarea name="input" placeholder={`Input #${i + 1}`} value={tc.input} onChange={(e) => handleTestCaseChangeFull(i, e)} /><textarea name="expectedOutput" placeholder={`Output #${i + 1}`} value={tc.expectedOutput} onChange={(e) => handleTestCaseChangeFull(i, e)} required /><button type="button" onClick={() => removeTestCase(i)} className="remove-btn">-</button></div>))}{<button type="button" onClick={addTestCase} className="add-btn">+</button>}</div>
                <button type="submit" className="submit-problem-btn">Create Final Problem</button>
            </form>
        </div>
    );
}

export default CreateProblem;