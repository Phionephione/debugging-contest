import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ManageProblems() {
    const [problems, setProblems] = useState([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [editingId, setEditingId] = useState(null); const [currentMarks, setCurrentMarks] = useState(0);
    useEffect(() => { fetchProblems(); }, []);
    const fetchProblems = () => { axios.get(`${API_URL}/api/problems?_=${new Date().getTime()}`).then(res => { setProblems(res.data); setLoading(false); }).catch(err => { setLoading(false); }); };
    const handleDelete = async (problemId) => { if (window.confirm('Are you sure?')) { try { const res = await axios.delete(`${API_URL}/api/admin/problems/${problemId}`); setMessage(res.data.msg || 'Deleted!'); setProblems(prev => prev.filter(p => p._id !== problemId)); setTimeout(() => setMessage(''), 3000); } catch (err) { setMessage(err.response?.data?.msg || 'Delete failed.'); setTimeout(() => setMessage(''), 3000); } } };
    const handleEditClick = (p) => { setEditingId(p._id); setCurrentMarks(p.marks); };
    const handleCancelEdit = () => setEditingId(null);
    const handleSaveMarks = async (problemId) => { try { const res = await axios.put(`${API_URL}/api/admin/problems/${problemId}`, { marks: currentMarks }); setMessage(`Marks for "${res.data.title}" updated!`); setEditingId(null); fetchProblems(); setTimeout(() => setMessage(''), 3000); } catch (err) { setMessage(err.response?.data?.msg || 'Update failed.'); setTimeout(() => setMessage(''), 3000); } };
    if (loading) return <div>Loading...</div>;
    return (
        <div className="admin-panel-container"><h1>Manage Problems</h1>{message && <p className="success-message">{message}</p>}<table className="admin-manage-table"><thead><tr><th>Title</th><th>Language</th><th>Marks</th><th>Actions</th></tr></thead><tbody>{problems.map(p => (<tr key={p._id}><td>{p.title}</td><td>{p.language}</td><td>{editingId === p._id ? (<input type="number" value={currentMarks} onChange={(e) => setCurrentMarks(Number(e.target.value))} className="marks-input"/>) : (p.marks)}</td><td className="actions-cell">{editingId === p._id ? (<><button onClick={() => handleSaveMarks(p._id)} className="save-btn">Save</button><button onClick={handleCancelEdit} className="cancel-btn">Cancel</button></>) : (<><button onClick={() => handleEditClick(p)} className="edit-btn">Edit</button><button onClick={() => handleDelete(p._id)} className="delete-btn">Delete</button></>)}</td></tr>))}</tbody></table></div>
    );
}
export default ManageProblems;