import React from 'react';
import { Form, Row, Col, Alert, Button } from 'react-bootstrap';

const ProfileEditor = ({ profile, onChange, isSubPage, useGlobal, onToggleGlobal }) => {
    if (isSubPage && useGlobal) {
        return (
            <Alert variant="info" className="mb-0">
                <i className="fas fa-info-circle me-2"></i>Using Global Profile. 
                <Button variant="link" size="sm" className="p-0 align-baseline ms-1" onClick={() => onToggleGlobal(false)}>Customize for this page</Button>
            </Alert>
        );
    }

    const updateField = (key, value) => {
        onChange({ ...profile, [key]: value });
    };

    return (
        <Row>
            <Col md={6} className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" value={profile.name || ''} onChange={(e) => updateField('name', e.target.value)} />
            </Col>
            <Col md={6} className="mb-3">
                <Form.Label>Subtitle</Form.Label>
                <Form.Control type="text" value={profile.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
            </Col>
            <Col xs={12} className="mb-3">
                <Form.Label>Image Path</Form.Label>
                <Form.Control type="text" value={profile.image || ''} onChange={(e) => updateField('image', e.target.value)} />
            </Col>
        </Row>
    );
};

export default ProfileEditor;
