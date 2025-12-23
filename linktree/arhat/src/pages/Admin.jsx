import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Modal } from 'react-bootstrap';
import '../admin.css';

const Admin = ({ initialData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState(initialData);

  useEffect(() => {
    const token = localStorage.getItem('adminPassword');
    if (token) {
        // Simple session check
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime && (Date.now() - parseInt(loginTime) < 30 * 60 * 1000)) {
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('adminPassword');
        }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const endpoint = window.location.port === '5173' ? '/.netlify/functions/login' : '/.netlify/functions/login'; 
        // Vite runs on 5173 usually.
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('adminPassword', password);
            localStorage.setItem('loginTime', Date.now());
            setIsAuthenticated(true);
        } else {
            setError(data.message || 'Invalid password');
        }
    } catch (err) {
        setError('Login failed. Ensure backend is running.');
    } finally {
        setLoading(false);
    }
  };

  if (!isAuthenticated) {
      return (
          <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
              <div className="card p-4 shadow-sm" style={{maxWidth: '400px', width: '100%'}}>
                  <h3 className="text-center mb-4">Admin Login</h3>
                  {error && <Alert variant="danger">{error}</Alert>}
                  <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control 
                              type="password" 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              required 
                          />
                      </Form.Group>
                      <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                          {loading ? 'Verifying...' : 'Login'}
                      </Button>
                  </Form>
              </div>
          </div>
      );
  }

  return (
      <div className="admin-panel">
          <Container>
              <h1>Admin Dashboard</h1>
              <p>Welcome back. Migration in progress.</p>
              <Button variant="danger" onClick={() => {
                  localStorage.removeItem('adminPassword');
                  setIsAuthenticated(false);
              }}>Logout</Button>
          </Container>
      </div>
  );
};

export default Admin;
