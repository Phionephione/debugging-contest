// =================================================================
// == components/ProblemList.js - FINAL WITH CHALLENGE GRID       ==
// =================================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ProblemList() {
    const [groupedProblems, setGroupedProblems] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:5000/api/problems')
            .then(res => {
                const groups = res.data.reduce((acc, problem) => {
                    const lang = problem.language || 'uncategorized';
                    if (!acc[lang]) acc[lang] = [];
                    acc[lang].push(problem);
                    return acc;
                }, {});
                setGroupedProblems(groups);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading challenges...</div>;

    return (
        <div className="problem-list-container">
            <h1>Debugging Challenges</h1>
            {Object.keys(groupedProblems).length === 0 ? (
                <p>No problems available yet.</p>
            ) : (
                // Map over each language category (e.g., "python", "javascript")
                Object.keys(groupedProblems).map(language => (
                    <div key={language} className="language-category">
                        <h2 className="language-header">{language}</h2>
                        
                        {/* This is the new grid container for the numbered boxes */}
                        <div className="problem-grid">
                            {/* Map over the problems within that category */}
                            {groupedProblems[language].map((p, index) => (
                                <Link to={`/problem/${p._id}`} key={p._id} className="problem-tile">
                                    {/* The number for the box */}
                                    <span className="problem-number">{index + 1}</span>
                                    
                                    {/* The hidden info that appears on hover */}
                                    <div className="problem-hover-info">
                                        <h3>{p.title}</h3>
                                        <span className="marks-tag-hover">{p.marks} Marks</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default ProblemList;