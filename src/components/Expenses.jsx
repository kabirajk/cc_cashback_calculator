import { useState, useMemo } from 'react';
import { getBillingCycleDates, formatCurrency, formatDate, calculateExpenseCashback } from '../utils/cashbackCalculator';
import { deleteExpense } from '../utils/storage';

function Expenses({ categories, expenses, settings, onAdd, onEdit, onRefresh }) {
    const [viewMode, setViewMode] = useState('current'); // 'current' or 'all'
    const [selectedCycle, setSelectedCycle] = useState('all'); // 'all' or specific cycle key (e.g. "JAN 26")
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { start: currentStart, end: currentEnd } = getBillingCycleDates(settings.billingCycleStart);

    const getCategoryById = (id) => categories.find(c => c.id === id);

    // Get the billing cycle key for any given date - returns "JAN 26" format
    const getBillingCycleKey = (dateString, refDate) => {
        const { start } = getBillingCycleDates(settings.billingCycleStart, refDate || new Date(dateString));
        const month = start.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        const year = start.getFullYear().toString().slice(-2);
        return `${month} ${year}`;
    };

    // Calculate detailed cashback stats for all expenses, grouped by cycle
    const cycleData = useMemo(() => {
        const trackers = {}; // { cycleKey: { categoryId: cumulativeCashback } }
        const cycles = {}; // { cycleKey: { expenses: [], summary: { total, eligible, lost, spent } } }

        // Sort all expenses chronologically to process limits correctly
        const sortedAll = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedAll.forEach(expense => {
            const cycleKey = getBillingCycleKey(expense.date);
            const category = getCategoryById(expense.categoryId);

            if (!cycles[cycleKey]) {
                cycles[cycleKey] = {
                    expenses: [],
                    summary: { total: 0, eligible: 0, lost: 0, spent: 0 }
                };
                trackers[cycleKey] = {};
            }

            const rawCashback = category ? calculateExpenseCashback(expense.amount, category.cashbackPercent) : 0;
            let eligible = rawCashback;
            let lost = 0;

            if (category && category.monthlyLimit) {
                const currentCatCashback = trackers[cycleKey][category.id] || 0;
                const remainingLimit = Math.max(0, category.monthlyLimit - currentCatCashback);
                eligible = Math.min(rawCashback, remainingLimit);
                lost = rawCashback - eligible;
                trackers[cycleKey][category.id] = currentCatCashback + rawCashback;
            }

            const enrichedExpense = {
                ...expense,
                cashback: { total: rawCashback, eligible, lost },
                cycleKey
            };

            cycles[cycleKey].expenses.push(enrichedExpense);
            cycles[cycleKey].summary.total += rawCashback;
            cycles[cycleKey].summary.eligible += eligible;
            cycles[cycleKey].summary.lost += lost;
            cycles[cycleKey].summary.spent += expense.amount;
        });

        // Sort cycles by date (most recent first) and their expenses (most recent first)
        const sortedCycles = Object.keys(cycles)
            .sort((a, b) => {
                // Approximate sorting by parsing cycle keys
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                const dateA = new Date(`20${yearA} ${monthA} 1`);
                const dateB = new Date(`20${yearB} ${monthB} 1`);
                return dateB - dateA;
            })
            .reduce((acc, key) => {
                acc[key] = {
                    ...cycles[key],
                    expenses: cycles[key].expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
                };
                return acc;
            }, {});

        return sortedCycles;
    }, [expenses, categories, settings.billingCycleStart]);

    // Current Cycle Key
    const currentCycleKey = getBillingCycleKey(null, currentStart);

    // Final filtered list based on viewMode, selectedCycle, and date ranges
    const displayData = useMemo(() => {
        let filteredCycles = {};

        if (viewMode === 'current') {
            filteredCycles = { [currentCycleKey]: cycleData[currentCycleKey] || { expenses: [], summary: { total: 0, eligible: 0, lost: 0, spent: 0 } } };
        } else {
            // mode is "all"
            if (selectedCycle !== 'all') {
                filteredCycles = { [selectedCycle]: cycleData[selectedCycle] || { expenses: [], summary: { total: 0, eligible: 0, lost: 0, spent: 0 } } };
            } else {
                filteredCycles = cycleData;
            }

            // Apply date filters if set
            if (startDate || endDate) {
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date(8640000000000000); // end of time
                end.setHours(23, 59, 59, 999);

                const result = {};
                Object.entries(filteredCycles).forEach(([key, cycle]) => {
                    const filteredExpenses = cycle.expenses.filter(ex => {
                        const d = new Date(ex.date);
                        return d >= start && d <= end;
                    });

                    if (filteredExpenses.length > 0) {
                        const summary = filteredExpenses.reduce((acc, ex) => {
                            acc.total += ex.cashback.total;
                            acc.eligible += ex.cashback.eligible;
                            acc.lost += ex.cashback.lost;
                            acc.spent += ex.amount;
                            return acc;
                        }, { total: 0, eligible: 0, lost: 0, spent: 0 });

                        result[key] = { expenses: filteredExpenses, summary };
                    }
                });
                filteredCycles = result;
            }
        }

        return filteredCycles;
    }, [viewMode, selectedCycle, cycleData, currentCycleKey, startDate, endDate]);

    // Overall summary for the top area
    const overallSummary = useMemo(() => {
        const summary = { total: 0, eligible: 0, lost: 0, spent: 0, count: 0 };
        Object.values(displayData).forEach(cycle => {
            summary.total += cycle.summary.total;
            summary.eligible += cycle.summary.eligible;
            summary.lost += cycle.summary.lost;
            summary.spent += cycle.summary.spent;
            summary.count += cycle.expenses.length;
        });
        return summary;
    }, [displayData]);

    const handleDelete = (e, expenseId) => {
        e.stopPropagation();
        if (window.confirm('Delete this expense?')) {
            deleteExpense(expenseId);
            onRefresh();
        }
    };

    return (
        <div className="expenses-container">
            <div className="card-header mb-2">
                <h3>Expenses</h3>
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    + Add
                </button>
            </div>

            {/* View Switching & Cycle Filter */}
            <div className="view-controls mb-4">
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                        className={`btn btn-sm ${viewMode === 'current' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setViewMode('current'); setSelectedCycle('all'); }}
                    >
                        Current Cycle
                    </button>
                    <button
                        className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setViewMode('all')}
                    >
                        All Expenses
                    </button>
                </div>

                {viewMode === 'all' && (
                    <div className="filters card mb-4" style={{ padding: '12px', background: 'var(--bg-tertiary)', border: 'none' }}>
                        <div className="filter-group mb-2">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter by Cycle:</label>
                            <select
                                className="form-select"
                                value={selectedCycle}
                                onChange={(e) => setSelectedCycle(e.target.value)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                <option value="all">Every Cycle</option>
                                {Object.keys(cycleData).map(key => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div className="filter-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>From:</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                />
                            </div>
                            <div className="filter-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>To:</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                />
                            </div>
                        </div>
                        {(startDate || endDate || selectedCycle !== 'all') && (
                            <button
                                className="btn btn-sm text-danger"
                                style={{ padding: 0, marginTop: 8, fontSize: '0.7rem', background: 'none' }}
                                onClick={() => { setStartDate(''); setEndDate(''); setSelectedCycle('all'); }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Top Summary Breakdown */}
            <div className="card summary-card" style={{ padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="stat-item" style={{ textAlign: 'left' }}>
                        <div className="stat-label">Total Spent</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatCurrency(overallSummary.spent, settings.currency)}</div>
                    </div>
                    <div className="stat-item" style={{ textAlign: 'right' }}>
                        <div className="stat-label">Actual Earned</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--success)' }}>{formatCurrency(overallSummary.eligible, settings.currency)}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="stat-item">
                        <div className="stat-label">Total Potential</div>
                        <div className="stat-value" style={{ fontSize: '0.9rem' }}>{formatCurrency(overallSummary.total, settings.currency)}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Amount Lost</div>
                        <div className="stat-value" style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>{formatCurrency(overallSummary.lost, settings.currency)}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Txns</div>
                        <div className="stat-value" style={{ fontSize: '0.9rem' }}>{overallSummary.count}</div>
                    </div>
                </div>
            </div>

            {/* Expenses List grouped by Cycle */}
            {Object.keys(displayData).length === 0 || overallSummary.count === 0 ? (
                <div className="empty-state">
                    <div className="icon">💳</div>
                    <p>No expenses found for this selection.</p>
                </div>
            ) : (
                Object.entries(displayData).map(([cycleKey, cycle]) => (
                    <div key={cycleKey} className="cycle-group mb-4">
                        {/* Cycle Header Separator */}
                        <div className="cycle-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 4px',
                            borderBottom: '2px solid var(--bg-tertiary)',
                            marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    background: 'var(--accent-gradient)',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    {cycleKey}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {cycle.expenses.length} txns
                                </span>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.72rem', display: 'flex', gap: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="text-muted">Total</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(cycle.summary.total, settings.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="text-success">Earned</span>
                                    <span className="text-success" style={{ fontWeight: 600 }}>{formatCurrency(cycle.summary.eligible, settings.currency)}</span>
                                </div>
                                {cycle.summary.lost > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="text-danger">Lost</span>
                                        <span className="text-danger" style={{ fontWeight: 600 }}>{formatCurrency(cycle.summary.lost, settings.currency)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expenses in this cycle */}
                        {cycle.expenses.map(expense => {
                            const category = getCategoryById(expense.categoryId);
                            return (
                                <div
                                    key={expense.id}
                                    className="expense-item"
                                    onClick={() => onEdit(expense)}
                                    style={{ alignItems: 'flex-start', padding: '12px' }}
                                >
                                    <div
                                        className="expense-category-dot"
                                        style={{ backgroundColor: category?.color || '#666', marginTop: '6px' }}
                                    />
                                    <div className="expense-info" style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>{category?.name || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{formatDate(expense.date)}</span>
                                        </div>
                                        {expense.note && (
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-secondary)',
                                                marginTop: '2px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {expense.note}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                            {formatCurrency(expense.amount, settings.currency)}
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                            +{formatCurrency(expense.cashback.eligible, settings.currency)}
                                        </div>
                                        {expense.cashback.lost > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>
                                                -{formatCurrency(expense.cashback.lost, settings.currency)} (limit)
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={(e) => handleDelete(e, expense.id)}
                                        style={{ marginLeft: '12px', padding: '6px 10px', alignSelf: 'center' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}
        </div>
    );
}

export default Expenses;
