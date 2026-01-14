/**
 * Get billing cycle dates based on cycle start day
 * @param {number} cycleStartDay - Day of month when billing cycle starts (1-28)
 * @param {Date} referenceDate - Date to calculate cycle for (optional, defaults to now)
 * @returns {{ start: Date, end: Date }}
 */
export const getBillingCycleDates = (cycleStartDay, referenceDate = new Date()) => {
    const now = referenceDate;
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let startDate, endDate;

    if (currentDay >= cycleStartDay) {
        // We're in a cycle that started this month
        startDate = new Date(currentYear, currentMonth, cycleStartDay);
        endDate = new Date(currentYear, currentMonth + 1, cycleStartDay - 1);
    } else {
        // We're in a cycle that started last month
        startDate = new Date(currentYear, currentMonth - 1, cycleStartDay);
        endDate = new Date(currentYear, currentMonth, cycleStartDay - 1);
    }

    // Set times to cover full days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { start: startDate, end: endDate };
};

/**
 * Check if a date falls within the billing cycle
 */
export const isInBillingCycle = (dateString, cycleStartDay) => {
    const { start, end } = getBillingCycleDates(cycleStartDay);
    const date = new Date(dateString);
    return date >= start && date <= end;
};

/**
 * Calculate raw cashback for a single expense
 * Always floors the result - e.g., 942 * 25% = 235.5 becomes 235
 */
export const calculateExpenseCashback = (amount, cashbackPercent) => {
    return Math.floor(amount * (cashbackPercent / 100));
};

/**
 * Get all expenses for a specific category within the billing cycle
 */
export const getCategoryExpensesInCycle = (expenses, categoryId, cycleStartDay) => {
    const { start, end } = getBillingCycleDates(cycleStartDay);

    return expenses.filter(expense => {
        if (expense.categoryId !== categoryId) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
    });
};

/**
 * Calculate total cashback for a category within billing cycle, respecting limits
 */
export const getCategoryCashbackStats = (expenses, category, cycleStartDay) => {
    const cycleExpenses = getCategoryExpensesInCycle(expenses, category.id, cycleStartDay);

    let totalSpent = 0;
    let rawCashback = 0;

    cycleExpenses.forEach(expense => {
        totalSpent += expense.amount;
        rawCashback += calculateExpenseCashback(expense.amount, category.cashbackPercent);
    });

    const hasLimit = category.monthlyLimit !== null && category.monthlyLimit > 0;
    const effectiveCashback = hasLimit
        ? Math.min(rawCashback, category.monthlyLimit)
        : rawCashback;

    const limitUsedPercent = hasLimit
        ? Math.min((rawCashback / category.monthlyLimit) * 100, 100)
        : 0;

    const remainingLimit = hasLimit
        ? Math.max(category.monthlyLimit - rawCashback, 0)
        : null;

    return {
        totalSpent,
        rawCashback,
        effectiveCashback,
        hasLimit,
        monthlyLimit: category.monthlyLimit,
        limitUsedPercent,
        remainingLimit,
        expenseCount: cycleExpenses.length,
        isLimitReached: hasLimit && rawCashback >= category.monthlyLimit
    };
};

/**
 * Get overall cashback summary for all categories
 */
export const getOverallCashbackSummary = (expenses, categories, cycleStartDay) => {
    let totalSpent = 0;
    let totalCashback = 0;
    let totalPotentialCashback = 0;
    const categoryStats = [];

    categories.forEach(category => {
        const stats = getCategoryCashbackStats(expenses, category, cycleStartDay);
        totalSpent += stats.totalSpent;
        totalCashback += stats.effectiveCashback;
        totalPotentialCashback += stats.rawCashback;
        categoryStats.push({
            category,
            ...stats
        });
    });

    const { start, end } = getBillingCycleDates(cycleStartDay);

    return {
        totalSpent,
        totalCashback,
        totalPotentialCashback,
        lostToCapping: totalPotentialCashback - totalCashback,
        categoryStats,
        billingCycle: { start, end }
    };
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = '₹') => {
    return `${currency}${amount.toFixed(2)}`;
};
