import React from 'react';
import { Form, Row, Col, Card, Button, InputGroup, Collapse } from 'react-bootstrap';

const ThemeSettings = ({ theme, onChange, isOpen, onToggle }) => {
    const currentFont = theme.fontFamily || "'Montserrat', sans-serif";
    const knownFonts = ["'Montserrat', sans-serif", "'Open Sans', sans-serif", "'Lato', sans-serif", "'Poppins', sans-serif", "'Roboto', sans-serif", "'Merriweather', serif", "'Playfair Display', serif", "'Lora', serif", "'Georgia', serif", "'Courier New', monospace"];
    const isCustom = !knownFonts.includes(currentFont);
    const colors = theme.buttonColors || [];

    const updateSetting = (key, value) => {
        onChange({ ...theme, [key]: value });
    };

    const updateColor = (index, value) => {
        const newColors = [...colors];
        newColors[index] = value;
        updateSetting('buttonColors', newColors);
    };

    const addColor = () => {
        updateSetting('buttonColors', [...colors, '#000000']);
    };

    const removeColor = (index) => {
        const newColors = colors.filter((_, i) => i !== index);
        updateSetting('buttonColors', newColors);
    };

    return (
        <div className="section-card border-info mb-4">
            <div className={`section-header bg-info text-white ${isOpen ? 'active' : ''}`} onClick={onToggle}>
                <h2 className="m-0 fs-5"><i className="fas fa-palette me-2"></i>Theme Settings</h2>
                <i className="fas fa-chevron-down toggle-icon"></i>
            </div>
            <Collapse in={isOpen}>
                <div className="section-content">
                    <Row className="g-3 mb-3">
                        <Col md={4}>
                            <Form.Label>Background Color</Form.Label>
                            <Form.Control type="color" className="form-control-color w-100" value={theme.backgroundColor || '#ffffff'} onChange={(e) => updateSetting('backgroundColor', e.target.value)} />
                        </Col>
                        <Col md={4}>
                            <Form.Label>Text Color</Form.Label>
                            <Form.Control type="color" className="form-control-color w-100" value={theme.textColor || '#023e62'} onChange={(e) => updateSetting('textColor', e.target.value)} />
                        </Col>
                        <Col md={4}>
                            <Form.Label>Font Family</Form.Label>
                            <Form.Select value={isCustom ? 'custom' : currentFont} onChange={(e) => {
                                if (e.target.value !== 'custom') updateSetting('fontFamily', e.target.value);
                            }}>
                                <optgroup label="Sans-Serif (Modern)">
                                    <option value="'Montserrat', sans-serif">Montserrat (Default)</option>
                                    <option value="'Open Sans', sans-serif">Open Sans</option>
                                    <option value="'Lato', sans-serif">Lato</option>
                                    <option value="'Poppins', sans-serif">Poppins</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                </optgroup>
                                <optgroup label="Serif (Classic)">
                                    <option value="'Merriweather', serif">Merriweather</option>
                                    <option value="'Playfair Display', serif">Playfair Display</option>
                                    <option value="'Lora', serif">Lora</option>
                                    <option value="'Georgia', serif">Georgia (System)</option>
                                </optgroup>
                                <optgroup label="Monospace (Code)">
                                    <option value="'Courier New', monospace">Courier New</option>
                                </optgroup>
                                <option value="custom">Custom Font...</option>
                            </Form.Select>
                        </Col>
                        {isCustom && (
                            <Col xs={12}>
                                <Card className="bg-light">
                                    <Card.Body>
                                        <Row className="g-2">
                                            <Col md={6}>
                                                <Form.Label className="small">Custom Font Family (CSS)</Form.Label>
                                                <Form.Control size="sm" placeholder="e.g. 'My Font', sans-serif" value={currentFont} onChange={(e) => updateSetting('fontFamily', e.target.value)} />
                                            </Col>
                                            <Col md={6}>
                                                <Form.Label className="small">Custom Font URL (Google Fonts)</Form.Label>
                                                <Form.Control size="sm" placeholder="https://fonts.googleapis.com/css2?family=My+Font&display=swap" value={theme.customFontUrl || ''} onChange={(e) => updateSetting('customFontUrl', e.target.value)} />
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                        <Col xs={12}>
                            <Form.Label>Background Image URL (Optional)</Form.Label>
                            <Form.Control value={theme.backgroundImage || ''} placeholder="https://example.com/image.jpg" onChange={(e) => updateSetting('backgroundImage', e.target.value)} />
                        </Col>
                    </Row>
                    
                    <h6 className="border-bottom pb-2 mb-3">Sizing & Spacing</h6>
                    <Row className="g-3 mb-3">
                        <Col md={3}><Form.Label>Base Font Size (px)</Form.Label><Form.Control type="number" value={theme.fontSize || 16} onChange={(e) => updateSetting('fontSize', e.target.value)} /></Col>
                        <Col md={3}><Form.Label>Section Spacing (px)</Form.Label><Form.Control type="number" value={theme.sectionSpacing || 30} onChange={(e) => updateSetting('sectionSpacing', e.target.value)} /></Col>
                        <Col md={3}><Form.Label>Text Spacing (px)</Form.Label><Form.Control type="number" value={theme.textSpacing || 15} onChange={(e) => updateSetting('textSpacing', e.target.value)} /></Col>
                        <Col md={3}><Form.Label>Button Spacing (px)</Form.Label><Form.Control type="number" value={theme.btnSpacing || 15} onChange={(e) => updateSetting('btnSpacing', e.target.value)} /></Col>
                    </Row>

                    <h6 className="border-bottom pb-2 mb-3">Button Colors</h6>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                        {colors.map((color, index) => (
                            <InputGroup size="sm" style={{width: '150px'}} key={index}>
                                <Form.Control type="color" className="form-control-color" value={color} onChange={(e) => updateColor(index, e.target.value)} />
                                <Button variant="outline-secondary" onClick={() => removeColor(index)}>×</Button>
                            </InputGroup>
                        ))}
                        <Button variant="outline-success" size="sm" onClick={addColor}>+</Button>
                    </div>
                </div>
            </Collapse>
        </div>
    );
};

import { Collapse } from 'react-bootstrap';
export default ThemeSettings;
