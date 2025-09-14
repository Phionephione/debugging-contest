import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        axios.get(`${API_URL}/api/problems/${id}`)
            .then(res => {
                setProblem(res.data);
                setMarks(res.data.marks || 0);
                setCode(res.data.buggyCode);
            })
            .catch(err => { setCode('// Could not load problem.'); });
    }, [id]);
    const handleRun = async () => {
        setIsRunning(true);
        setOutput('Running your code...');
        try {
            const res = await axios.post(`${API_URL}/api/run`, { problemId: id, language: problem.language, code, input: customInput });
            setOutput(res.data.output);
        } catch (err) {
            setOutput('An error occurred while running the code.');
        }
        setIsRunning(false);
    };
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setOutput('Submitting...');
        try {
            const res = await axios.post(`${API_URL}/api/submit`, { problemId: id, code });
            const newScore = res.data.newTotalScore;
            if (res.data.success) {
                setOutput('--- VERDICT: ACCEPTED ---\n\nAll hidden test cases passed.');
                updateScore(newScore);
            } else {
                const failedTest = res.data.results.find(r => !r.passed);
                const errorReport = `--- VERDICT: INCORRECT ---\n\nTest failed on a hidden test case.\n\nInput:\n${failedTest.input}\n\nExpected Output:\n${failedTest.expected}\n\nYour Output:\n${failedTest.output}`;
                setOutput(errorReport);
                updateScore(newScore);
            }
        } catch (err) {
            setOutput('An error occurred during submission.');
        }
        setIsSubmitting(false);
    };
    if (!problem) return <h2>Loading problem details...</h2>;
    return (
        <div className="editor-page-container"><div className="problem-header"><h2>{problem.title}</h2><span className="marks-tag-large">{marks} Marks</span></div><div className="editor-layout-container"><div className="editor-column"><Editor height="65vh" language={problem.language} value={code} onChange={(v) => setCode(v || '')} theme="vs-dark" /></div><div className="output-column"><div className="run-container"><h3>Custom Input</h3><textarea className="custom-input-box" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Enter custom input..."/></div><h3>Output</h3><pre className="output-box">{output}</pre></div></div><div className="button-container"><button onClick={handleRun} disabled={isRunning} className="run-btn">{isRunning ? 'Running...' : 'Run Code'}</button><button onClick={handleSubmit} disabled={isSubmitting} className="submit-btn">{isSubmitting ? 'Submitting...' : 'Submit Final'}</button></div></div>
    );
}
export default EditorPage;