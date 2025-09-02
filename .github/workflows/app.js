// Data storage keys
const STORAGE_KEYS = {
    transactions: 'transactions',
    categories: 'categories',
    budgets: 'budgets'
};

// App configuration
const CONFIG = {
    maxDescriptionLength: 100,
    maxCategoryNameLength: 50,
    minAmount: 0.01,
    maxAmount: 10000000,
    defaultCategories: [
        { id: 1, name: 'Food' },
        { id: 2, name: 'Transportation' },
        { id: 3, name: 'Entertainment' },
        { id: 4, name: 'Bills' },
        { id: 5, name: 'Shopping' },
        { id: 6, name: 'Salary' },
        { id: 7, name: 'Freelance' },
        { id: 8, name: 'Investment' }
    ]
};

// Load data from localStorage
function loadData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Save data to localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Initialize data
let transactions = loadData(STORAGE_KEYS.transactions);
let categories = loadData(STORAGE_KEYS.categories);
let budgets = loadData(STORAGE_KEYS.budgets);

// Add default categories if none exist
if (categories.length === 0) {
    categories = [
        { id: 1, name: 'Food' },
        { id: 2, name: 'Transportation' },
        { id: 3, name: 'Entertainment' },
        { id: 4, name: 'Bills' },
        { id: 5, name: 'Shopping' },
        { id: 6, name: 'Salary' },
    ];
    saveData(STORAGE_KEYS.categories, categories);
}


// DOM elements
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const categoryForm = document.getElementById('category-form');
const categoryList = document.getElementById('category-list');
const budgetForm = document.getElementById('budget-form');
const budgetList = document.getElementById('budget-list');

const exportBtn = document.getElementById('export-data');
const resetBtn = document.getElementById('reset-data');
const navToggle = document.getElementById('nav-toggle');

// Search and filter elements
const searchInput = document.getElementById('transaction-search');
const clearSearchBtn = document.getElementById('clear-search');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterMonth = document.getElementById('filter-month');

function populateCategorySelects() {
    const selects = document.querySelectorAll('#transaction-category, #budget-category');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        // If no categories, disable the select
        if (categories.length === 0) {
            select.disabled = true;
        } else {
            select.disabled = false;
        }
    });
}

// Filter transactions based on search and filter criteria
function getFilteredTransactions() {
    let filtered = [...transactions];

    // Search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.description.toLowerCase().includes(searchTerm) ||
            t.amount.toString().includes(searchTerm) ||
            (t.category && categories.find(c => c.id == t.category)?.name.toLowerCase().includes(searchTerm))
        );
    }

    // Type filter
    const typeFilter = filterType.value;
    if (typeFilter) {
        filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Category filter
    const categoryFilter = filterCategory.value;
    if (categoryFilter) {
        filtered = filtered.filter(t => t.category == categoryFilter);
    }

    // Month filter
    const monthFilter = filterMonth.value;
    if (monthFilter) {
        filtered = filtered.filter(t => {
            const transactionMonth = new Date(t.date).getMonth() + 1;
            return transactionMonth.toString().padStart(2, '0') === monthFilter;
        });
    }

    return filtered;
}

// Render transactions with filtering
function renderTransactions() {
    const filteredTransactions = getFilteredTransactions();
    transactionList.innerHTML = '';

    if (filteredTransactions.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No transactions found matching your criteria.</div>';
        transactionList.appendChild(li);
        return;
    }

    filteredTransactions.forEach((t, originalIndex) => {
        // Find the original index in the transactions array
        const index = transactions.indexOf(t);
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${t.description}</strong> - ₹${t.amount} (${t.type}) - ${t.category ? categories.find(c => c.id == t.category)?.name : 'Uncategorized'} - ${t.date}
            </div>
            <div>
                <button onclick="editTransaction(${index})">Edit</button>
                <button onclick="deleteTransaction(${index})">Delete</button>
            </div>
        `;
        transactionList.appendChild(li);
    });
    updateDashboard();
}

// Render categories
function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach((c, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${c.name}</span>
            <button onclick="deleteCategory(${index})">Delete</button>
        `;
        categoryList.appendChild(li);
    });
    populateCategorySelects();
    populateFilterCategorySelect(); // Update filter dropdown when categories change
}

// Render budgets
function renderBudgets() {
    budgetList.innerHTML = '';
    budgets.forEach((b, index) => {
        const category = categories.find(c => c.id == b.category);
        const spent = transactions.filter(t => t.category == b.category && t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const status = spent > b.amount ? 'Over Budget' : 'On Track';
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${category ? category.name : 'Uncategorized'}</strong> - Budget: ₹${b.amount} (${b.period}) - Spent: ₹${spent.toFixed(2)} - ${status}
            </div>
            <button onclick="deleteBudget(${index})">Delete</button>
        `;
        budgetList.appendChild(li);
    });
}



// Update dashboard
function updateDashboard() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const savings = totalIncome - totalExpenses;

    document.getElementById('total-income').textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById('savings').textContent = `₹${savings.toFixed(2)}`;
    document.getElementById('upcoming-payments').textContent = '0';
}



// Input validation functions
function validateTransaction(description, amount, type, category, date) {
    const errors = [];

    if (!description.trim()) {
        errors.push('Description is required');
    } else if (description.length > CONFIG.maxDescriptionLength) {
        errors.push(`Description must be less than ${CONFIG.maxDescriptionLength} characters`);
    }

    if (!amount || isNaN(amount) || amount < CONFIG.minAmount) {
        errors.push(`Amount must be a positive number greater than ₹${CONFIG.minAmount}`);
    } else if (amount > CONFIG.maxAmount) {
        errors.push(`Amount cannot exceed ₹${CONFIG.maxAmount.toLocaleString()}`);
    }

    if (!type || !['income', 'expense'].includes(type)) {
        errors.push('Please select a valid transaction type');
    }

    if (!date) {
        errors.push('Date is required');
    } else {
        const selectedDate = new Date(date);
        const today = new Date();
        if (selectedDate > today) {
            errors.push('Transaction date cannot be in the future');
        }
    }

    return errors;
}

// Add transaction
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('transaction-description').value.trim();
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const type = document.getElementById('transaction-type').value;
    const category = document.getElementById('transaction-category').value;
    const date = document.getElementById('transaction-date').value;

    // Validate inputs
    const validationErrors = validateTransaction(description, amount, type, category, date);
    if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
        return;
    }

    // Check for insufficient balance for expenses
    if (type === 'expense') {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const currentSavings = totalIncome - totalExpenses;

        if (amount > currentSavings) {
            const proceed = confirm(`Insufficient balance! You cannot add this expense.\n\nCurrent savings: ₹${currentSavings.toFixed(2)}\nExpense amount: ₹${amount.toFixed(2)}\n\nDo you want to add income first?`);
            if (proceed) {
                // Scroll to dashboard and focus on adding income
                document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
                document.getElementById('transaction-description').focus();
            }
            return;
        }
    }

    // Check budget limit for expenses
    if (type === 'expense' && category) {
        const budget = budgets.find(b => b.category == category);
        if (budget) {
            const currentSpent = transactions.filter(t => t.category == category && t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            if (currentSpent + amount > budget.amount) {
                const proceed = confirm(`Warning: Adding this expense will exceed your budget for ${categories.find(c => c.id == category)?.name || 'this category'}!\n\nCurrent spent: ₹${currentSpent.toFixed(2)}\nBudget: ₹${budget.amount}\nThis expense: ₹${amount.toFixed(2)}\nTotal after: ₹${(currentSpent + amount).toFixed(2)}\n\nDo you want to proceed anyway?`);
                if (!proceed) return;
            }
        }
    }

    // Add transaction
    transactions.push({
        description,
        amount: parseFloat(amount.toFixed(2)), // Ensure consistent decimal places
        type,
        category: category || null,
        date,
        timestamp: new Date().toISOString()
    });

    saveData(STORAGE_KEYS.transactions, transactions);
    renderTransactions();
    transactionForm.reset();

    // Show success message
    showNotification('Transaction added successfully!', 'success');
});

// Add category
categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('category-name').value;
    categories.push({ id: Date.now(), name });
    saveData(STORAGE_KEYS.categories, categories);
    renderCategories();
    categoryForm.reset();
});

// Add budget
budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);
    const period = document.getElementById('budget-period').value;

    budgets.push({ category, amount, period });
    saveData(STORAGE_KEYS.budgets, budgets);
    renderBudgets();
    budgetForm.reset();
});



// Edit transaction (simple prompt for now)
function editTransaction(index) {
    const t = transactions[index];
    const newDesc = prompt('Edit description:', t.description);
    if (newDesc) {
        transactions[index].description = newDesc;
        saveData(STORAGE_KEYS.transactions, transactions);
        renderTransactions();
    }
}

// Delete functions
function deleteTransaction(index) {
    transactions.splice(index, 1);
    saveData(STORAGE_KEYS.transactions, transactions);
    renderTransactions();
}

function deleteCategory(index) {
    categories.splice(index, 1);
    saveData(STORAGE_KEYS.categories, categories);
    renderCategories();
}

function deleteBudget(index) {
    budgets.splice(index, 1);
    saveData(STORAGE_KEYS.budgets, budgets);
    renderBudgets();
}



// Export data
exportBtn.addEventListener('click', () => {
    const data = {
        transactions,
        categories,
        budgets
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-data.json';
    a.click();
    URL.revokeObjectURL(url);
});

// Reset data
resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data?')) {
        localStorage.clear();
        transactions = [];
        categories = [];
        budgets = [];
        renderTransactions();
        renderCategories();
        renderBudgets();
        updateDashboard();
    }
});

// Nav toggle
// Removed nav toggle event listener as sidebar and toggle button are removed

// Navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
        // Update active link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Search and filter event listeners
searchInput.addEventListener('input', renderTransactions);
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderTransactions();
});

filterType.addEventListener('change', renderTransactions);
filterCategory.addEventListener('change', renderTransactions);
filterMonth.addEventListener('change', renderTransactions);

// Populate filter category dropdown
function populateFilterCategorySelect() {
    filterCategory.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        filterCategory.appendChild(option);
    });
}



function renderCharts() {
    // Clear existing charts to prevent duplicates
    const existingCharts = Chart.getChart ? Chart.getChart() : null;
    if (existingCharts) {
        if (Array.isArray(existingCharts)) {
            existingCharts.forEach(chart => chart.destroy());
        } else {
            existingCharts.destroy();
        }
    }

    // Spending by Category Chart
    const ctx1 = document.getElementById('spending-chart');
    if (ctx1) {
        const spendingData = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = categories.find(c => c.id == t.category)?.name || 'Uncategorized';
            spendingData[cat] = (spendingData[cat] || 0) + parseFloat(t.amount);
        });

        if (Object.keys(spendingData).length > 0) {
            new Chart(ctx1, {
                type: 'pie',
                data: {
                    labels: Object.keys(spendingData),
                    datasets: [{
                        data: Object.values(spendingData),
                        backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0', '#ff9f40']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e5e7eb'
                            }
                        }
                    }
                }
            });
        }
    }

    // Income vs Expense Chart
    const ctx2 = document.getElementById('income-expense-chart');
    if (ctx2) {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expense'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#4caf50', '#f44336']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e5e7eb'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#e5e7eb'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // Monthly Trends Chart
    const ctx3 = document.getElementById('trends-chart');
    if (ctx3) {
        const monthlyData = {};
        transactions.forEach(t => {
            const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }
            monthlyData[month][t.type] += parseFloat(t.amount);
        });

        const labels = Object.keys(monthlyData);
        const incomeData = labels.map(month => monthlyData[month].income);
        const expenseData = labels.map(month => monthlyData[month].expense);

        if (labels.length > 0) {
            new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Expense',
                        data: expenseData,
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e5e7eb'
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#e5e7eb'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#e5e7eb'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }
    }
}

// Notification system
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    // Auto-hide after duration
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);

    // Allow manual dismissal
    notification.onclick = () => {
        notification.style.display = 'none';
    };
}

// Theme toggle functionality for dark/light mode
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        if (savedTheme === 'light') {
            body.classList.add('light-mode');
            themeToggleBtn.textContent = '🌙';
        } else {
            body.classList.remove('light-mode');
            themeToggleBtn.textContent = '☀️';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            themeToggleBtn.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-mode');
            themeToggleBtn.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTransactions();
    renderCategories();
    renderBudgets();
    populateCategorySelects(); // Ensure category selects are populated
    populateFilterCategorySelect(); // Populate filter category dropdown
    renderCharts();

    // Show welcome message
    showNotification('Welcome to Personal Finance Tracker! Your data is stored locally and privately.', 'success', 5000);
});
