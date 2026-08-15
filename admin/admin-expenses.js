import { db } from '../src/firebase.js';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, query, orderBy } from "firebase/firestore";

async function deleteAdminExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        try {
            await deleteDoc(doc(db, "expenses", id));
        } catch (error) {
            console.error("Error deleting expense: ", error);
            alert("Failed to delete expense.");
        }
    }
}

const createExpenseForm = document.getElementById('create-expense-form');
const createExpenseBtn = document.getElementById('create-expense-btn');
const expenseDescInput = document.getElementById('expense-desc');
const expenseAmountInput = document.getElementById('expense-amount');
const expensesListEl = document.getElementById('expenses-list');

// Save expense
if (createExpenseForm) {
    createExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalBtnText = createExpenseBtn.innerHTML;
        createExpenseBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Logging...';
        createExpenseBtn.disabled = true;

        try {
            await addDoc(collection(db, "expenses"), {
                description: expenseDescInput.value.trim(),
                amount: parseFloat(expenseAmountInput.value),
                createdAt: serverTimestamp()
            });
            createExpenseForm.reset();
        } catch (error) {
            console.error("Error adding expense: ", error);
            alert("Error adding expense. Check console for details.");
        } finally {
            createExpenseBtn.innerHTML = originalBtnText;
            createExpenseBtn.disabled = false;
        }
    });
}

// Listen to expenses
if (expensesListEl) {
    const q = query(collection(db, "expenses"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        expensesListEl.innerHTML = '';
        
        if (snapshot.empty) {
            expensesListEl.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-on-surface-variant">No expenses found.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.className = 'border-b border-outline-variant/20 hover:bg-surface-container-lowest/50';
            
            const amountStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.amount || 0);
            
            let dateStr = 'Just now';
            if (data.createdAt) {
                dateStr = data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            
            tr.innerHTML = `
                <td class="py-4 px-md font-body-md text-on-background font-medium">${data.description}</td>
                <td class="py-4 px-md font-body-md text-error font-semibold">${amountStr}</td>
                <td class="py-4 px-md font-caption text-caption text-on-surface-variant">${dateStr}</td>
                <td class="py-4 px-md text-right">
                    <button data-action="delete-expense" data-id="${docSnap.id}" class="text-on-surface-variant hover:text-error transition-colors p-1 rounded">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </td>
            `;
            expensesListEl.appendChild(tr);
        });
    });
}

// Event delegation for expense actions
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="delete-expense"]');
    if (btn) {
        deleteAdminExpense(btn.dataset.id);
    }
});
