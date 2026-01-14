import { useState, useMemo } from 'react';
import { getBillingCycleDates, formatCurrency, formatDate, calculateExpenseCashback } from '../utils/cashbackCalculator';
import { deleteExpense } from '../utils/storage';

function Expenses({ categories, expenses, settings, onAdd, onEdit, onRefresh }) {
    const [showAllExpenses, setShowAllExpenses] = useState(false);
    const { start, end } = getBillingCycleDates(settings.billingCycleStart);

    // Get the billing cycle for any given date - returns "JAN 26" format
    const getBillingCycleForDate = (dateString) => {
        const { start } = getBillingCycleDates(settings.billingCycleStart, new Date(dateString));
        const month = start.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        const year = start.getFullYear().toString().slice(-2);
        return `${month} ${year}`;
    };

    const getCategoryById = (id) => categories.find(c => c.id === id);

    // Calculate eligible cashback for each expense considering limits
    // Cashback is calculated in order of date (first payment first)
    const expensesWithEligibleCashback = useMemo(() => {
        // Group expenses by category and billing cycle
        const cycleTrackers = {}; // { "cycleKey-categoryId": cumulativeCashback }

        // Sort expenses by date ascending to process in chronological order
        const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate eligible cashback for each expense
        const expenseMap = new Map();

        sortedExpenses.forEach(expense => {
            const category = getCategoryById(expense.categoryId);
            if (!category) {
                expenseMap.set(expense.id, { eligible: 0, lost: 0, raw: 0 });
                return;
            }

            const cycleKey = getBillingCycleForDate(expense.date);
            const trackerKey = `${cycleKey}-${expense.categoryId}`;

            if (!cycleTrackers[trackerKey]) {
                cycleTrackers[trackerKey] = 0;
            }

            const rawCashback = calculateExpenseCashback(expense.amount, category.cashbackPercent);
            const hasLimit = category.monthlyLimit !== null && category.monthlyLimit > 0;

            let eligibleCashback = rawCashback;
            let lostCashback = 0;

            if (hasLimit) {
                const remainingLimit = Math.max(0, category.monthlyLimit - cycleTrackers[trackerKey]);
                eligibleCashback = Math.min(rawCashback, remainingLimit);
                lostCashback = rawCashback - eligibleCashback;
                cycleTrackers[trackerKey] += rawCashback;
            }

            expenseMap.set(expense.id, {
                eligible: eligibleCashback,
                lost: lostCashback,
                raw: rawCashback
            });
        });

        return expenseMap;
    }, [expenses, categories, settings.billingCycleStart]);

    // Filter expenses based on toggle
    const filteredExpenses = showAllExpenses
        ? [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
        : expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= start && expDate <= end;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleDelete = (e, expenseId) => {
        e.stopPropagation();
        if (window.confirm('Delete this expense?')) {
            deleteExpense(expenseId);
            onRefresh();
        }
    };

    return (
        <div>
            <div className="card-header mb-2">
                <h3>Expenses</h3>
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    + Add
                </button>
            </div>

            {/* Toggle for All Expenses / Current Cycle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                    className={`btn btn-sm ${!showAllExpenses ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowAllExpenses(false)}
                >
                    Current Cycle
                </button>
                <button
                    className={`btn btn-sm ${showAllExpenses ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowAllExpenses(true)}
                >
                    All Expenses
                </button>
            </div>

            <div className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                {showAllExpenses
                    ? `All time • ${filteredExpenses.length} transactions`
                    : `${formatDate(start)} - ${formatDate(end)} • ${filteredExpenses.length} transactions`
                }
            </div>

            {filteredExpenses.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">💳</div>
                    <p>{showAllExpenses ? 'No expenses recorded yet.' : 'No expenses this cycle.'}</p>
                    <button className="btn btn-primary" onClick={onAdd}>
                        Add Expense
                    </button>
                </div>
            ) : (
                filteredExpenses.map(expense => {
                    const category = getCategoryById(expense.categoryId);
                    const cashbackInfo = expensesWithEligibleCashback.get(expense.id) || { eligible: 0, lost: 0, raw: 0 };

                    return (
                        <div
                            key={expense.id}
                            className="expense-item"
                            onClick={() => onEdit(expense)}
                            style={{ alignItems: 'flex-start' }}
                        >
                            <div
                                className="expense-category-dot"
                                style={{ backgroundColor: category?.color || '#666', marginTop: 8 }}
                            />
                            <div className="expense-info" style={{ flex: 1, minWidth: 0 }}>
                                {/* Category & Date - smaller */}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span>{category?.name || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{formatDate(expense.date)}</span>
                                    {showAllExpenses && (
                                        <span style={{
                                            background: 'var(--bg-tertiary)',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {getBillingCycleForDate(expense.date)}
                                        </span>
                                    )}
                                </div>
                                {expense.note && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {expense.note}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {/* Amount - PROMINENT */}
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                    {formatCurrency(expense.amount, settings.currency)}
                                </div>
                                {/* Eligible Cashback - PROMINENT */}
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--success)' }}>
                                    +{formatCurrency(cashbackInfo.eligible, settings.currency)}
                                </div>
                                {/* Lost Cashback - smaller, only if there's loss */}
                                {cashbackInfo.lost > 0 && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>
                                        -{formatCurrency(cashbackInfo.lost, settings.currency)} (limit)
                                    </div>
                                )}
                            </div>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={(e) => handleDelete(e, expense.id)}
                                style={{ marginLeft: 8, padding: '6px 10px', alignSelf: 'center' }}
                            >
                                🗑️
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default Expenses;
