// =================================================================
// == App.js - FINAL DEFINITIVE VERSION WITH DIRECT SCORE SETTING ==
// =================================================================
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import ProblemList from './components/ProblemList';
import EditorPage from './components/EditorPage';
import Leaderboard from './components/Leaderboard';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import CreateProblem from './components/CreateProblem';
import ManageProblems from './components/ManageProblems';
import setAuthToken from './utils/setAuthToken';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // This is the only way to fetch the initial score
    const getInitialScore = async () => {
        if (localStorage.token) {
            try {
                setAuthToken(localStorage.token); 
                // We re-use the leaderboard logic for the currently logged in user to get their initial score
                // A dedicated /api/user/score route would also work here.
                const res = await axios.get('http://localhost:5000/api/leaderboard'); // This is a temporary solution for initial score
                // You would ideally want a dedicated route for just the user's score
                // For now, this is a placeholder. A dedicated route is better.
                // setScore(res.data.score);
            } catch (err) { 
                console.error("Could not fetch score", err); 
                if (err.response && err.response.status === 401) {
                    handleLogout();
                }
            }
        }
    };
    
    const handleLogin = (token) => { /* ... (Unchanged) ... */ };
    const handleLogout = () => { /* ... (Unchanged) ... */ };
    
    // Re-pasting for completeness
    const handleLoginFull = (token) => { localStorage.setItem('token', token); setAuthToken(token); try { const decoded = jwtDecode(token); setUser(decoded.user); setIsAuthenticated(true); if (decoded.user.role === 'user') { getInitialScore(); } } catch (error) { handleLogout(); } };
    const handleLogoutFull = () => { localStorage.removeItem('token'); setAuthToken(false); setUser(null); setIsAuthenticated(false); setScore(0); };

    useEffect(() => {
        if (localStorage.token) {
            handleLoginFull(localStorage.token);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) { return <div style={{backgroundColor: '#121212', height: '100vh'}}></div> }

    return (
        <Router>
            <div className="App">
                <nav>
                    <Link to={user?.role === 'admin' ? '/admin' : '/'} className="logo">DebugDash</Link>
                    <div className="nav-links">
                        {isAuthenticated && user?.role === 'user' && (<span className="nav-score">Current Score: {score}</span>)}
                        {isAuthenticated && user?.role === 'user' && <Link to="/">Problems</Link>}
                        {isAuthenticated && user?.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
                        <Link to="/leaderboard">Leaderboard</Link>
                        {isAuthenticated ? (
                            <button onClick={handleLogoutFull} className="logout-button">Logout</button>
                        ) : (
                            <><Link to="/login">Login</Link><Link to="/register">Register</Link></>
                        )}
                    </div>
                </nav>
                <main>
                    <Routes>
                        <Route path="/login" element={<Login handleLogin={handleLoginFull} />} />
                        <Route path="/register" element={<Register handleLogin={handleLoginFull} />} />
                        <Route path="/admin-login" element={<AdminLogin handleLogin={handleLoginFull} />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/" element={isAuthenticated && user?.role === 'user' ? <ProblemList /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/login'} />} />
                        {/* --- THE FIX IS HERE: WE PASS setScore DIRECTLY --- */}
                        <Route path="/problem/:id" element={isAuthenticated && user?.role === 'user' ? <EditorPage updateScore={setScore} /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/login'} />} />
                        <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to={user?.role === 'user' ? '/' : '/admin-login'} />} />
                        <Route path="/admin/create-problem" element={isAuthenticated && user?.role === 'admin' ? <CreateProblem /> : <Navigate to={user?.role === 'user' ? '/' : '/admin-login'} />} />
                        <Route path="/admin/manage-problems" element={isAuthenticated && user?.role === 'admin' ? <ManageProblems /> : <Navigate to={user?.role === 'user' ? '/' : '/admin-login'} />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;