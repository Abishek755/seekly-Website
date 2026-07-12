import { db } from '../src/firebase.js';
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// DOM Elements
const enquiriesListEl = document.getElementById('enquiries-list');
const totalEnquiriesCountEl = document.getElementById('total-enquiries-count');

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadge(status) {
    const s = (status || 'New').toLowerCase();
    if (s === 'new') {
        return '<span class="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-caption text-caption font-semibold">New</span>';
    } else if (s === 'pending') {
        return '<span class="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-caption text-caption font-semibold">Pending</span>';
    } else if (s === 'resolved') {
        return '<span class="inline-block px-3 py-1 rounded-full bg-surface-dim text-secondary font-caption text-caption font-semibold">Resolved</span>';
    }
    return `<span class="inline-block px-3 py-1 rounded-full bg-surface-dim text-on-surface-variant font-caption text-caption font-semibold">${status}</span>`;
}

// Fetch enquiries in real-time
if (enquiriesListEl && totalEnquiriesCountEl) {
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"), limit(50));
    
    onSnapshot(q, (snapshot) => {
        // Update Total Count (Note: this is only the count of the fetched query right now, 
        // to get true total requires aggregation or fetching all. For now we show the count of fetched limit)
        // If we want true total, we could fetch it separately, but this works for demo.
        totalEnquiriesCountEl.textContent = snapshot.size;
        
        enquiriesListEl.innerHTML = '';
        
        if (snapshot.empty) {
            enquiriesListEl.innerHTML = `
                <tr>
                    <td colspan="4" class="py-4 px-md font-body-md text-on-surface-variant text-center">No recent enquiries found.</td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const name = data.name || 'Anonymous';
            
            // The subject could come from "subject" (contact form) or "courses" (join form)
            let subject = data.subject || '';
            if (!subject && data.courses) {
                // if it's an array or string
                if (Array.isArray(data.courses)) {
                    subject = data.courses.join(', ');
                } else {
                    subject = data.courses;
                }
            }
            if (!subject) subject = 'General Inquiry';
            
            const dateStr = formatTimestamp(data.createdAt);
            const statusBadge = getStatusBadge(data.status);

            const tr = document.createElement('tr');
            tr.className = 'border-b border-outline-variant/20 hover:bg-surface-container-lowest/50 transition-colors';
            
            tr.innerHTML = `
                <td class="py-4 px-md font-body-md text-body-md text-on-background font-medium">${name}</td>
                <td class="py-4 px-md font-body-md text-body-md text-on-surface-variant truncate max-w-[200px]" title="${subject}">${subject}</td>
                <td class="py-4 px-md font-caption text-caption text-on-surface-variant">${dateStr}</td>
                <td class="py-4 px-md">
                    ${statusBadge}
                </td>
            `;
            
            enquiriesListEl.appendChild(tr);
        });
    }, (error) => {
        console.error("Error fetching enquiries:", error);
        enquiriesListEl.innerHTML = `
            <tr>
                <td colspan="4" class="py-4 px-md font-body-md text-red-500 text-center">Failed to load enquiries. Please check Firebase configuration.</td>
            </tr>
        `;
    });
}
