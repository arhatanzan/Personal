import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Modal } from 'react-bootstrap';
import AdminHeader from '../components/admin/AdminHeader';
import '../admin.css';

const Admin = ({ initialData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState(initialData);
  const [activePageId, setActivePageId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminPassword');
    if (token) {
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
        // Use relative endpoint for dev/prod compatibility
        let endpoint = '/.netlify/functions/login';
        // If running on localhost:5173 (Vite dev), use proxy (already set in vite.config.js)
        if (window.location.hostname === 'localhost' && window.location.port === '5173') {
            endpoint = '/.netlify/functions/login';
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && (data.success || data.message === 'Authenticated')) {
            localStorage.setItem('adminPassword', password);
            localStorage.setItem('loginTime', Date.now());
            setIsAuthenticated(true);
        } else {
            setError(data.message || data.error || 'Invalid password');
        }
    } catch (err) {
        setError('Login failed. Ensure backend is running.');
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('adminPassword');
      setIsAuthenticated(false);
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

  const pages = siteData && siteData.pages ? Object.keys(siteData.pages) : [];

  return (
      <div className="admin-panel">
          <AdminHeader 
              activePageId={activePageId}
              pages={pages}
              onSwitchPage={setActivePageId}
              onAddPage={() => alert('Add Page functionality to be implemented')}
              onLogout={handleLogout}
              onToggleAll={() => {}}
          />
          <Container className="mt-4">
              <div className="scrollable-content">
                  <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      Admin Panel Migration in Progress. Currently viewing: <strong>{activePageId || 'Home Page'}</strong>
                  </Alert>
                  {/* Form components will go here */}
              </div>
          </Container>
      </div>
  );
};

export default Admin;
