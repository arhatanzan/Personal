import React from 'react';
import { Form } from 'react-bootstrap';
import SectionEditor from './SectionEditor';

const FooterEditor = ({ footer, onChange, ...props }) => {
    const handleChange = (field, value) => {
        onChange({ ...footer, [field]: value });
    };

    return (
        <SectionEditor title="Footer Settings" {...props}>
            <Form.Group className="mb-3">
                <Form.Label>Footer Text</Form.Label>
                <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={footer.text || ''} 
                    onChange={(e) => handleChange('text', e.target.value)} 
                />
                <Form.Text className="text-muted">
                    HTML is allowed. Use &lt;br&gt; for line breaks.
                </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Copyright Text</Form.Label>
                <Form.Control 
                    type="text" 
                    value={footer.copyright || ''} 
                    onChange={(e) => handleChange('copyright', e.target.value)} 
                />
            </Form.Group>
        </SectionEditor>
    );
};

export default FooterEditor;
