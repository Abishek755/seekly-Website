import { db } from './firebase.js';
import { collection, getDocs, query } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('courses-list');
    if (!list) return;

    try {
        const coursesCol = collection(db, 'courses');
        const q = query(coursesCol);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            list.innerHTML = `
                <div class="col-span-1 md:col-span-3 text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm">
                    <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-4 block">school</span>
                    <h3 class="font-headline-md text-[20px] text-on-surface mb-2">Courses Coming Soon</h3>
                    <p class="font-body-md text-on-surface-variant">We are currently updating our curriculum. Check back shortly!</p>
                </div>
            `;
            return;
        }

        let html = '';
        let delay = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="scroll-animate bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm hover:shadow-[0_12px_40px_rgba(10,25,47,0.08)] hover:-translate-y-1 transition-all duration-300 group visible" style="transition-delay: ${delay}ms;">
                    <div class="h-48 bg-surface-variant relative overflow-hidden">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt="${data.title}"
                            src="${data.image || 'https://images.unsplash.com/photo-1546410531-bea5aadcb6ce?q=80&w=2000&auto=format&fit=crop'}">
                        <div class="absolute top-sm right-sm bg-tertiary-container text-white font-label-md text-[12px] px-sm py-xs rounded-full">
                            ${data.badge || 'Popular'}
                        </div>
                    </div>
                    <div class="p-md flex flex-col h-[calc(100%-12rem)]">
                        <h3 class="font-headline-md text-[20px] text-on-surface mb-sm leading-tight group-hover:text-primary transition-colors">
                            ${data.title}
                        </h3>
                        <p class="font-body-md text-body-md text-on-surface-variant mb-md flex-grow">
                            ${data.description}
                        </p>
                        <div class="border-t border-outline-variant/20 pt-md mt-auto">
                            <div class="grid grid-cols-2 gap-sm mb-md">
                                <div>
                                    <p class="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant opacity-70">${data.stat1Label || 'Fee Structure'}</p>
                                    <p class="font-bold text-on-surface text-[14px]">${data.stat1Value || 'Tiered Pricing'}</p>
                                </div>
                                <div>
                                    <p class="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant opacity-70">${data.stat2Label || 'Duration'}</p>
                                    <p class="font-bold text-on-surface text-[14px]">${data.stat2Value || 'Flexible'}</p>
                                </div>
                            </div>
                            <button onclick="document.getElementById('join-modal').classList.remove('hidden');" class="w-full bg-primary hover:bg-primary-container text-white font-bold py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">
                                Join Program
                            </button>
                        </div>
                        <div class="w-full h-1 bg-surface-container mt-sm rounded-full overflow-hidden">
                            <div class="h-full bg-primary w-[0%] group-hover:w-full transition-all duration-700 ease-in-out"></div>
                        </div>
                    </div>
                </div>
            `;
            delay += 100;
        });
        
        list.innerHTML = html;
    } catch (error) {
        console.error("Error fetching courses:", error);
        list.innerHTML = `
            <div class="col-span-1 md:col-span-3 text-center py-12 text-error bg-error-container/20 rounded-xl border border-error/20">
                <span class="material-symbols-outlined text-[32px] mb-2 text-error block">error</span>
                <p class="font-body-md text-on-surface">Failed to load courses. Please try again later.</p>
            </div>
        `;
    }
});
