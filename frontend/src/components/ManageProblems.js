// =================================================================
// == components/ManageProblems.js - FINAL WITH EDITABLE MARKS    ==
// =================================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageProblems() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // --- NEW STATE TO MANAGE EDITING ---
    const [editingId, setEditingId] = useState(null); // Which problem row is being edited
    const [currentMarks, setCurrentMarks] = useState(0); // The value in the input box

    useEffect(() => { fetchProblems(); }, []);

    const fetchProblems = () => {
        axios.get(`http://localhost:5000/api/problems?_=${new Date().getTime()}`)
            .then(res => { setProblems(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    };

    const handleDelete = async (problemId) => { /* ... (This function is unchanged) ... */ };

    // --- NEW FUNCTIONS TO HANDLE THE EDITING PROCESS ---
    const handleEditClick = (problem) => {
        setEditingId(problem._id); // Enter editing mode for this problem
        setCurrentMarks(problem.marks); // Set the input box to the current marks
    };

    const handleCancelEdit = () => {
        setEditingId(null); // Exit editing mode
    };

    const handleSaveMarks = async (problemId) => {
        try {
            const res = await axios.put(`http://localhost:5000/api/admin/problems/${problemId}`, { marks: currentMarks });
            setMessage(`Marks for "${res.data.title}" updated successfully!`);
            setEditingId(null); // Exit editing mode
            fetchProblems(); // Refresh the data to show the new marks
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Update failed.');
            setTimeout(() => setMessage(''), 3000);
            console.error(err);
        }
    };
    
    // Re-pasting delete function for completeness
    const handleDeleteFull = async (problemId) => { if (window.confirm('Are you sure you want to delete this problem permanently?')) { try { const res = await axios.delete(`http://localhost:5000/api/admin/problems/${problemId}`); setMessage(res.data.msg || 'Problem deleted successfully!'); fetchProblems(); setTimeout(() => setMessage(''), 3000); } catch (err) { setMessage(err.response ? err.response.data.msg : 'Deletion failed.'); setTimeout(() => setMessage(''), 3000); console.error(err); } } };


    if (loading) return <div>Loading problems...</div>;

    return (
        <div className="admin-panel-container">
            <h1>Manage Problems</h1>
            {message && <p className="success-message">{message}</p>}
            <table className="admin-manage-table">
                <thead><tr><th>Title</th><th>Language</th><th>Marks</th><th>Actions</th></tr></thead>
                <tbody>
                    {problems.map(p => (
                        <tr key={p._id}>
                            <td>{p.title}</td>
                            <td>{p.language}</td>
                            <td>
                                {editingId === p._id ? (
                                    // If in edit mode, show an input box
                                    <input
                                        type="number"
                                        value={currentMarks}
                                        onChange={(e) => setCurrentMarks(Number(e.target.value))}
                                        className="marks-input"
                                    />
                                ) : (
                                    // Otherwise, just show the marks
                                    p.marks
                                )}
                            </td>
                            <td className="actions-cell">
                                {editingId === p._id ? (
                                    // If in edit mode, show Save and Cancel buttons
                                    <>
                                        <button onClick={() => handleSaveMarks(p._id)} className="save-btn">Save</button>
                                        <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                                    </>
                                ) : (
                                    // Otherwise, show Edit and Delete buttons
                                    <>
                                        <button onClick={() => handleEditClick(p)} className="edit-btn">Edit</button>
                                        <button onClick={() => handleDeleteFull(p._id)} className="delete-btn">Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ManageProblems;