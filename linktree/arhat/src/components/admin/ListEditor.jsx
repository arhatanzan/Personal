import React from 'react';
import { Button } from 'react-bootstrap';
import SectionEditor from './SectionEditor';
import ItemEditor from './ItemEditor';

const ListEditor = ({ title, items, onChange, themeColors, itemTemplate, ...props }) => {
    
    const handleItemChange = (index, newItem) => {
        const newItems = [...items];
        newItems[index] = newItem;
        onChange(newItems);
    };

    const handleAddItem = () => {
        const newItem = itemTemplate || {
            title: '',
            subtitle: '',
            description: '',
            text: 'View',
            url: '#'
        };
        onChange([...items, newItem]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    return (
        <SectionEditor title={title} {...props}>
            {props.children}
            <div className="d-flex flex-column gap-3">
                {Array.isArray(items) && items.map((item, index) => (
                    <ItemEditor 
                        key={index} 
                        index={index} 
                        item={item} 
                        onChange={(newItem) => handleItemChange(index, newItem)}
                        onRemove={() => handleRemoveItem(index)}
                        themeColors={themeColors}
                    />
                ))}
                <div className="text-center mt-2">
                    <Button variant="outline-primary" onClick={handleAddItem}>
                        + Add New Item
                    </Button>
                </div>
            </div>
        </SectionEditor>
    );
};

export default ListEditor;
