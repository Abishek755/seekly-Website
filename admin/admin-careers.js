import { db } from "../src/firebase.js";
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
    const listContainer = document.getElementById("active-openings-list");
    const createForm = document.getElementById("create-job-form");
    const submitBtn = createForm.querySelector('button[type="submit"]');

    // Helper function to map department to an icon
    function getIconForDepartment(department) {
        const d = department.toLowerCase();
        if (d.includes('engineering') || d.includes('tech') || d.includes('code')) return 'code';
        if (d.includes('media') || d.includes('video') || d.includes('design')) return 'videocam';
        if (d.includes('marketing') || d.includes('growth') || d.includes('sales')) return 'trending_up';
        if (d.includes('curriculum') || d.includes('education') || d.includes('teaching')) return 'domain';
        return 'work'; // default fallback
    }

    // Capitalize helper
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Function to fetch and render careers
    async function loadCareers() {
        if (!listContainer) return;
        
        listContainer.innerHTML = `
            <div class="flex justify-center items-center py-8 text-primary">
                <span class="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
            </div>
        `;

        try {
            const careersCol = collection(db, 'careers');
            // Assuming documents have a createdAt timestamp for ordering
            // If they don't, it will just fallback to random order which is fine
            let q = query(careersCol); 
            
            // Note: If you want true ordering by time, uncomment this and ensure an index is built in Firebase
            // q = query(careersCol, orderBy('createdAt', 'desc'));

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                listContainer.innerHTML = `
                    <div class="p-4 text-center text-on-surface-variant bg-surface-container-low rounded-lg">
                        No active openings found.
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                
                html += `
                    <div class="p-sm rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/30 group cursor-pointer relative" data-id="${doc.id}">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">${data.title || 'Untitled Role'}</h4>
                                <p class="font-caption text-caption text-on-surface-variant flex items-center gap-1 mt-1">
                                    <span class="material-symbols-outlined text-[16px]">${data.icon || 'work'}</span> ${capitalize(data.department) || 'General'}
                                </p>
                            </div>
                            <span class="bg-tertiary-container/20 text-tertiary-container font-caption text-caption px-2 py-1 rounded-md flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span> Active
                            </span>
                        </div>
                        <div class="flex items-center gap-3 mt-3">
                            <span class="bg-surface-variant text-on-surface-variant font-caption text-caption px-2 py-0.5 rounded flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">location_on</span> ${capitalize(data.location) || 'Remote'}
                            </span>
                            <span class="text-on-surface-variant font-caption text-caption flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">schedule</span> ${capitalize(data.type) || 'Full-time'}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            listContainer.innerHTML = html;
        } catch (error) {
            console.error("Error fetching careers:", error);
            listContainer.innerHTML = `
                <div class="p-4 text-center text-error bg-error-container/20 border border-error/20 rounded-lg">
                    Failed to load openings. Make sure Firebase is configured.
                </div>
            `;
        }
    }

    // Handle form submission to create new job
    if (createForm) {
        createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const titleInput = document.getElementById('job-title').value;
            const departmentInput = document.getElementById('job-department').value;
            const locationInput = document.getElementById('job-location').value;
            const typeInput = document.getElementById('job-type').value;
            const descInput = document.getElementById('job-description').value;

            // Change button to loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Saving...`;
            submitBtn.disabled = true;

            try {
                const docData = {
                    title: titleInput,
                    department: capitalize(departmentInput),
                    location: capitalize(locationInput),
                    type: typeInput === 'fulltime' ? 'Full-time' : typeInput === 'parttime' ? 'Part-time' : 'Contract',
                    description: descInput,
                    icon: getIconForDepartment(departmentInput),
                    createdAt: serverTimestamp()
                };

                const careersCol = collection(db, 'careers');
                await addDoc(careersCol, docData);

                // Reset form
                createForm.reset();
                
                // Show success briefly (optional UX enhancement)
                submitBtn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Published!`;
                submitBtn.classList.add('bg-tertiary-container', 'text-on-tertiary-container');
                submitBtn.classList.remove('btn-primary');

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('bg-tertiary-container', 'text-on-tertiary-container');
                    submitBtn.classList.add('btn-primary');
                }, 3000);

                // Reload list
                loadCareers();

            } catch (error) {
                console.error("Error creating job:", error);
                alert("Failed to create job opening. Please try again.");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Initial load
    loadCareers();
});
