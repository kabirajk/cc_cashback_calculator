import { getCategoryCashbackStats, formatCurrency } from '../utils/cashbackCalculator';
import { deleteCategory } from '../utils/storage';

function Categories({ categories, expenses, settings, onAdd, onEdit, onRefresh }) {
    const handleDelete = (e, categoryId) => {
        e.stopPropagation();
        if (window.confirm('Delete this category? All expenses in this category will also be deleted.')) {
            deleteCategory(categoryId);
            onRefresh();
        }
    };

    return (
        <div>
            <div className="card-header mb-2">
                <h3>Your Categories</h3>
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    + Add
                </button>
            </div>

            {categories.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🏷️</div>
                    <p>No categories yet. Add your first category!</p>
                    <button className="btn btn-primary" onClick={onAdd}>
                        Add Category
                    </button>
                </div>
            ) : (
                categories.map(category => {
                    const stats = getCategoryCashbackStats(expenses, category, settings.billingCycleStart);

                    return (
                        <div
                            key={category.id}
                            className="category-item"
                            onClick={() => onEdit(category)}
                        >
                            <div
                                className="category-color"
                                style={{ backgroundColor: category.color }}
                            />
                            <div className="category-info">
                                <div className="category-name">{category.name}</div>
                                <div className="category-details">
                                    {category.cashbackPercent}% cashback
                                    {stats.hasLimit && ` • Limit: ${formatCurrency(category.monthlyLimit, settings.currency)}`}
                                </div>
                            </div>
                            <div className="category-cashback">
                                <div className="earned">{formatCurrency(stats.effectiveCashback, settings.currency)}</div>
                                {stats.hasLimit && (
                                    <div className="limit">
                                        {stats.limitUsedPercent.toFixed(0)}% used
                                    </div>
                                )}
                            </div>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={(e) => handleDelete(e, category.id)}
                                style={{ marginLeft: 8, padding: '6px 10px' }}
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

export default Categories;
