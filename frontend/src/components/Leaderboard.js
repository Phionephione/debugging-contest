import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
function Leaderboard() {
const [board, setBoard] = useState([]); const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(true); const [loading, setLoading] = useState(true);
useEffect(() => { const fetchAll = async () => { try { const settingsRes = await axios.get(${API_URL}/api/settings); setIsLeaderboardVisible(settingsRes.data.isLeaderboardVisible); if (settingsRes.data.isLeaderboardVisible) { const boardRes = await axios.get(${API_URL}/api/leaderboard); setBoard(boardRes.data); } setLoading(false); } catch (err) { setLoading(false); } }; fetchAll(); }, []);
if (loading) return <div>Loading...</div>;
if (!isLeaderboardVisible) { return (<div><h1>Leaderboard</h1><p>Leaderboard is disabled.</p></div>); }
return (
<div><h1>Leaderboard</h1><table className="leaderboard-table"><thead><tr><th>Rank</th><th>Username</th><th>Total Marks</th></tr></thead><tbody>{board.map((user, index) => (<tr key={user.username}><td className="rank">{index + 1}</td><td>{user.username}</td><td>{user.score}</td></tr>))}</tbody></table></div>
);
}
export default Leaderboard;