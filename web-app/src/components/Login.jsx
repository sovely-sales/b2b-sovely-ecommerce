import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('accessToken', data.data.accessToken);
        navigate('/');
      } else {
        throw new Error(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError(err.message || 'Error logging in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="navbar-logo" style={{ justifyContent: 'center', marginBottom: '24px', display: 'flex', textDecoration: 'none' }}>
            <span className="logo-icon" style={{ fontSize: '1.8rem' }}>🛒</span>
            <span className="logo-text" style={{ fontSize: '1.8rem' }}>Sovely</span>
          </Link>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-options">
            <label className="checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
