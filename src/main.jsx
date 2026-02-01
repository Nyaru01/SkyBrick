import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Force dark mode always (app has dark background)
document.documentElement.classList.add('dark');

console.log('%c☁️ SKYBRICK V1.0.1 ☁️', 'background: #0f172a; color: #a5b4fc; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

// --- PWA HELPER LOGIC ---
function isInsidePWA() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

if (isInsidePWA()) {
  document.body.classList.add("pwa");
}

// Prevent default context menu in PWA except for specific elements
document.addEventListener('contextmenu', (e) => {
  if (!isInsidePWA()) return;
  if (e.shiftKey) return; // Allow dev debug with Shift

  if (e.target.matches('a, img, video, audio, textarea:not([disabled]), input[type="text"]:not([disabled]), div.cm-content[contenteditable="true"] *')) {
    return;
  }

  const selection = window.getSelection();
  if (selection.toString().length > 0) return;

  e.preventDefault();
});
// ------------------------

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <App />
  // </StrictMode>,
)
