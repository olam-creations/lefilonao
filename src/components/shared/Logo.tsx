'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ collapsed = false, className = '', size = 'md' }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sizes = {
    sm: { icon: 'w-9 h-9', text: 'text-base' },
    md: { icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { icon: 'w-16 h-14', text: 'text-4xl' }
  };

  const current = sizes[size];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className={`relative flex-shrink-0 ${current.icon}`}>
        {/* Glow Background */}
        <motion.div
          className="absolute inset-0 bg-indigo-600/20 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Faceted Crystalline Nugget */}
        <motion.div 
          className="relative w-full h-full z-10"
          whileHover={{ scale: 1.1, rotate: -5 }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-xl">
            <defs>
              <linearGradient id="crystal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="45%" stopColor="#F59E0B" />
                <stop offset="55%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>
              
              <linearGradient id="neon-vein" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>

              <filter id="hyper-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Main faceted shape */}
            <motion.path
              d="M30,30 L50,15 L75,30 L85,55 L65,85 L35,80 L15,55 Z"
              fill="url(#crystal-gold)"
              animate={{ 
                d: [
                  "M30,30 L50,15 L75,30 L85,55 L65,85 L35,80 L15,55 Z",
                  "M32,28 L52,18 L73,32 L82,58 L62,88 L32,82 L18,52 Z",
                  "M30,30 L50,15 L75,30 L85,55 L65,85 L35,80 L15,55 Z"
                ]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Facets */}
            <path d="M50,15 L50,45 L75,30 M50,45 L85,55 M50,45 L65,85 M50,45 L35,80 M50,45 L15,55 M50,45 L30,30" 
                  stroke="white" strokeWidth="0.5" opacity="0.3" fill="none" />
            
            {/* Neon AI Veins */}
            <motion.path
              d="M45,25 L55,45 L70,40 M35,65 L50,60 L65,75"
              stroke="url(#neon-vein)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#hyper-glow)"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Particles */}
            {mounted && [...Array(3)].map((_, i) => (
              <motion.circle
                key={i}
                r="1.2"
                fill="white"
                animate={{ 
                  y: [-10, -40],
                  x: [0, (i - 1) * 15],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2 + i, 
                  repeat: Infinity, 
                  delay: i * 0.8,
                  ease: "easeOut" 
                }}
                cx="50"
                cy="50"
              />
            ))}
          </svg>
        </motion.div>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-baseline tracking-tighter">
            <span className={`${current.text} font-[1000] text-slate-900 uppercase`}>
              LE FILON
            </span>
            <span className={`${current.text} font-[1000] text-indigo-600 ml-2 italic`}>
              AO
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
