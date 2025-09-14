import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Login({ handleLogin }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const { email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            handleLogin(res.data.token);
            navigate('/');
        } catch (err) {
            alert('Invalid credentials');
        }
    };
    return (
        <div className="auth-container">
            <h1>Login</h1>
            <form onSubmit={onSubmit}><input type="email" name="email" value={email} onChange={onChange} placeholder="Email" required /><input type="password" name="password" value={password} onChange={onChange} placeholder="Password" required /><button type="submit">Login</button></form>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
            <p className="admin-login-link"><Link to="/admin-login">Login as Admin</Link></p>
        </div>
    );
}
export default Login;