@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
  color-scheme: dark;
}

::selection {
  background-color: rgba(225, 29, 72, 0.4);
}

@media print {
  body {
    display: none !important;
  }
}

.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(225, 29, 72, 0.3);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(225, 29, 72, 0.5);
}

/* Card hover glow */
.card-glow {
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease;
}
.card-glow:hover {
  box-shadow: 0 0 30px rgba(225, 29, 72, 0.12), 0 8px 32px rgba(0, 0, 0, 0.4);
  border-color: rgba(225, 29, 72, 0.2);
  transform: translateY(-2px);
}

/* Subtle hover lift */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Button press */
.btn-press {
  transition: transform 0.1s ease, opacity 0.15s ease;
}
.btn-press:active {
  transform: scale(0.96);
}

/* Gradient border effect */
.gradient-border {
  position: relative;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(225,29,72,0.3), rgba(201,168,76,0.3));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* PDF mobile viewer styles */
.pdf-mobile-container {
  touch-action: pan-y pinch-zoom;
  -webkit-overflow-scrolling: touch;
}
.pdf-mobile-container canvas {
  touch-action: none;
}

/* Swipe indicator */
@keyframes swipe-hint {
  0%, 100% { opacity: 0.4; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(-8px); }
}
.swipe-hint-anim {
  animation: swipe-hint 1.5s ease-in-out 2;
}

/* Safe area for mobile bottom nav */
.safe-area-pb {
  padding-bottom: max(env(safe-area-inset-bottom), 0px);
}

/* Ambient background */
.ambient-bg {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(225,29,72,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(201,168,76,0.04) 0%, transparent 50%),
    #0c0a12;
}

/* Search input styling */
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
input[type="search"]::placeholder {
  color: #4a4556;
}

/* Custom range slider */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255,255,255,0.06);
  border-radius: 9999px;
  height: 4px;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e11d48;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(225,29,72,0.4);
}