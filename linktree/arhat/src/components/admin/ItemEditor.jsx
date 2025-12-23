import React from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';

const ItemEditor = ({ item, index, onChange, onRemove, themeColors }) => {
    const { title, subtitle, description, text, url, icon, customColor } = item;
    
    // Calculate default color for preview
    const colors = themeColors || ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];
    const defaultColor = colors[index % colors.length];
    const previewColor = customColor || defaultColor;

    const updateField = (field, value) => {
        onChange({ ...item, [field]: value });
    };

    // Special case for Connect Links (Icons)
    if (item.hasOwnProperty('icon') && !item.hasOwnProperty('title')) {
         return (
            <div className="item-card">
                <div className="item-header">
                    <span className="item-title">Icon #{index + 1}</span>
                    <Button variant="danger" size="sm" onClick={onRemove}>Remove</Button>
                </div>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Label>Icon Class</Form.Label>
                        <Form.Control type="text" value={icon || ''} onChange={(e) => updateField('icon', e.target.value)} />
                    </Col>
                    <Col md={6}>
                        <Form.Label>URL</Form.Label>
                        <Form.Control type="text" value={url || ''} onChange={(e) => updateField('url', e.target.value)} />
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div className="item-card" style={{borderLeft: `5px solid ${previewColor}`}}>
            <div className="item-header">
                <span className="item-title">Item #{index + 1}</span>
                <div className="d-flex align-items-center gap-2">
                    <InputGroup size="sm" style={{width: '140px'}} title="Override Button Color">
                        <InputGroup.Text className="p-1">
                            <div style={{width: '15px', height: '15px', backgroundColor: previewColor, borderRadius: '50%'}}></div>
                        </InputGroup.Text>
                        <Form.Control type="color" className="form-control-color" value={previewColor} onChange={(e) => updateField('customColor', e.target.value)} />
                        {customColor && (
                            <Button variant="outline-secondary" onClick={() => updateField('customColor', '')} title="Reset to Default">×</Button>
                        )}
                    </InputGroup>
                    <Button variant="danger" size="sm" onClick={onRemove}>Remove</Button>
                </div>
            </div>
            <Row className="g-3">
                <Col md={6}>
                    <Form.Label>Title</Form.Label>
                    <Form.Control type="text" value={title || ''} placeholder="e.g. Project Name" onChange={(e) => updateField('title', e.target.value)} />
                </Col>
                <Col md={6}>
                    <Form.Label>Subtitle</Form.Label>
                    <Form.Control type="text" value={subtitle || ''} placeholder="e.g. Hindi translation" onChange={(e) => updateField('subtitle', e.target.value)} />
                </Col>
                <Col xs={12}>
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" rows={2} value={description || ''} onChange={(e) => updateField('description', e.target.value)} />
                </Col>
                <Col md={6}>
                    <Form.Label>Button Text</Form.Label>
                    <Form.Control type="text" value={text || ''} onChange={(e) => updateField('text', e.target.value)} />
                </Col>
                <Col md={6}>
                    <Form.Label>Button URL</Form.Label>
                    <Form.Control type="text" value={url || ''} onChange={(e) => updateField('url', e.target.value)} />
                </Col>
            </Row>
        </div>
    );
};

export default ItemEditor;
