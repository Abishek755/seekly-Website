import { db } from '../src/firebase.js';
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";



const createCourseForm = document.getElementById('create-course-form');
const createCourseBtn = document.getElementById('create-course-btn');
const courseNameInput = document.getElementById('course-name');
const courseCostInput = document.getElementById('course-cost');
const coursesListEl = document.getElementById('courses-list');

// Save course
if (createCourseForm) {
    createCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalBtnText = createCourseBtn.innerHTML;
        createCourseBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Adding...';
        createCourseBtn.disabled = true;

        try {
            await addDoc(collection(db, "admin_courses"), {
                name: courseNameInput.value.trim(),
                cost: parseFloat(courseCostInput.value),
                createdAt: serverTimestamp()
            });
            createCourseForm.reset();
        } catch (error) {
            console.error("Error adding course: ", error);
            alert("Error adding course. Check console for details.");
        } finally {
            createCourseBtn.innerHTML = originalBtnText;
            createCourseBtn.disabled = false;
        }
    });
}

// Global function to delete course
window.deleteAdminCourse = async function(id) {
    if (confirm("Are you sure you want to delete this course?")) {
        try {
            await deleteDoc(doc(db, "admin_courses", id));
        } catch (error) {
            console.error("Error deleting course: ", error);
            alert("Failed to delete course.");
        }
    }
};

// Listen to courses
if (coursesListEl) {
    onSnapshot(collection(db, "admin_courses"), (snapshot) => {
        coursesListEl.innerHTML = '';
        
        if (snapshot.empty) {
            coursesListEl.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-on-surface-variant">No courses found.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.className = 'border-b border-outline-variant/20 hover:bg-surface-container-lowest/50';
            
            const costStr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.cost || 0);
            
            tr.innerHTML = `
                <td class="py-4 px-md font-body-md text-on-background">${data.name}</td>
                <td class="py-4 px-md font-body-md text-on-surface-variant">${costStr}</td>
                <td class="py-4 px-md">
                    <button onclick="deleteAdminCourse('${doc.id}')" class="text-error hover:text-error-container">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            coursesListEl.appendChild(tr);
        });
    });
}
