import { db } from '../src/firebase.js';
import { collection, onSnapshot } from "firebase/firestore";

// DOM Elements
const totalCoursesCountEl = document.getElementById('total-courses-count');
const totalStudentsCountEl = document.getElementById('total-students-count');
const jobOpeningsCountEl = document.getElementById('job-openings-count');
const ctx = document.getElementById('dashboard-chart');

// Financial DOM Elements
const totalRevenueCountEl = document.getElementById('total-revenue-count');
const totalExpensesCountEl = document.getElementById('total-expenses-count');
const netProfitCountEl = document.getElementById('net-profit-count');

// Analytics Controls
const analyticsTabs = document.querySelectorAll('#analytics-tabs button');
const analyticsRange = document.getElementById('analytics-range');
const chartTypeSelect = document.getElementById('chart-type');

// State
let currentTab = 'financials';
let currentRange = 'all-time';
let selectedChartType = 'bar';

let studentsSnapshotData = [];
let expensesSnapshotData = [];
let enquiriesSnapshotData = [];
let dashboardChart = null;
const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// 1. Fetch Admin Courses Count
if (totalCoursesCountEl) {
    onSnapshot(collection(db, "admin_courses"), (snapshot) => {
        totalCoursesCountEl.textContent = snapshot.size;
    });
}

// 2. Fetch Job Openings Count
if (jobOpeningsCountEl) {
    onSnapshot(collection(db, "careers"), (snapshot) => {
        let activeCount = 0;
        snapshot.forEach(doc => { if (doc.data().status === 'active') activeCount++; });
        jobOpeningsCountEl.textContent = activeCount;
    });
}

// --- DATA FETCHING ---
onSnapshot(collection(db, "students"), (snapshot) => {
    studentsSnapshotData = [];
    snapshot.forEach(doc => studentsSnapshotData.push(doc.data()));
    if (totalStudentsCountEl) totalStudentsCountEl.textContent = snapshot.size;
    updateAnalytics();
}, (error) => console.error(error));

onSnapshot(collection(db, "expenses"), (snapshot) => {
    expensesSnapshotData = [];
    snapshot.forEach(doc => expensesSnapshotData.push(doc.data()));
    updateAnalytics();
}, (error) => console.error(error));

onSnapshot(collection(db, "enquiries"), (snapshot) => {
    enquiriesSnapshotData = [];
    snapshot.forEach(doc => enquiriesSnapshotData.push(doc.data()));
    updateAnalytics();
}, (error) => console.error(error));

// --- ANALYTICS ENGINE ---

// Event Listeners for UI
analyticsTabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
        analyticsTabs.forEach(b => {
            b.classList.remove('bg-surface', 'text-on-surface', 'shadow-sm');
            b.classList.add('text-on-surface-variant');
        });
        e.target.classList.add('bg-surface', 'text-on-surface', 'shadow-sm');
        e.target.classList.remove('text-on-surface-variant');
        
        currentTab = e.target.dataset.tab;
        
        // Auto-switch defaults to look good
        if(currentTab === 'financials') {
            chartTypeSelect.value = 'bar';
            selectedChartType = 'bar';
        } else {
            chartTypeSelect.value = 'area';
            selectedChartType = 'area';
        }
        updateAnalytics();
    });
});

if (analyticsRange) {
    analyticsRange.addEventListener('change', (e) => {
        currentRange = e.target.value;
        updateAnalytics();
    });
}

if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', (e) => {
        selectedChartType = e.target.value;
        updateAnalytics();
    });
}

function filterByDateRange(dataArray, dateField) {
    const now = new Date();
    return dataArray.filter(item => {
        const timestamp = item[dateField];
        if (!timestamp) return false;
        const date = timestamp.toDate();
        
        if (currentRange === 'last-7-days') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return date >= sevenDaysAgo;
        } else if (currentRange === 'this-month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        } else if (currentRange === 'this-year') {
            return date.getFullYear() === now.getFullYear();
        }
        return true; 
    });
}

function getGroupKey(date) {
    if (currentRange === 'last-7-days' || currentRange === 'this-month') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
}

// Pre-fill empty date buckets so chart is never empty
function getInitializedGroupedData(isFinancial) {
    const grouped = {};
    const now = new Date();
    
    if (currentRange === 'last-7-days') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            grouped[key] = isFinancial ? { rev: 0, exp: 0 } : 0;
        }
    } else if (currentRange === 'this-month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), i);
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            grouped[key] = isFinancial ? { rev: 0, exp: 0 } : 0;
            if (i > now.getDate()) break; // Only show up to today in current month
        }
    } else if (currentRange === 'this-year') {
        for (let i = 0; i <= now.getMonth(); i++) {
            const d = new Date(now.getFullYear(), i, 1);
            const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            grouped[key] = isFinancial ? { rev: 0, exp: 0 } : 0;
        }
    } else if (currentRange === 'all-time') {
        // Generate last 12 months to ensure it always looks good (not just 1 dot)
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            grouped[key] = isFinancial ? { rev: 0, exp: 0 } : 0;
        }
    }
    
    return grouped;
}

function updateAnalytics() {
    const filteredStudents = filterByDateRange(studentsSnapshotData, 'createdAt');
    const filteredExpenses = filterByDateRange(expensesSnapshotData, 'createdAt');
    const filteredEnquiries = filterByDateRange(enquiriesSnapshotData, 'createdAt');

    let totalRevenue = 0;
    filteredStudents.forEach(s => totalRevenue += (s.feePaid || 0));
    
    let totalExpenses = 0;
    filteredExpenses.forEach(e => totalExpenses += (e.amount || 0));
    
    const netProfit = totalRevenue - totalExpenses;

    if (totalRevenueCountEl) totalRevenueCountEl.textContent = formatter.format(totalRevenue);
    if (totalExpensesCountEl) totalExpensesCountEl.textContent = formatter.format(totalExpenses);
    if (netProfitCountEl) {
        netProfitCountEl.textContent = formatter.format(netProfit);
        if (netProfit < 0) {
            netProfitCountEl.classList.remove('text-tertiary');
            netProfitCountEl.classList.add('text-error');
        } else {
            netProfitCountEl.classList.remove('text-error');
            netProfitCountEl.classList.add('text-tertiary');
        }
    }

    if (!ctx) return;

    let chartData = { labels: [], datasets: [] };
    
    const isArea = selectedChartType === 'area';
    const isDoughnut = selectedChartType === 'doughnut';
    let chartRenderType = isDoughnut ? 'doughnut' : (isArea ? 'line' : 'bar');

    if (currentTab === 'financials') {
        if (isDoughnut) {
            chartData.labels = ['Revenue (INR)', 'Expenses (INR)'];
            chartData.datasets = [{
                data: [totalRevenue, totalExpenses],
                backgroundColor: ['#4CAF50', '#F44336'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }];
        } else {
            const grouped = getInitializedGroupedData(true);
            filteredStudents.forEach(s => {
                const k = getGroupKey(s.createdAt.toDate());
                if(grouped[k]) grouped[k].rev += (s.feePaid || 0);
            });
            filteredExpenses.forEach(e => {
                const k = getGroupKey(e.createdAt.toDate());
                if(grouped[k]) grouped[k].exp += (e.amount || 0);
            });

            const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
            
            chartData.labels = sortedKeys;
            chartData.datasets = [
                { 
                    label: 'Revenue (INR)', 
                    data: sortedKeys.map(k => grouped[k].rev), 
                    backgroundColor: isArea ? 'rgba(76, 175, 80, 0.2)' : '#4CAF50', 
                    borderColor: '#4CAF50',
                    borderWidth: isArea ? 2 : 0,
                    fill: isArea,
                    tension: 0.4,
                    borderRadius: isArea ? 0 : 4 
                },
                { 
                    label: 'Expenses (INR)', 
                    data: sortedKeys.map(k => grouped[k].exp), 
                    backgroundColor: isArea ? 'rgba(244, 67, 54, 0.2)' : '#F44336', 
                    borderColor: '#F44336',
                    borderWidth: isArea ? 2 : 0,
                    fill: isArea,
                    tension: 0.4,
                    borderRadius: isArea ? 0 : 4 
                }
            ];
        }
    } else if (currentTab === 'students') {
        if (isDoughnut) {
            chartData.labels = ['New Enrollments'];
            chartData.datasets = [{ data: [filteredStudents.length], backgroundColor: ['#1976D2'], borderWidth: 2, borderColor: '#ffffff' }];
        } else {
            const grouped = getInitializedGroupedData(false);
            filteredStudents.forEach(s => {
                const k = getGroupKey(s.createdAt.toDate());
                if(grouped[k] !== undefined) grouped[k] += 1;
            });
            const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
            
            chartData.labels = sortedKeys;
            chartData.datasets = [
                { 
                    label: 'New Enrollments', 
                    data: sortedKeys.map(k => grouped[k]), 
                    borderColor: '#1976D2', 
                    backgroundColor: isArea ? 'rgba(25, 118, 210, 0.2)' : '#1976D2',
                    fill: isArea,
                    tension: 0.4,
                    borderWidth: isArea ? 3 : 0,
                    borderRadius: isArea ? 0 : 4 
                }
            ];
        }
    } else if (currentTab === 'enquiries') {
        if (isDoughnut) {
            chartData.labels = ['New Enquiries'];
            chartData.datasets = [{ data: [filteredEnquiries.length], backgroundColor: ['#9C27B0'], borderWidth: 2, borderColor: '#ffffff' }];
        } else {
            const grouped = getInitializedGroupedData(false);
            filteredEnquiries.forEach(e => {
                const k = getGroupKey(e.createdAt.toDate());
                if(grouped[k] !== undefined) grouped[k] += 1;
            });
            const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
            
            chartData.labels = sortedKeys;
            chartData.datasets = [
                { 
                    label: 'New Enquiries', 
                    data: sortedKeys.map(k => grouped[k]), 
                    borderColor: '#9C27B0', 
                    backgroundColor: isArea ? 'rgba(156, 39, 176, 0.2)' : '#9C27B0',
                    fill: isArea,
                    tension: 0.4,
                    borderWidth: isArea ? 3 : 0,
                    borderRadius: isArea ? 0 : 4 
                }
            ];
        }
    }

    if (dashboardChart) {
        dashboardChart.destroy(); 
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { family: "'Inter', sans-serif" } }
            }
        }
    };

    if (!isDoughnut) {
        chartOptions.interaction = {
            mode: 'index',
            intersect: false,
        };
        chartOptions.scales = {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: function(value) {
                        if (currentTab === 'financials') {
                            if (value >= 1000) return '₹' + (value/1000) + 'k';
                            return '₹' + value;
                        }
                        return value; 
                    },
                    precision: currentTab === 'financials' ? undefined : 0
                }
            },
            x: {
                grid: { display: false }
            }
        };
    } else {
        // Doughnut specific options to make it look nice
        chartOptions.cutout = '70%';
        chartOptions.plugins.tooltip = {
            callbacks: {
                label: function(context) {
                    let label = context.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed !== null) {
                        if (currentTab === 'financials') {
                            label += formatter.format(context.parsed);
                        } else {
                            label += context.parsed;
                        }
                    }
                    return label;
                }
            }
        };
    }

    dashboardChart = new Chart(ctx, {
        type: chartRenderType,
        data: chartData,
        options: chartOptions
    });
}
