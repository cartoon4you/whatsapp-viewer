"use client";

import React, { useRef } from "react";
import {
  FolderOpen,
  UserCheck,
  RotateCcw,
  BarChart2,
  Search,
  MessageSquare,
  ShieldCheck,
  FileCode2,
} from "lucide-react";

interface HeaderProps {
  sourceName: string;
  totalChats: number;
  totalMessages: number;
  onOpenDb: (file: File) => void;
  onOpenWaDb: (file: File) => void;
  onLoadSample: () => void;
  onOpenStats: () => void;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
  isProcessing: boolean;
}

export default function Header({
  sourceName,
  totalChats,
  totalMessages,
  onOpenDb,
  onOpenWaDb,
  onLoadSample,
  onOpenStats,
  globalSearchQuery,
  onGlobalSearchChange,
  isProcessing,
}: HeaderProps) {
  const dbInputRef = useRef<HTMLInputElement>(null);
  const waDbInputRef = useRef<HTMLInputElement>(null);

  const handleDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenDb(file);
      e.target.value = "";
    }
  };

  const handleWaDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenWaDb(file);
      e.target.value = "";
    }
  };

  return (
    <header className="bg-emerald-800 text-white border-b border-emerald-900 shadow-sm flex-shrink-0">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-inner text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                WhatsApp Viewer
              </h1>
              <span className="text-[11px] font-medium bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600/60">
                Web Edition
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 flex items-center gap-1.5">
              <span>{sourceName}</span>
              <span>&bull;</span>
              <span>{totalChats} chats ({totalMessages} messages)</span>
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={globalSearchQuery}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Search across all messages & chats..."
              className="w-full bg-emerald-900/60 text-white placeholder-emerald-300/60 text-xs rounded-lg pl-9 pr-3 py-1.5 border border-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-emerald-900/90 transition-all"
            />
            {globalSearchQuery && (
              <button
                id="clear-global-search"
                onClick={() => onGlobalSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden inputs */}
          <input
            type="file"
            ref={dbInputRef}
            onChange={handleDbChange}
            accept=".db,.sqlite,.sqlite3,.crypt12,.crypt14"
            className="hidden"
          />
          <input
            type="file"
            ref={waDbInputRef}
            onChange={handleWaDbChange}
            accept=".db,.sqlite,.sqlite3"
            className="hidden"
          />

          {/* Open msgstore.db button */}
          <button
            id="open-db-button"
            onClick={() => dbInputRef.current?.click()}
            disabled={isProcessing}
            title="Open a WhatsApp msgstore.db SQLite backup file"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg shadow-sm border border-emerald-500/60 transition-colors disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Database</span>
          </button>

          {/* Import wa.db button */}
          <button
            id="open-wadb-button"
            onClick={() => waDbInputRef.current?.click()}
            disabled={isProcessing}
            title="Optionally import wa.db to resolve contact names"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-700/70 hover:bg-emerald-600 text-emerald-100 hover:text-white rounded-lg border border-emerald-600/50 transition-colors disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import wa.db</span>
          </button>

          {/* Load Sample button */}
          <button
            id="load-sample-button"
            onClick={onLoadSample}
            disabled={isProcessing}
            title="Reset to pre-loaded sample database with all message types"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-700/50 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg border border-emerald-600/40 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sample Data</span>
          </button>

          {/* Statistics button */}
          <button
            id="view-stats-button"
            onClick={onOpenStats}
            title="Database statistics & media breakdown"
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/60 rounded-lg transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
