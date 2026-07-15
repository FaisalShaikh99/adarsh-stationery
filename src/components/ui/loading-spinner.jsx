"use client";

import React from "react";

export function LoadingSpinner({ size = 140, label = "Loading page...", className = "" }) {
  // Coordinates for the pencil offset-path (the exact route the pencil tip walks: loading + dots)
  const masterPath = `
    M 100 90 
    L 100 110 
    L 108 110 
    M 118 100 
    C 124 100 124 110 118 110 
    C 112 110 112 100 118 100 Z 
    M 135 100 
    C 129 100 129 110 135 110 
    L 135 100 
    L 135 110 
    M 148 93 
    L 148 110 
    M 148 110 
    C 143 110 140 106 140 102 
    C 140 98 143 100 148 100 
    M 158 100 
    L 158 110 
    M 158 93 
    L 158 94 
    M 166 100 
    L 166 110 
    M 166 102 
    C 166 100 174 100 174 103 
    L 174 110 
    M 186 100 
    C 180 100 180 107 186 107 
    L 186 100 
    L 186 112 
    C 186 116 180 116 180 112 
    M 196 110 
    L 196.1 110 
    M 202 110 
    L 202.1 110 
    M 208 110 
    L 208.1 110 
    M 220 95
  `.replace(/\s+/g, " ").trim();

  // Path for "loading" text
  const loadingPath = `
    M 100 90 L 100 110 L 108 110 
    M 118 100 
    C 124 100 124 110 118 110 
    C 112 110 112 100 118 100 Z 
    M 135 100 
    C 129 100 129 110 135 110 
    L 135 100 L 135 110 
    M 148 93 L 148 110 
    M 148 110 
    C 143 110 140 106 140 102 
    C 140 98 143 100 148 100 
    M 158 100 L 158 110 
    M 158 93 L 158 94 
    M 166 100 L 166 110 
    M 166 102 
    C 166 100 174 100 174 103 
    L 174 110 
    M 186 100 
    C 180 100 180 107 186 107 
    L 186 100 L 186 112 
    C 186 116 180 116 180 112
  `.replace(/\s+/g, " ").trim();

  // Path for dots
  const dotsPath = `
    M 196 110 L 196.1 110 
    M 202 110 L 202.1 110 
    M 208 110 L 208.1 110
  `.replace(/\s+/g, " ").trim();

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: (size * 150) / 300 }}
    >
      <style>{`
        /* Writing Canvas Paths Animations */
        .path-loading {
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: draw-loading-seq 4s infinite linear;
        }

        .path-dots {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: draw-dots-seq 4s infinite linear;
        }

        /* 3D Pencil Translation and Rotation Animation */
        .pencil-group {
          offset-path: path("${masterPath}");
          -webkit-offset-path: path("${masterPath}");
          offset-rotate: 0deg;
          animation: pencil-write-seq 4s infinite linear;
          transform-origin: 0px 0px;
        }

        @keyframes draw-loading-seq {
          0% {
            stroke-dashoffset: 220;
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          75% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          90%, 100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes draw-dots-seq {
          0%, 75% {
            stroke-dashoffset: 20;
            opacity: 0;
          }
          76% {
            opacity: 1;
          }
          82% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          84% {
            opacity: 0.3;
          }
          86% {
            opacity: 1;
          }
          88% {
            opacity: 0.3;
          }
          90% {
            opacity: 1;
          }
          94%, 100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes pencil-write-seq {
          0% {
            offset-distance: 0%;
            -webkit-offset-distance: 0%;
            transform: translate(0, 0) rotate(-32deg);
            opacity: 0;
          }
          2% {
            opacity: 1;
          }
          /* Draw "loading" (0% to 75%) */
          75% {
            offset-distance: 91%;
            -webkit-offset-distance: 91%;
            transform: translate(0, 0) rotate(-30deg);
            opacity: 1;
          }
          /* Dotting dots (75% to 82%) */
          82% {
            offset-distance: 100%;
            -webkit-offset-distance: 100%;
            transform: translate(0, 0) rotate(-32deg);
            opacity: 1;
          }
          /* Lift naturally and fade */
          89% {
            transform: translate(0, -18px) rotate(-15deg);
            opacity: 0.8;
          }
          94%, 100% {
            transform: translate(0, -30px) rotate(-10deg);
            opacity: 0;
          }
        }

        /* Accessibility: respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .pencil-group {
            animation: none !important;
            opacity: 0 !important;
          }
          .path-loading, .path-dots {
            animation: fade-reduced-motion 3s infinite ease-in-out !important;
            stroke-dashoffset: 0 !important;
          }
          @keyframes fade-reduced-motion {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
        }
      `}</style>

      <svg
        viewBox="0 0 300 150"
        className="w-full h-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Notebook Ruled Guidelines (Paper Background Style) */}
        <line x1="10" y1="67" x2="290" y2="67" stroke="currentColor" opacity="0.07" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="10" y1="112" x2="290" y2="112" stroke="currentColor" opacity="0.07" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Margin line removed for dark theme */}

        {/* Loading text */}
        <path
          className="path-loading"
          stroke="currentColor"
          strokeWidth="3.5"
          d={loadingPath}
        />

        {/* Animating Dots */}
        <path
          className="path-dots"
          stroke="currentColor"
          strokeWidth="3.5"
          d={dotsPath}
        />

        {/* 3D Realistic Pencil Group */}
        <g className="pencil-group">
          {/* Faint pencil shadow group offset */}
          <g transform="translate(4, 5)" opacity="0.12">
            <path d="M 0 0 L -3.5 -7 L 3.5 -7 Z" fill="#000" />
            <path d="M -3.5 -7 L -9 -18 L 9 -18 L 3.5 -7 Z" fill="#000" />
            <rect x="-9" y="-72" width="18" height="54" fill="#000" />
            <rect x="-9" y="-83" width="18" height="11" fill="#000" />
            <path d="M -9 -83 L -9 -93 C -9 -98 9 -98 9 -93 L 9 -83 Z" fill="#000" />
          </g>

          {/* Eraser */}
          <path d="M -9 -83 L -9 -93 C -9 -98 9 -98 9 -93 L 9 -83 Z" fill="#FFA3A3" />
          
          {/* Metal Ferrule */}
          <rect x="-9" y="-83" width="18" height="11" fill="#CCCCCC" />
          <rect x="-9" y="-80" width="18" height="2" fill="#999999" />
          <rect x="-9" y="-76" width="18" height="2" fill="#999999" />
          
          {/* Yellow wooden body with 3D stripes */}
          <rect x="-9" y="-72" width="5" height="54" fill="#D4A11E" />
          <rect x="-4" y="-72" width="8" height="54" fill="#F2C94C" />
          <rect x="4" y="-72" width="5" height="54" fill="#FFE57F" />
          
          {/* Wood shaved cone */}
          <path d="M -9 -18 L -3.5 -7 L 3.5 -7 L 9 -18 Z" fill="#E6C287" />
          
          {/* Lead graphite tip */}
          <path d="M -3.5 -7 L 0 0 L 3.5 -7 Z" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
