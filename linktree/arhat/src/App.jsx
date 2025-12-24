import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Changelog from './pages/Changelog';

function App() {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        setSiteData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load site data", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home siteData={siteData} />} />
        <Route path="/admin" element={<Admin initialData={siteData} />} />
        <Route path="/changelog" element={<Changelog />} />
      </Routes>
    </Router>
  );
}

export default App;
