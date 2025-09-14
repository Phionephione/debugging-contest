// =================================================================
// == components/AdminPanel.js - FINAL WITH SCORE RESET           ==
// =================================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AdminPanel() {
    const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => { axios.get('http://localhost:5000/api/settings').then(res => { setIsLeaderboardVisible(res.data.isLeaderboardVisible); setLoading(false); }).catch(err => { console.error(err); setLoading(false); }); }, []);

    const handleToggleLeaderboard = () => { /* ... (Unchanged) ... */ };

    // --- NEW FUNCTION TO HANDLE RESETTING ALL SCORES ---
    const handleResetScores = async () => {
        const confirmation = window.prompt("This is a highly destructive action that cannot be undone. It will delete all user submissions and reset the leaderboard to zero. To confirm, please type 'RESET' in the box below.");
        if (confirmation === 'RESET') {
            try {
                const res = await axios.delete('http://localhost:5000/api/admin/reset-scores');
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
    
    // Re-pasting for completeness
    const handleToggleLeaderboardFull = () => { const newVisibility = !isLeaderboardVisible; axios.post('http://localhost:5000/api/admin/settings', { isLeaderboardVisible: newVisibility }).then(res => { setIsLeaderboardVisible(res.data.isLeaderboardVisible); setMessage('Settings updated successfully!'); setTimeout(() => setMessage(''), 3000); }).catch(err => { setMessage('Error: You do not have permission.'); setTimeout(() => setMessage(''), 3000); }); };

    if (loading) return <div>Loading admin panel...</div>;

    return (
        <div className="admin-panel-container">
            <h1>Admin Panel</h1>
            {message && <p className="success-message">{message}</p>}

            <div className="admin-setting">
                <h2>Problem Management</h2>
                <div className="admin-actions">
                    <Link to="/admin/create-problem" className="admin-action-btn create">Create New Problem</Link>
                    <Link to="/admin/manage-problems" className="admin-action-btn manage">Manage Problems</Link>
                </div>
            </div>

            <div className="admin-setting">
                <h2>Leaderboard Settings</h2>
                <p>Current Status: {isLeaderboardVisible ? 'Visible to Users' : 'Hidden from Users'}</p>
                <button onClick={handleToggleLeaderboardFull}>
                    {isLeaderboardVisible ? 'Turn Leaderboard OFF' : 'Turn Leaderboard ON'}
                </button>
            </div>

            {/* --- NEW DANGER ZONE SECTION --- */}
            <div className="admin-setting danger-zone">
                <h2>Danger Zone</h2>
                <p>Permanently delete all submission records and reset the leaderboard to zero for all users. This is for starting a new competition.</p>
                <button onClick={handleResetScores} className="reset-scores-btn">
                    Reset All Scores
                </button>
            </div>
        </div>
    );
}

export default AdminPanel;