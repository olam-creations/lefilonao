'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ collapsed = false, className = '', size = 'md' }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sizes = {
    sm: { icon: 'w-10 h-10', text: 'text-base' },
    md: { icon: 'w-14 h-14', text: 'text-2xl' },
    lg: { icon: 'w-20 h-20', text: 'text-4xl' }
  };

  const current = sizes[size];
  const LOGO_COLOR = "#c29400"; // Couleur exacte du SVG source

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative flex-shrink-0 ${current.icon}`}>
        <motion.div 
          className="w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {/* SVG Source: unnamed.svg centré dans un carré pour l'UI */}
          <svg viewBox="270 40 480 480" className="w-full h-full">
            <g fill={LOGO_COLOR}>
              {/* Corps de l'aiguille + Partie basse du cercle */}
              <path 
                fillRule="evenodd"
                d="M 717.49 66.62 L 510.61 495.42 A 1.72 1.71 12.4 0 1 509.10 496.38 Q 439.00 497.87 383.46 456.82 C 350.77 432.66 325.37 398.24 312.75 359.24 Q 296.90 310.28 304.80 258.87 Q 305.06 257.17 307.05 256.25 C 396.03 215.25 568.78 134.30 716.92 66.04 A 0.43 0.43 0.0 0 1 717.49 66.62 Z M 365.30 276.58 A 0.18 0.17 11.8 0 1 365.53 276.43 L 473.34 309.80 A 0.83 0.82 3.6 0 1 473.91 310.44 L 497.74 437.22 A 0.34 0.33 -3.2 0 1 497.38 437.62 C 451.68 432.75 411.44 406.53 387.23 367.78 C 370.57 341.12 362.01 308.24 365.30 276.58 Z" 
              />
              
              {/* Partie supérieure gauche du cercle */}
              <path d="M 308.53 243.39 A 0.38 0.38 0.0 0 1 308.00 242.95 Q 318.45 200.78 343.97 165.97 Q 382.43 113.53 442.50 91.93 C 495.55 72.86 555.05 77.35 604.20 104.93 A 0.47 0.46 45.4 0 1 604.20 105.75 Q 602.68 106.56 601.09 107.30 Q 544.23 133.71 544.21 133.72 C 542.52 134.45 538.62 133.02 536.49 132.64 Q 485.01 123.63 441.00 146.53 C 413.57 160.81 391.37 183.35 376.46 210.46 Q 375.50 212.21 373.28 213.25 Q 350.31 224.05 308.53 243.39 Z" />
              
              {/* Partie inférieure droite du cercle */}
              <path d="M 523.51 495.53 A 0.46 0.46 0.0 0 1 523.04 494.87 L 550.99 436.95 A 3.83 3.80 -86.3 0 1 553.21 434.99 C 589.71 422.72 621.00 397.64 640.10 364.58 Q 657.24 334.93 660.11 300.54 Q 662.90 267.11 650.62 234.06 A 4.28 4.26 47.7 0 1 650.77 230.73 L 675.17 180.17 A 0.52 0.52 0.0 0 1 676.09 180.13 C 698.92 219.19 710.38 264.70 705.89 309.44 C 696.19 406.12 621.22 485.38 523.51 495.53 Z" />
            </g>
          </svg>
        </motion.div>
      </div>

      {!collapsed && (
        <div className="flex flex-col ml-1">
          <span className={`${current.text} font-black text-slate-900 tracking-tighter uppercase leading-none`}>
            LE FILON
          </span>
        </div>
      )}
    </div>
  );
}
