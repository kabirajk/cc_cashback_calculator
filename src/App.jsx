import { useState, useEffect, useCallback } from 'react';
import './index.css';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import Expenses from './components/Expenses';
import Settings from './components/Settings';
import ExpenseModal from './components/ExpenseModal';
import CategoryModal from './components/CategoryModal';
import { getCategories, getExpenses, getSettings } from './utils/storage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState({ billingCycleStart: 1, currency: '₹' });
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  const refreshData = useCallback(() => {
    setCategories(getCategories());
    setExpenses(getExpenses());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseModal(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'categories', label: '🏷️ Categories' },
    { id: 'expenses', label: '💳 Expenses' },
    { id: 'settings', label: '⚙️ Settings' }
  ];

  return (
    <div className="app">
      <header className="header">
        <h1>💰 Cashback Tracker</h1>
      </header>

      <nav className="nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, paddingBottom: 80 }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            categories={categories}
            expenses={expenses}
            settings={settings}
          />
        )}
        {activeTab === 'categories' && (
          <Categories
            categories={categories}
            expenses={expenses}
            settings={settings}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onRefresh={refreshData}
          />
        )}
        {activeTab === 'expenses' && (
          <Expenses
            categories={categories}
            expenses={expenses}
            settings={settings}
            onAdd={handleAddExpense}
            onEdit={handleEditExpense}
            onRefresh={refreshData}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onRefresh={refreshData}
          />
        )}
      </main>

      {(activeTab === 'dashboard' || activeTab === 'expenses') && (
        <button className="fab" onClick={handleAddExpense}>
          +
        </button>
      )}

      {showExpenseModal && (
        <ExpenseModal
          categories={categories}
          expense={editingExpense}
          onClose={() => setShowExpenseModal(false)}
          onSave={() => {
            setShowExpenseModal(false);
            refreshData();
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={() => {
            setShowCategoryModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}

export default App;
