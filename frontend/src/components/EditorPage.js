// =================================================================
// == components/EditorPage.js - FINAL SIMPLIFIED VERSION         ==
// =================================================================
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';

function EditorPage({ updateScore }) {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [code, setCode] = useState('// Loading code...');
    const [marks, setMarks] = useState(0);
    const [output, setOutput] = useState('Output will be displayed here.');
    const [customInput, setCustomInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/problems/${id}`)
            .then(res => {
                setProblem(res.data);
                setMarks(res.data.marks || 0);
                // --- NO MORE SEPARATOR! ---
                // The user now sees the entire buggy code from the database.
                setCode(res.data.buggyCode);
            })
            .catch(err => {
                console.log(err);
                setCode('// Could not load problem.');
            });
    }, [id]);

    const handleRun = async () => { /* ... Unchanged ... */ };
    const handleSubmit = async () => { /* ... Unchanged ... */ };

    // Re-pasting for completeness
    const handleRunFull = async () => { setIsRunning(true); setOutput('Running your code...'); try { const res = await axios.post('http://localhost:5000/api/run', { language: problem.language, code, input: customInput }); setOutput(res.data.output); } catch (err) { setOutput('An error occurred while running the code.'); console.error(err); } setIsRunning(false); };
    const handleSubmitFull = async () => { setIsSubmitting(true); setOutput('Asking the AI Judge for a verdict...'); try { const res = await axios.post('http://localhost:5000/api/submit', { problemId: id, code }); const newScore = res.data.newTotalScore; if (res.data.success) { setOutput('--- VERDICT: ACCEPTED ---\n\nThe AI Judge has determined your solution is correct.'); updateScore(newScore); } else { setOutput('--- VERDICT: INCORRECT ---\n\nThe AI Judge has determined your solution is not correct.'); updateScore(newScore); } } catch (err) { setOutput('An error occurred during submission.'); console.error(err); } setIsSubmitting(false); };

    if (!problem) return <h2>Loading problem details...</h2>;

    return (
        <div className="editor-page-container">
            <div className="problem-header"><h2>{problem.title}</h2><span className="marks-tag-large">{marks} Marks</span></div>
            <div className="editor-layout-container">
                <div className="editor-column"><Editor height="65vh" language={problem.language} value={code} onChange={(v) => setCode(v || '')} theme="vs-dark" /></div>
                <div className="output-column">
                    <div className="run-container"><h3>Custom Input</h3><textarea className="custom-input-box" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter custom input for the 'Run' button..." /></div>
                    <h3>Output</h3><pre className="output-box">{output}</pre>
                </div>
            </div>
            <div className="button-container">
                <button onClick={handleRunFull} disabled={isRunning} className="run-btn">{isRunning ? 'Running...' : 'Run Code'}</button>
                <button onClick={handleSubmitFull} disabled={isSubmitting} className="submit-btn">{isSubmitting ? 'Submitting...' : 'Submit to AI Judge'}</button>
            </div>
        </div>
    );
}

export default EditorPage;