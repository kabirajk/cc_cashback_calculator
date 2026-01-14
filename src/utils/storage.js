// Storage keys
const KEYS = {
    CATEGORIES: 'cc_cashback_categories',
    EXPENSES: 'cc_cashback_expenses',
    SETTINGS: 'cc_cashback_settings'
};

// Generate unique ID
export const generateId = () => crypto.randomUUID();

// Default categories based on user's requirements
const DEFAULT_CATEGORIES = [
    {
        id: generateId(),
        name: 'Airtel Payment',
        cashbackPercent: 25,
        monthlyLimit: 250,
        color: '#FF5722'
    },
    {
        id: generateId(),
        name: 'Other Utilities',
        cashbackPercent: 10,
        monthlyLimit: 250,
        color: '#2196F3'
    },
    {
        id: generateId(),
        name: 'Swiggy / Zomato / BigBasket',
        cashbackPercent: 10,
        monthlyLimit: 500,
        color: '#4CAF50'
    }
];

// Default settings
const DEFAULT_SETTINGS = {
    billingCycleStart: 1,
    currency: '₹'
};

// Categories
export const getCategories = () => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    if (!data) {
        // Initialize with default categories
        saveCategories(DEFAULT_CATEGORIES);
        return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
};

export const saveCategories = (categories) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

export const addCategory = (category) => {
    const categories = getCategories();
    const newCategory = { ...category, id: generateId() };
    categories.push(newCategory);
    saveCategories(categories);
    return newCategory;
};

export const updateCategory = (id, updates) => {
    const categories = getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
        categories[index] = { ...categories[index], ...updates };
        saveCategories(categories);
        return categories[index];
    }
    return null;
};

export const deleteCategory = (id) => {
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== id);
    saveCategories(filtered);
    // Also delete expenses for this category
    const expenses = getExpenses().filter(e => e.categoryId !== id);
    saveExpenses(expenses);
};

// Expenses
export const getExpenses = () => {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
};

export const saveExpenses = (expenses) => {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
};

export const addExpense = (expense) => {
    const expenses = getExpenses();
    const newExpense = { ...expense, id: generateId() };
    expenses.push(newExpense);
    saveExpenses(expenses);
    return newExpense;
};

export const updateExpense = (id, updates) => {
    const expenses = getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
        expenses[index] = { ...expenses[index], ...updates };
        saveExpenses(expenses);
        return expenses[index];
    }
    return null;
};

export const deleteExpense = (id) => {
    const expenses = getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    saveExpenses(filtered);
};

// Settings
export const getSettings = () => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) {
        saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
};

export const saveSettings = (settings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// Data Export/Import for backup
export const exportAllData = () => {
    return JSON.stringify({
        categories: getCategories(),
        expenses: getExpenses(),
        settings: getSettings(),
        exportedAt: new Date().toISOString()
    }, null, 2);
};

export const importAllData = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        if (data.categories) saveCategories(data.categories);
        if (data.expenses) saveExpenses(data.expenses);
        if (data.settings) saveSettings(data.settings);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Clear all data
export const clearAllData = () => {
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.SETTINGS);
};
