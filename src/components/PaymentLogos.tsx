import React from 'react';

/**
 * High-fidelity bKash Logo Component
 */
export function BKashLogo({ className = "w-10 h-10", size = 40 }: { className?: string; size?: number }) {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-xl bg-[#E2136E] text-white shadow-md shadow-[#E2136E]/20 overflow-hidden shrink-0 ${className}`}
      title="bKash"
    >
      {/* Official bKash Origami Bird SVG */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full p-1.5"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head/Beak */}
        <path d="M72 18L48 35L62 44L72 18Z" fill="white" />
        {/* Upper Wing */}
        <path d="M48 35L15 48L44 56L48 35Z" fill="white" fillOpacity="0.95" />
        {/* Lower Body */}
        <path d="M44 56L34 84L58 64L44 56Z" fill="white" fillOpacity="0.9" />
        {/* Right Tail Wing */}
        <path d="M58 64L85 62L62 44L58 64Z" fill="white" fillOpacity="0.85" />
        {/* Center fold */}
        <path d="M48 35L44 56L58 64L62 44L48 35Z" fill="white" fillOpacity="0.98" />
      </svg>
    </div>
  );
}

/**
 * High-fidelity Cash on Delivery (COD) Logo Component
 */
export function CodLogo({ className = "w-10 h-10", size = 40 }: { className?: string; size?: number }) {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md shadow-emerald-700/20 overflow-hidden shrink-0 ${className}`}
      title="Cash on Delivery"
    >
      <svg 
        viewBox="0 0 48 48" 
        className="w-full h-full p-2" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Banknote */}
        <rect x="6" y="10" width="36" height="22" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2.5" />
        {/* Currency symbol circle */}
        <circle cx="24" cy="21" r="5" fill="white" fillOpacity="0.9" />
        <path d="M22 18H26M24 18V24M22 24H26" stroke="#006948" strokeWidth="1.8" strokeLinecap="round" />
        {/* Delivery hand / arrows */}
        <path d="M12 36L20 40L36 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 30L38 34L34 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
