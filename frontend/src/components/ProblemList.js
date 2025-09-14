import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ProblemList() {
    const [groupedProblems, setGroupedProblems] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        axios.get(`${API_URL}/api/problems`)
            .then(res => {
                const groups = res.data.reduce((acc, problem) => { const lang = problem.language || 'uncategorized'; if (!acc[lang]) acc[lang] = []; acc[lang].push(problem); return acc; }, {});
                setGroupedProblems(groups);
                setLoading(false);
            })
            .catch(err => { setLoading(false); });
    }, []);
    if (loading) return <div>Loading challenges...</div>;
    return (
        <div className="problem-list-container">
            <h1>Debugging Challenges</h1>
            {Object.keys(groupedProblems).length === 0 ? (<p>No problems available yet.</p>) : (Object.keys(groupedProblems).map(language => (<div key={language} className="language-category"><h2 className="language-header">{language}</h2><div className="problem-grid">{groupedProblems[language].map((p, index) => (<Link to={`/problem/${p._id}`} key={p._id} className="problem-tile"><span className="problem-number">{index + 1}</span><div className="problem-hover-info"><h3>{p.title}</h3><span className="marks-tag-hover">{p.marks} Marks</span></div></Link>))}</div></div>)))}
        </div>
    );
}
export default ProblemList;