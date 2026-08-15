import { db } from '../src/firebase.js';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";

async function deleteAdminStudent(id) {
    if (confirm("Are you sure you want to delete this student record?")) {
        try {
            await deleteDoc(doc(db, "students", id));
        } catch (error) {
            console.error("Error deleting student: ", error);
            alert("Failed to delete student.");
        }
    }
}

async function updateStudentFee(id, currentPaid) {
    const amountStr = prompt("Enter the new total amount paid by the student:", currentPaid);
    if (amountStr !== null && amountStr !== "") {
        const newPaid = parseFloat(amountStr);
        if (!isNaN(newPaid)) {
            try {
                await updateDoc(doc(db, "students", id), {
                    feePaid: newPaid
                });
            } catch (error) {
                console.error("Error updating fee: ", error);
                alert("Failed to update fee.");
            }
        }
    }
}



const createStudentForm = document.getElementById('create-student-form');
const createStudentBtn = document.getElementById('create-student-btn');
const studentNameInput = document.getElementById('student-name');
const studentPhoneInput = document.getElementById('student-phone');
const studentCourseSelect = document.getElementById('student-course');
const studentTotalFeeInput = document.getElementById('student-total-fee');
const studentFeePaidInput = document.getElementById('student-fee-paid');
const studentsListEl = document.getElementById('students-list');

// Populate course select dynamically from admin_courses
if (studentCourseSelect) {
    onSnapshot(collection(db, "admin_courses"), (snapshot) => {
        const currentVal = studentCourseSelect.value;
        studentCourseSelect.innerHTML = '<option value="">Select a course</option>';
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.name;
            option.textContent = data.name;
            studentCourseSelect.appendChild(option);
        });
        if (currentVal) studentCourseSelect.value = currentVal;
    });
}

// Auto-fill total fee when course is selected (optional nice-to-have)
studentCourseSelect?.addEventListener('change', async (e) => {
    // If we wanted to, we could fetch the cost. But since we subscribe above, 
    // it's easier just to let the admin manually enter the total fee if they gave a discount.
});

// Save student
if (createStudentForm) {
    createStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalBtnText = createStudentBtn.innerHTML;
        createStudentBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Registering...';
        createStudentBtn.disabled = true;

        try {
            await addDoc(collection(db, "students"), {
                name: studentNameInput.value.trim(),
                phone: studentPhoneInput.value.trim(),
                courseName: studentCourseSelect.value,
                totalFee: parseFloat(studentTotalFeeInput.value),
                feePaid: parseFloat(studentFeePaidInput.value),
                createdAt: serverTimestamp()
            });
            createStudentForm.reset();
        } catch (error) {
            console.error("Error adding student: ", error);
            alert("Error adding student. Check console for details.");
        } finally {
            createStudentBtn.innerHTML = originalBtnText;
            createStudentBtn.disabled = false;
        }
    });
}

// Listen to students
if (studentsListEl) {
    onSnapshot(collection(db, "students"), (snapshot) => {
        studentsListEl.innerHTML = '';
        
        if (snapshot.empty) {
            studentsListEl.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-on-surface-variant">No students found.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.className = 'border-b border-outline-variant/20 hover:bg-surface-container-lowest/50';
            
            const totalFee = data.totalFee || 0;
            const feePaid = data.feePaid || 0;
            const balance = totalFee - feePaid;
            
            const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
            const balanceBadgeClass = balance > 0 ? 'bg-error-container text-error' : 'bg-surface-dim text-secondary';
            
            tr.innerHTML = `
                <td class="py-4 px-md font-body-md text-on-background">${data.name}</td>
                <td class="py-4 px-md font-body-md text-on-surface-variant">${data.phone}</td>
                <td class="py-4 px-md font-body-md text-on-surface-variant">${data.courseName}</td>
                <td class="py-4 px-md font-body-md text-on-surface-variant">${formatter.format(totalFee)}</td>
                <td class="py-4 px-md font-body-md text-on-surface-variant cursor-pointer hover:text-primary transition-colors" data-action="update-fee" data-id="${docSnap.id}" data-current="${feePaid}" title="Click to update fee paid">
                    ${formatter.format(feePaid)} <span class="material-symbols-outlined text-[14px] ml-1">edit</span>
                </td>
                <td class="py-4 px-md">
                    <span class="inline-block px-3 py-1 rounded-full font-caption text-caption font-semibold ${balanceBadgeClass}">
                        ${formatter.format(balance)}
                    </span>
                </td>
                <td class="py-4 px-md text-right">
                    <button data-action="delete-student" data-id="${docSnap.id}" class="text-error hover:text-error-container p-1 rounded transition-colors">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </td>
            `;
            studentsListEl.appendChild(tr);
        });
    });
}

// Event delegation for student actions
document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('[data-action="delete-student"]');
    if (deleteBtn) {
        deleteAdminStudent(deleteBtn.dataset.id);
    }
    const feeBtn = e.target.closest('[data-action="update-fee"]');
    if (feeBtn) {
        updateStudentFee(feeBtn.dataset.id, parseFloat(feeBtn.dataset.current));
    }
});
