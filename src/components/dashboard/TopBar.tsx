'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  backHref?: string;
  rightSlot?: React.ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  userInitials?: string;
}

export default function TopBar({ title, description, icon, backHref, rightSlot, search, onSearchChange, userInitials }: TopBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          )}
          {icon && (
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 hidden xs:block">
              {icon}
            </div>
          )}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate"
          >
            {title}
          </motion.h1>
        </div>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1 line-clamp-1"
          >
            {description}
          </motion.p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 sm:flex-none hidden xs:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm w-full sm:w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        )}

        {rightSlot}

        <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors relative flex-shrink-0">
          <Bell className="w-4 h-4 sm:w-5 h-5 text-slate-600" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-md flex-shrink-0">
          {userInitials ?? 'U'}
        </div>
      </div>
    </div>
  );
}