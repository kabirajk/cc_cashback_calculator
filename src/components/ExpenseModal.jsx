import { useState } from 'react';
import { addExpense, updateExpense } from '../utils/storage';

function ExpenseModal({ categories, expense, onClose, onSave }) {
    const today = new Date().toISOString().split('T')[0];

    const [amount, setAmount] = useState(expense?.amount?.toString() || '');
    const [categoryId, setCategoryId] = useState(expense?.categoryId || (categories[0]?.id || ''));
    const [date, setDate] = useState(expense?.date || today);
    const [note, setNote] = useState(expense?.note || '');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!amount || !categoryId) {
            alert('Please enter amount and select category');
            return;
        }

        const expenseData = {
            amount: parseFloat(amount),
            categoryId,
            date,
            note: note.trim()
        };

        if (expense) {
            updateExpense(expense.id, expenseData);
        } else {
            addExpense(expenseData);
        }

        onSave();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{expense ? 'Edit Expense' : 'Add Expense'}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input
                            type="number"
                            className="form-input large"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                        >
                            {categories.length === 0 ? (
                                <option value="">No categories available</option>
                            ) : (
                                categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} ({cat.cashbackPercent}% cashback)
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Note (optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Monthly recharge"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={categories.length === 0}>
                            {expense ? 'Update' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ExpenseModal;
