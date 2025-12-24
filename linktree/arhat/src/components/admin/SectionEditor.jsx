import React from 'react';
import { Button, Collapse } from 'react-bootstrap';

const SectionEditor = ({ title, isCustom, children, isOpen, onToggle, onMoveUp, onMoveDown, isFirst, isLast }) => {
    return (
        <div className="section-card">
            <div className={`section-header ${isOpen ? 'active' : ''}`} onClick={onToggle}>
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                    <h2 className="m-0 fs-5">
                        {title} 
                        <span className="badge bg-secondary ms-2" style={{fontSize: '0.6em'}}>
                            {isCustom ? 'Custom' : 'Static'}
                        </span>
                    </h2>
                    <div className="d-flex gap-1 ms-auto me-3" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={onMoveUp} disabled={isFirst}>
                            <i className="fas fa-arrow-up"></i>
                        </Button>
                        <Button variant="outline-secondary" size="sm" className="py-0 px-2" onClick={onMoveDown} disabled={isLast}>
                            <i className="fas fa-arrow-down"></i>
                        </Button>
                    </div>
                </div>
                <i className="fas fa-chevron-down toggle-icon"></i>
            </div>
            <Collapse in={isOpen}>
                <div className="section-content">
                    {children}
                </div>
            </Collapse>
        </div>
    );
};
export default SectionEditor;
