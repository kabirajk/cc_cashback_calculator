import { getOverallCashbackSummary, formatCurrency, formatDate } from '../utils/cashbackCalculator';

function Dashboard({ categories, expenses, settings }) {
    const summary = getOverallCashbackSummary(expenses, categories, settings.billingCycleStart);

    return (
        <div>
            {/* Billing Cycle Info */}
            <div className="text-muted mb-2" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                Billing Cycle: {formatDate(summary.billingCycle.start)} - {formatDate(summary.billingCycle.end)}
            </div>

            {/* Main Summary Card */}
            <div className="card summary-card">
                <div className="label">Total Cashback Earned</div>
                <div className="amount">{formatCurrency(summary.totalCashback, settings.currency)}</div>

                <div className="summary-stats">
                    <div className="stat-item">
                        <div className="stat-value">{formatCurrency(summary.totalSpent, settings.currency)}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{formatCurrency(summary.lostToCapping, settings.currency)}</div>
                        <div className="stat-label">Lost to Limits</div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <h3 className="mb-2">Category Breakdown</h3>

            {summary.categoryStats.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🏷️</div>
                    <p>No categories yet</p>
                </div>
            ) : (
                summary.categoryStats.map(({ category, effectiveCashback, limitUsedPercent, hasLimit, monthlyLimit, isLimitReached, totalSpent }) => (
                    <div key={category.id} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                                className="category-color"
                                style={{ backgroundColor: category.color, width: 8, height: 40 }}
                            />
                            <div style={{ flex: 1 }}>
                                <div className="card-title" style={{ fontSize: '1rem' }}>{category.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    {category.cashbackPercent}% cashback • Spent: {formatCurrency(totalSpent, settings.currency)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className={`text-success`} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                    {formatCurrency(effectiveCashback, settings.currency)}
                                </div>
                                {hasLimit && (
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        of {formatCurrency(monthlyLimit, settings.currency)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {hasLimit && (
                            <div className="progress-container">
                                <div className="progress-bar">
                                    <div
                                        className={`progress-fill ${isLimitReached ? 'danger' : limitUsedPercent > 70 ? 'warning' : 'success'}`}
                                        style={{ width: `${Math.min(limitUsedPercent, 100)}%` }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: 4 }}>
                                    <span className="text-muted">{limitUsedPercent.toFixed(0)}% used</span>
                                    {isLimitReached && <span className="text-danger">Limit reached!</span>}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default Dashboard;
