"use client";

import React from "react";

export function LoadingSpinner({ size = 140, label = "Loading page...", className = "" }) {
  // Brand color variables defined inside SVG
  const brandRed = "#D32F2F";
  const darkGraphite = "#2B2B2B";
  const paperGray = "#E5E7EB";

  // Coordinates for the pencil offset-path (the exact route the pencil tip walks)
  const masterPath = `
    M 20 65 
    L 75 65 
    L 85 35 
    L 95 65 
    M 80 52 
    L 90 52 
    M 105 35 
    L 105 65 
    C 122 65 122 35 105 35 
    M 130 65 
    L 140 35 
    L 150 65 
    M 135 52 
    L 145 52 
    M 160 65 
    L 160 35 
    C 175 35 175 48 160 48 
    L 175 65 
    M 195 40 
    C 190 35 183 37 183 43 
    C 183 50 195 48 195 56 
    C 195 62 188 65 183 61 
    M 205 65 
    L 205 35 
    M 217 35 
    L 217 65 
    M 205 50 
    L 217 50 
    M 70 73 
    L 222 73 
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

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: (size * 150) / 300 }}
    >
      <style>{`
        /* Writing Canvas Paths Animations */
        .path-adarsh {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-adarsh-seq 6s infinite linear;
        }

        .path-underline {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-underline-seq 6s infinite linear;
        }

        .path-loading {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-loading-seq 6s infinite linear;
        }

        .path-dots {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-dots-seq 6s infinite linear;
        }

        /* 3D Pencil Translation and Rotation Animation */
        .pencil-group {
          offset-path: path("${masterPath}");
          -webkit-offset-path: path("${masterPath}");
          offset-rotate: 0deg;
          animation: pencil-write-seq 6s infinite linear;
          transform-origin: 0px 0px;
        }

        /* Timed Sequential Animations mapping to total 6 seconds duration */
        @keyframes draw-adarsh-seq {
          0%, 6.7% {
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          7.5% {
            opacity: 1;
          }
          36.7% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          83.3% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          90%, 100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes draw-underline-seq {
          0%, 40.0% {
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          40.8% {
            opacity: 1;
          }
          46.7% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          83.3% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          90%, 100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes draw-loading-seq {
          0%, 50.0% {
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          50.8% {
            opacity: 1;
          }
          76.7% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          83.3% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          90%, 100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes draw-dots-seq {
          0%, 76.7% {
            stroke-dashoffset: 1000;
            opacity: 0;
          }
          77.5% {
            opacity: 1;
          }
          83.3% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          84.0% {
            opacity: 0.3;
          }
          86.0% {
            opacity: 1;
          }
          88.0% {
            opacity: 0.3;
          }
          90.0% {
            opacity: 1;
          }
          95%, 100% {
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
          1% {
            opacity: 1;
          }
          6.7% {
            offset-distance: 6.7%;
            -webkit-offset-distance: 6.7%;
            transform: translate(0, 0) rotate(-32deg);
          }
          /* Typing ADARSH + slight handwriting wiggles */
          12% {
            transform: translate(0, 0) rotate(-28deg);
          }
          18% {
            transform: translate(0, 0) rotate(-34deg);
          }
          24% {
            transform: translate(0, 0) rotate(-28deg);
          }
          30% {
            transform: translate(0, 0) rotate(-34deg);
          }
          36.7% {
            offset-distance: 36.7%;
            -webkit-offset-distance: 36.7%;
            transform: translate(0, 0) rotate(-30deg);
            opacity: 1;
          }
          /* Lift & move to underline */
          38% {
            transform: translate(0, -6px) rotate(-20deg);
          }
          40.0% {
            offset-distance: 40.0%;
            -webkit-offset-distance: 40.0%;
            transform: translate(0, 0) rotate(-35deg);
          }
          /* Drawing underline */
          46.7% {
            offset-distance: 46.7%;
            -webkit-offset-distance: 46.7%;
            transform: translate(0, 0) rotate(-25deg);
            opacity: 1;
          }
          /* Lift & move to Loading */
          48.3% {
            transform: translate(0, -6px) rotate(-20deg);
          }
          50.0% {
            offset-distance: 50.0%;
            -webkit-offset-distance: 50.0%;
            transform: translate(0, 0) rotate(-32deg);
          }
          /* Typing Loading... */
          56% {
            transform: translate(0, 0) rotate(-28deg);
          }
          62% {
            transform: translate(0, 0) rotate(-34deg);
          }
          68% {
            transform: translate(0, 0) rotate(-28deg);
          }
          74% {
            transform: translate(0, 0) rotate(-34deg);
          }
          76.7% {
            offset-distance: 76.7%;
            -webkit-offset-distance: 76.7%;
            transform: translate(0, 0) rotate(-30deg);
          }
          /* Dotting dots */
          83.3% {
            offset-distance: 83.3%;
            -webkit-offset-distance: 83.3%;
            transform: translate(0, 0) rotate(-32deg);
            opacity: 1;
          }
          /* Lift naturally */
          90.0% {
            offset-distance: 90.0%;
            -webkit-offset-distance: 90.0%;
            transform: translate(0, -18px) rotate(-15deg);
            opacity: 0.8;
          }
          /* Fade & reset */
          95%, 100% {
            offset-distance: 100%;
            -webkit-offset-distance: 100%;
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
          .path-adarsh, .path-underline, .path-loading, .path-dots {
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
        <line x1="10" y1="67" x2="290" y2="67" stroke={paperGray} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="10" y1="112" x2="290" y2="112" stroke={paperGray} strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Notebook Red Margin Line */}
        <line x1="50" y1="10" x2="50" y2="140" stroke="#F87171" strokeWidth="0.75" opacity="0.3" />

        {/* Written Elements (with stroke width 3.5 for handwriting quality) */}
        {/* Brand Name "ADARSH" */}
        <path
          className="path-adarsh"
          stroke={darkGraphite}
          strokeWidth="3.5"
          d="
            M 75 65 L 85 35 L 95 65 
            M 80 52 L 90 52 
            M 105 35 L 105 65 
            C 122 65 122 35 105 35 
            M 130 65 L 140 35 L 150 65 
            M 135 52 L 145 52 
            M 160 65 L 160 35 
            C 175 35 175 48 160 48 
            L 175 65 
            M 195 40 
            C 190 35 183 37 183 43 
            C 183 50 195 48 195 56 
            C 195 62 188 65 183 61 
            M 205 65 L 205 35 
            M 217 35 L 217 65 
            M 205 50 L 217 50
          "
        />

        {/* Red Brand Underline */}
        <path
          className="path-underline"
          stroke={brandRed}
          strokeWidth="3.5"
          d="M 70 73 L 222 73"
        />

        {/* Loading text */}
        <path
          className="path-loading"
          stroke={darkGraphite}
          strokeWidth="3"
          d="
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
          "
        />

        {/* Animating Dots */}
        <path
          className="path-dots"
          stroke={darkGraphite}
          strokeWidth="3"
          d="
            M 196 110 L 196.1 110 
            M 202 110 L 202.1 110 
            M 208 110 L 208.1 110
          "
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
          <path d="M -3.5 -7 L 0 0 L 3.5 -7 Z" fill={darkGraphite} />
        </g>
      </svg>
    </div>
  );
}
