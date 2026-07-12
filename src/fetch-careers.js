import { db } from './firebase.js';
import { collection, getDocs, query } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('careers-list');
    if (!list) return;

    try {
        const careersCol = collection(db, 'careers');
        const q = query(careersCol);
        
        // Create a timeout promise to handle the infinite loading if Firestore is not initialized
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Firestore timeout - database might not be initialized"));
            }, 3000);
        });

        // Race the getDocs call against the 3-second timeout
        const snapshot = await Promise.race([
            getDocs(q),
            timeoutPromise
        ]);

        if (snapshot.empty) {
            list.innerHTML = `
                <div class="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm">
                    <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-4 block">work_off</span>
                    <h3 class="font-headline-md text-[20px] text-on-surface mb-2">No Open Positions</h3>
                    <p class="font-body-md text-on-surface-variant">Check back later for new opportunities.</p>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 card-hover-effect shadow-[0_4px_20px_rgba(10,25,47,0.05)]">
                    <div class="flex gap-4 items-start">
                        <div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-tertiary">${data.icon || 'work'}</span>
                        </div>
                        <div>
                            <h3 class="font-headline-md text-headline-md text-on-background mb-1">${data.title || 'Untitled Role'}</h3>
                            <div class="flex flex-wrap gap-2 items-center">
                                <span class="inline-flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                                    <span class="material-symbols-outlined text-[16px]">location_on</span> ${data.location || 'Remote'}
                                </span>
                                <span class="w-1 h-1 rounded-full bg-outline-variant"></span>
                                <span class="inline-flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                                    <span class="material-symbols-outlined text-[16px]">schedule</span> ${data.type || 'Full-time'}
                                </span>
                                <span class="ml-2 px-2 py-0.5 rounded bg-primary-container/20 text-on-primary-container font-caption text-caption font-medium">${data.department || 'General'}</span>
                            </div>
                        </div>
                    </div>
                    <button class="inline-flex items-center gap-2 text-primary font-label-md text-label-md hover:text-primary-container transition-colors group whitespace-nowrap mt-4 md:mt-0"
                        onclick="document.getElementById('join-modal').classList.remove('hidden')">
                        Apply Now
                        <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            `;
        });
        
        list.innerHTML = html;
    } catch (error) {
        console.error("Error fetching careers:", error);
        // Fallback gracefully to the empty state when timeout happens
        list.innerHTML = `
            <div class="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm">
                <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-4 block">work_off</span>
                <h3 class="font-headline-md text-[20px] text-on-surface mb-2">No Open Positions</h3>
                <p class="font-body-md text-on-surface-variant">Check back later for new opportunities.</p>
            </div>
        `;
    }
});
