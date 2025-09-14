import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminLogin({ handleLogin }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const { email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/admin/login`, { email, password });
            handleLogin(res.data.token);
            navigate('/admin');
        } catch (err) {
            alert(err.response.data.msg || 'Invalid credentials or not an admin');
        }
    };
    return (
        <div className="auth-container">
            <h1>Admin Login</h1>
            <form onSubmit={onSubmit}><input type="email" name="email" value={email} onChange={onChange} placeholder="Admin Email" required /><input type="password" name="password" value={password} onChange={onChange} placeholder="Admin Password" required /><button type="submit">Login as Admin</button></form>
            <p><Link to="/login">Back to User Login</Link></p>
        </div>
    );
}
export default AdminLogin;