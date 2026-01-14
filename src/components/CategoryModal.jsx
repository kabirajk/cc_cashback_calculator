import { useState } from 'react';
import { addCategory, updateCategory } from '../utils/storage';

const COLORS = [
    '#FF5722', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#795548'
];

function CategoryModal({ category, onClose, onSave }) {
    const [name, setName] = useState(category?.name || '');
    const [cashbackPercent, setCashbackPercent] = useState(
        category?.cashbackPercent?.toString() || '10'
    );
    const [monthlyLimit, setMonthlyLimit] = useState(
        category?.monthlyLimit?.toString() || ''
    );
    const [hasLimit, setHasLimit] = useState(
        category ? category.monthlyLimit !== null && category.monthlyLimit > 0 : true
    );
    const [color, setColor] = useState(category?.color || COLORS[0]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('Please enter a category name');
            return;
        }

        const categoryData = {
            name: name.trim(),
            cashbackPercent: parseFloat(cashbackPercent) || 0,
            monthlyLimit: hasLimit && monthlyLimit ? parseFloat(monthlyLimit) : null,
            color
        };

        if (category) {
            updateCategory(category.id, categoryData);
        } else {
            addCategory(categoryData);
        }

        onSave();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{category ? 'Edit Category' : 'Add Category'}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Category Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Groceries"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cashback Percentage (%)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="10"
                            value={cashbackPercent}
                            onChange={(e) => setCashbackPercent(e.target.value)}
                            step="0.1"
                            min="0"
                            max="100"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={hasLimit}
                                onChange={(e) => setHasLimit(e.target.checked)}
                            />
                            <span className="form-label" style={{ margin: 0 }}>Monthly Cashback Limit</span>
                        </label>

                        {hasLimit && (
                            <input
                                type="number"
                                className="form-input mt-2"
                                placeholder="e.g., 500"
                                value={monthlyLimit}
                                onChange={(e) => setMonthlyLimit(e.target.value)}
                                step="1"
                                min="0"
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-options">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-option ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {category ? 'Update' : 'Add Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CategoryModal;
