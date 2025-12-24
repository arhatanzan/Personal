import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Modal, Toast, ToastContainer, InputGroup } from 'react-bootstrap';
import AdminHeader from '../components/admin/AdminHeader';
import ProfileEditor from '../components/admin/ProfileEditor';
import ListEditor from '../components/admin/ListEditor';
import FooterEditor from '../components/admin/FooterEditor';
import ThemeSettings from '../components/admin/ThemeSettings';
import '../admin.css';

const Admin = ({ initialData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteData, setSiteData] = useState(initialData);
  const [activePageId, setActivePageId] = useState(null);
  
  const [expandedSections, setExpandedSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageId, setNewPageId] = useState('');
  const [addPageError, setAddPageError] = useState('');

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

  const getCurrentPageData = () => {
      if (!siteData) return null;
      if (!activePageId) return siteData; // Home page (root)
      return siteData.pages?.[activePageId];
  };

  const updateSiteData = (newData) => {
      if (!activePageId) {
          setSiteData(newData);
      } else {
          setSiteData({
              ...siteData,
              pages: {
                  ...siteData.pages,
                  [activePageId]: newData
              }
          });
      }
  };

  const handleSectionChange = (sectionKey, newValue) => {
      const currentData = getCurrentPageData();
      const newData = { ...currentData, [sectionKey]: newValue };
      updateSiteData(newData);
  };

  const handleSave = async () => {
      setSaving(true);
      try {
        let endpoint = '/.netlify/functions/save-data';
        if (window.location.hostname === 'localhost' && window.location.port === '5173') {
            endpoint = '/.netlify/functions/save-data';
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                password: localStorage.getItem('adminPassword'),
                data: siteData 
            })
        });
        
        if (response.ok) {
            setToastMessage('Changes saved successfully!');
            setShowToast(true);
        } else {
            const data = await response.json();
            alert('Failed to save: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
          alert('Error saving data: ' + err.message);
      } finally {
          setSaving(false);
      }
  };

  const handleDownload = () => {
      const dataStr = JSON.stringify(siteData, null, 4);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleReset = () => {
      if (window.confirm('Are you sure you want to discard all changes?')) {
          setSiteData(initialData);
          setToastMessage('Changes discarded.');
          setShowToast(true);
      }
  };

  const handleCreatePage = () => {
      if (!newPageId) {
          setAddPageError('Page ID is required');
          return;
      }
      if (siteData.pages && siteData.pages[newPageId]) {
          setAddPageError('Page ID already exists');
          return;
      }
      
      const newPage = {
          sectionOrder: ['profile', 'footer'],
          // Inherit other properties implicitly or explicitly if needed
      };

      setSiteData({
          ...siteData,
          pages: {
              ...(siteData.pages || {}),
              [newPageId]: newPage
          }
      });
      
      setActivePageId(newPageId);
      setShowAddPage(false);
      setNewPageId('');
      setAddPageError('');
      setToastMessage(`Page "${newPageId}" created!`);
      setShowToast(true);
  };

  const toggleSection = (section) => {
      setExpandedSections(prev => ({
          ...prev,
          [section]: !prev[section]
      }));
  };

  const moveSection = (index, direction) => {
      const currentData = getCurrentPageData();
      const newOrder = [...(currentData.sectionOrder || [])];
      if (direction === 'up' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      handleSectionChange('sectionOrder', newOrder);
  };

  const handleDeletePage = () => {
      if (!activePageId) return;
      if (window.confirm(`Are you sure you want to delete page '${activePageId}'? This cannot be undone.`)) {
          const newPages = { ...siteData.pages };
          delete newPages[activePageId];
          setSiteData({ ...siteData, pages: newPages });
          setActivePageId(null);
          setToastMessage(`Page "${activePageId}" deleted.`);
          setShowToast(true);
      }
  };

  const updatePageId = (newId) => {
      if (!activePageId || !newId || newId === activePageId) return;
      const sanitizedId = newId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      if (siteData.pages && siteData.pages[sanitizedId]) {
          alert("Page ID already exists!");
          return;
      }

      const newPages = { ...siteData.pages };
      newPages[sanitizedId] = newPages[activePageId];
      delete newPages[activePageId];
      
      setSiteData({ ...siteData, pages: newPages });
      setActivePageId(sanitizedId);
      setToastMessage(`Page renamed to "${sanitizedId}".`);
      setShowToast(true);
  };

  const handleInheritanceChange = (type, isInheriting) => {
      const currentPage = { ...siteData.pages[activePageId] };
      
      if (type === 'theme') {
          if (isInheriting) delete currentPage.theme;
          else currentPage.theme = JSON.parse(JSON.stringify(siteData.theme || { buttonColors: ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'] }));
      } else if (type === 'profile') {
          if (isInheriting) delete currentPage.profile;
          else currentPage.profile = { name: "New Page", subtitle: "", image: "" };
      } else if (type === 'useGlobalFooter') {
          currentPage.useGlobalFooter = isInheriting;
      }

      setSiteData({
          ...siteData,
          pages: {
              ...siteData.pages,
              [activePageId]: currentPage
          }
      });
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

  const currentData = getCurrentPageData();
  if (!currentData) return <div className="p-5 text-center">Loading data...</div>;

  const pages = siteData && siteData.pages ? Object.keys(siteData.pages) : [];
  const sectionOrder = currentData.sectionOrder || ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
  const themeColors = siteData.theme?.buttonColors;
  const hasChanges = JSON.stringify(siteData) !== JSON.stringify(initialData);

  return (
      <div className="admin-panel">
          <AdminHeader 
              activePageId={activePageId}
              pages={pages}
              onSwitchPage={setActivePageId}
              onAddPage={() => setShowAddPage(true)}
              onLogout={handleLogout}
              onToggleAll={(expand) => {
                  const newExpanded = {};
                  sectionOrder.forEach(s => newExpanded[s] = expand);
                  newExpanded['theme'] = expand;
                  setExpandedSections(newExpanded);
              }}
              onPreview={() => setShowPreview(true)}
              onDownload={handleDownload}
              onReset={handleReset}
              hasChanges={hasChanges}
          />
          <Container className="mt-4 pb-5">
              <div className="scrollable-content">
                  <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      Currently viewing: <strong>{activePageId || 'Home Page'}</strong>
                  </Alert>

                  {activePageId && (
                      <div className="card mb-4 border-warning">
                          <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                              <h5 className="m-0"><i className="fas fa-cog me-2"></i>Page Configuration: {activePageId}</h5>
                          </div>
                          <div className="card-body">
                              <h6 className="border-bottom pb-2 mb-3">General Settings</h6>
                              <div className="row g-3 align-items-end mb-4">
                                  <div className="col-md-8">
                                      <Form.Group>
                                          <Form.Label>Page ID (URL slug)</Form.Label>
                                          <InputGroup>
                                              <InputGroup.Text>?page=</InputGroup.Text>
                                              <Form.Control 
                                                  type="text" 
                                                  defaultValue={activePageId} 
                                                  onBlur={(e) => updatePageId(e.target.value)}
                                                  key={activePageId} // Force re-render on ID change
                                              />
                                          </InputGroup>
                                      </Form.Group>
                                  </div>
                                  <div className="col-md-4">
                                      <Button variant="danger" className="w-100" onClick={handleDeletePage}>
                                          <i className="fas fa-trash me-2"></i>Delete Page
                                      </Button>
                                  </div>
                              </div>

                              <h6 className="border-bottom pb-2 mb-3">Global Inheritance</h6>
                              <div className="row g-3">
                                  <div className="col-12">
                                      <Form.Check 
                                          type="switch"
                                          id="useGlobalTheme"
                                          label={<strong>Inherit Global Theme</strong>}
                                          checked={!currentData.theme}
                                          onChange={(e) => handleInheritanceChange('theme', e.target.checked)}
                                          className="mb-2"
                                      />
                                      <Form.Check 
                                          type="switch"
                                          id="useGlobalProfile"
                                          label={<strong>Inherit Global Profile</strong>}
                                          checked={!currentData.profile}
                                          onChange={(e) => handleInheritanceChange('profile', e.target.checked)}
                                          className="mb-2"
                                      />
                                      <Form.Check 
                                          type="switch"
                                          id="useGlobalFooter"
                                          label={<strong>Inherit Global Footer</strong>}
                                          checked={currentData.useGlobalFooter !== false}
                                          onChange={(e) => handleInheritanceChange('useGlobalFooter', e.target.checked)}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                  
                  {/* Theme Settings (Global) */}
                  {!activePageId && (
                      <ThemeSettings 
                          theme={siteData.theme || {}} 
                          onChange={(newTheme) => updateSiteData({...siteData, theme: newTheme})}
                          isOpen={expandedSections['theme']}
                          onToggle={() => toggleSection('theme')}
                      />
                  )}

                  {sectionOrder.map((sectionKey, index) => {
                      const isFirst = index === 0;
                      const isLast = index === sectionOrder.length - 1;
                      const commonProps = {
                          isOpen: expandedSections[sectionKey],
                          onToggle: () => toggleSection(sectionKey),
                          onMoveUp: () => moveSection(index, 'up'),
                          onMoveDown: () => moveSection(index, 'down'),
                          isFirst,
                          isLast
                      };

                      if (sectionKey === 'profile') {
                          return (
                              <div key={sectionKey} className="section-card mb-3">
                                  <div className={`section-header ${expandedSections[sectionKey] ? 'active' : ''}`} onClick={() => toggleSection(sectionKey)}>
                                      <div className="d-flex align-items-center gap-3 flex-grow-1">
                                          <h2 className="m-0 fs-5">Profile</h2>
                                          <div className="d-flex gap-1 ms-auto me-3" onClick={(e) => e.stopPropagation()}>
                                              <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={() => moveSection(index, 'up')} disabled={isFirst}><i className="fas fa-arrow-up"></i></Button>
                                              <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={() => moveSection(index, 'down')} disabled={isLast}><i className="fas fa-arrow-down"></i></Button>
                                          </div>
                                      </div>
                                      <i className="fas fa-chevron-down toggle-icon"></i>
                                  </div>
                                  {expandedSections[sectionKey] && (
                                      <div className="section-content">
                                          <ProfileEditor 
                                              profile={currentData.profile || {}} 
                                              onChange={(newProfile) => handleSectionChange('profile', newProfile)}
                                              isSubPage={!!activePageId}
                                              useGlobal={!currentData.profile}
                                              onToggleGlobal={(val) => handleInheritanceChange('profile', val)}
                                          />
                                      </div>
                                  )}
                              </div>
                          );
                      }

                      if (sectionKey === 'footer') {
                          return (
                              <div key={sectionKey} className="mb-3">
                                  <FooterEditor 
                                      footer={{ text: currentData.footer }} 
                                      onChange={(newFooter) => handleSectionChange('footer', newFooter.text)}
                                      {...commonProps}
                                  />
                              </div>
                          );
                      }

                      // List Editors
                      let title = sectionKey;
                      let itemTemplate = {};
                      
                      if (sectionKey === 'socialLinks') {
                          title = 'Social Links';
                          itemTemplate = { text: 'New Link', url: '#' };
                      } else if (sectionKey === 'workLinks') {
                          title = 'Work Links';
                          itemTemplate = { text: 'New Work', url: '#' };
                      } else if (sectionKey === 'publications') {
                          title = 'Publications';
                          itemTemplate = { title: 'New Book', subtitle: '', description: '', text: 'Read', url: '#' };
                      } else if (sectionKey === 'connectLinks') {
                          title = 'Connect Icons';
                          itemTemplate = { icon: 'fab fa-link', url: '#' };
                      }

                      return (
                          <div key={sectionKey} className="mb-3">
                              <ListEditor 
                                  title={title}
                                  items={currentData[sectionKey] || []}
                                  onChange={(newItems) => handleSectionChange(sectionKey, newItems)}
                                  themeColors={themeColors}
                                  itemTemplate={itemTemplate}
                                  {...commonProps}
                              />
                          </div>
                      );
                  })}

              </div>
          </Container>

          {/* Floating Save Button */}
          <div className="position-fixed bottom-0 end-0 p-4" style={{zIndex: 1000}}>
              <Button variant={hasChanges ? "success" : "secondary"} size="lg" className="shadow rounded-pill px-4" onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? (
                      <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                      </>
                  ) : (
                      <>
                          <i className="fas fa-save me-2"></i> {hasChanges ? 'Save Changes' : 'No Changes'}
                      </>
                  )}
              </Button>
          </div>

          <ToastContainer position="bottom-start" className="p-3">
              <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="success">
                  <Toast.Header closeButton={false} className="text-success">
                      <strong className="me-auto">Success</strong>
                  </Toast.Header>
                  <Toast.Body className="text-white">{toastMessage}</Toast.Body>
              </Toast>
          </ToastContainer>

          <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
              <Modal.Header closeButton>
                  <Modal.Title>Preview Data</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <pre className="bg-light p-3 border rounded" style={{maxHeight: '500px', overflow: 'auto'}}>
                      {JSON.stringify(siteData, null, 4)}
                  </pre>
              </Modal.Body>
              <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowPreview(false)}>Close</Button>
              </Modal.Footer>
          </Modal>

          <Modal show={showAddPage} onHide={() => setShowAddPage(false)}>
              <Modal.Header closeButton>
                  <Modal.Title>Create New Page</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <Form.Group className="mb-3">
                      <Form.Label>Page ID (Slug)</Form.Label>
                      <Form.Control 
                          type="text" 
                          placeholder="e.g. my-book" 
                          value={newPageId} 
                          onChange={(e) => setNewPageId(e.target.value)} 
                      />
                      <Form.Text className="text-muted">
                          This will be used in the URL: ?page=your-id
                      </Form.Text>
                  </Form.Group>
                  {addPageError && <Alert variant="danger">{addPageError}</Alert>}
              </Modal.Body>
              <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowAddPage(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleCreatePage}>Create Page</Button>
              </Modal.Footer>
          </Modal>
      </div>
  );
};

export default Admin;
