import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminPanel() {
    const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    useEffect(() => {
        axios.get(`${API_URL}/api/settings`)
            .then(res => { setIsLeaderboardVisible(res.data.isLeaderboardVisible); setLoading(false); })
            .catch(err => { setLoading(false); });
    }, []);
    const handleToggleLeaderboard = () => {
        const newVisibility = !isLeaderboardVisible;
        axios.post(`${API_URL}/api/admin/settings`, { isLeaderboardVisible: newVisibility })
            .then(res => { setIsLeaderboardVisible(res.data.isLeaderboardVisible); setMessage('Settings updated!'); setTimeout(() => setMessage(''), 3000); })
            .catch(err => { setMessage('Error: No permission.'); setTimeout(() => setMessage(''), 3000); });
    };
    const handleResetScores = async () => {
        if (window.prompt("To confirm, type 'RESET'") === 'RESET') {
            try {
                const res = await axios.delete(`${API_URL}/api/admin/reset-scores`);
                setMessage(res.data.msg);
                setTimeout(() => setMessage(''), 4000);
            } catch (err) {
                setMessage(err.response?.data?.msg || 'Failed to reset scores.');
                setTimeout(() => setMessage(''), 4000);
            }
        } else {
            alert('Reset cancelled.');
        }
    };
    if (loading) return <div>Loading admin panel...</div>;
    return (
        <div className="admin-panel-container"><h1>Admin Panel</h1>{message && <p className="success-message">{message}</p>}<div className="admin-setting"><h2>Problem Management</h2><div className="admin-actions"><Link to="/admin/create-problem" className="admin-action-btn create">Create Problem</Link><Link to="/admin/manage-problems" className="admin-action-btn manage">Manage Problems</Link></div></div><div className="admin-setting"><h2>Leaderboard Settings</h2><p>Status: {isLeaderboardVisible ? 'Visible' : 'Hidden'}</p><button onClick={handleToggleLeaderboard}>{isLeaderboardVisible ? 'Turn OFF' : 'Turn ON'}</button></div><div className="admin-setting danger-zone"><h2>Danger Zone</h2><p>Permanently delete all submissions and reset scores to zero.</p><button onClick={handleResetScores} className="reset-scores-btn">Reset All Scores</button></div></div>
    );
}
export default AdminPanel;