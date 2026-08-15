/**
 * Seekhly — Shared Navbar Module
 * Injects identical navbar HTML, CSS, and JS into every page.
 * Active link is auto-detected from window.location.pathname.
 */

// ── 1. INJECT CSS ──────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  .glass-nav {
    background: rgba(32, 41, 64, 1) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 0 8px 1px rgba(255, 255, 255, 0.05) !important;
    overflow: hidden;
    transition: all 0.3s ease !important;
  }
  .glass-nav.scrolled {
    background: rgba(32, 41, 64, 0.3) !important;
    backdrop-filter: blur(2px) !important;
    -webkit-backdrop-filter: blur(2px) !important;
  }
  .glass-nav:hover {
    background: rgba(32, 41, 64, 1) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
  }
  .glass-nav::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  }
  .glass-nav::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 1px; height: 100%;
    background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent, rgba(255,255,255,0.05));
  }
`;
document.head.appendChild(style);

// ── 2. DETECT ACTIVE PAGE ──────────────────────────────────────────────────────
const path = window.location.pathname;
const isActive = (page) => {
  if (page === 'index.html') return path === '/' || path.endsWith('index.html') || path === '';
  return path.endsWith(page);
};

const navLinkClass = 'font-label-md text-label-md text-white/80 hover:text-white hover:bg-white/10 rounded-full px-5 py-2.5 transition-all duration-300';
const activeLinkClass = 'font-label-md text-label-md bg-white text-[#0b1c30] font-bold shadow-md rounded-full px-5 py-2.5 transition-all duration-300';

const pages = [
  { label: 'Home',    href: 'index.html' },
  { label: 'Courses', href: 'index.html#courses' },
  { label: 'About',   href: 'about.html' },
  { label: 'Careers', href: 'career.html' },
  { label: 'Contact', href: 'contact.html' },
];

const desktopLinks = pages.map(({ label, href }) => {
  // For courses link, highlight on index page but not as "active" in the same sense
  const active = isActive(href.replace('#courses', ''));
  const cls = (active && label !== 'Courses') ? activeLinkClass : navLinkClass;
  return `<a class="${cls}" href="${href}">${label}</a>`;
}).join('\n');

const mobileLinks = pages.map(({ label, href }) =>
  `<a class="mobile-drop-link text-gray-800 font-medium text-sm px-3 py-2.5 rounded-lg hover:bg-orange-50 hover:text-primary transition-all" href="${href}">${label}</a>`
).join('\n');

// ── 3. INJECT NAVBAR HTML ──────────────────────────────────────────────────────
const navHTML = `
<nav class="glass-nav fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 rounded-full transition-all duration-300 scale-90 origin-top">
  <div class="flex justify-between items-center px-4 md:px-6 py-3">
    <a class="flex items-center gap-2 z-50 relative ml-2" href="index.html">
      <img src="/logo-full.png" alt="Seekhly EdTech Logo" width="160" height="32" loading="eager" class="h-6 md:h-8 object-contain">
    </a>
    <div class="hidden lg:flex items-center space-x-1 bg-white/10 p-1.5 rounded-full border border-white/10">
      ${desktopLinks}
    </div>
    <div class="flex items-center space-x-3">
      <button id="nav-join-btn" class="bg-primary hover:bg-primary-container text-white font-label-md text-label-md px-6 py-2.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg active:scale-95 hidden md:block">
        Join Now
      </button>
      <button id="mobile-menu-btn" class="lg:hidden text-white p-2">
        <span class="material-symbols-outlined">menu</span>
      </button>
    </div>
  </div>
</nav>

<!-- Mobile Dropdown -->
<div id="mobile-dropdown" class="lg:hidden fixed top-[4.2rem] right-[2.5%] w-[180px] z-[140] hidden">
  <div class="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
    <nav class="flex flex-col p-2 gap-0.5">
      ${mobileLinks}
      <div class="border-t border-gray-100 mt-1 pt-1">
        <button id="mobile-join-btn" class="mobile-drop-link w-full bg-primary text-white font-semibold text-sm px-3 py-2.5 rounded-lg transition-all duration-300">
          Join Now
        </button>
      </div>
    </nav>
  </div>
</div>
`;

// Insert navbar as first child of body
document.body.insertAdjacentHTML('afterbegin', navHTML);

// ── 4. SCROLL EFFECT ───────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.glass-nav');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
});

// ── 5. MOBILE DROPDOWN LOGIC ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const dropdown  = document.getElementById('mobile-dropdown');
  const dropLinks = dropdown ? dropdown.querySelectorAll('.mobile-drop-link') : [];

  if (mobileBtn && dropdown) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    dropLinks.forEach(link => link.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    }));

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !mobileBtn.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // Join Now buttons — open modal if it exists on this page
  ['nav-join-btn', 'mobile-join-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('join-modal');
        if (modal) modal.classList.remove('hidden');
      });
    }
  });
});
