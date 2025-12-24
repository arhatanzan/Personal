import React from 'react';
import { Button, Form } from 'react-bootstrap';

const AdminHeader = ({ activePageId, pages, onSwitchPage, onAddPage, onLogout, onToggleAll, onPreview, onDownload, onReset, hasChanges }) => {
  return (
    <div className="sticky-header">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-3 flex-grow-1">
                <h1 className="h2 m-0 text-nowrap">Site Admin</h1>
                <div className="d-flex align-items-center bg-white rounded border p-1 shadow-sm">
                    <Form.Select 
                        size="sm" 
                        className="border-0" 
                        style={{width: 'auto', minWidth: '150px', maxWidth: '300px'}}
                        value={activePageId || 'home'}
                        onChange={(e) => onSwitchPage(e.target.value === 'home' ? null : e.target.value)}
                    >
                        <option value="home">Home Page</option>
                        {pages.map(pageId => (
                            <option key={pageId} value={pageId}>{pageId}</option>
                        ))}
                    </Form.Select>
                    <div className="vr mx-2"></div>
                    <Button variant="link" size="sm" className="text-decoration-none p-0 px-2" onClick={onAddPage} title="New Page">
                        <i className="fas fa-plus-circle text-primary fs-5"></i>
                    </Button>
                </div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
                <Button variant="outline-info" size="sm" className="shadow-sm" onClick={onPreview} title="Preview Data"><i className="fas fa-code"></i></Button>
                <Button variant="outline-secondary" size="sm" className="shadow-sm" onClick={onDownload} title="Download Data"><i className="fas fa-download"></i></Button>
                <Button variant="outline-warning" size="sm" className="shadow-sm" onClick={onReset} disabled={!hasChanges} title="Reset Changes"><i className="fas fa-undo"></i></Button>
                <div className="vr mx-1"></div>
                <a href="/changelog" className="btn btn-outline-secondary btn-sm shadow-sm">
                    <i className="fas fa-history me-1"></i> Logs
                </a>
                <div className="btn-group shadow-sm">
                    <Button variant="light" size="sm" className="border" onClick={() => onToggleAll(true)} title="Expand All"><i className="fas fa-expand-alt"></i></Button>
                    <Button variant="light" size="sm" className="border" onClick={() => onToggleAll(false)} title="Collapse All"><i className="fas fa-compress-alt"></i></Button>
                </div>
                <Button variant="danger" size="sm" className="shadow-sm" onClick={onLogout}><i className="fas fa-sign-out-alt me-1"></i> Logout</Button>
            </div>
        </div>
    </div>
  );
};

export default AdminHeader;
