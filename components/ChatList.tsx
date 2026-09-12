"use client";

import React, { useState, useEffect } from "react";
import { ChatInfo } from "../lib/types";
import {
  Users,
  User,
  Search,
  Image as ImageIcon,
  Mic,
  Video,
  MapPin,
  FileText,
  Link as LinkIcon,
  Phone,
  Smile,
} from "lucide-react";

interface ChatListProps {
  chats: ChatInfo[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
}: ChatListProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredChats = chats.filter((chat) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.id.toLowerCase().includes(q) ||
      chat.user.toLowerCase().includes(q) ||
      (chat.lastMessage?.text && chat.lastMessage.text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Search Input for Chats */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="chat-filter-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter chats by name or number..."
            className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-7 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chat List Count Header */}
      <div className="px-3 py-1.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>Conversations ({filteredChats.length})</span>
        {filterQuery && (
          <span className="text-emerald-600 font-normal">Filtered</span>
        )}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No chats found matching &ldquo;{filterQuery}&rdquo;
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            const initials = getInitials(chat.name);
            const avatarBg = getAvatarColor(chat.name);

            return (
              <button
                key={chat.id}
                id={`chat-item-${chat.id}`}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50/80 hover:bg-emerald-50"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Contact / Group Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm ${avatarBg}`}
                >
                  {chat.isGroup ? (
                    <Users className="w-5 h-5 text-white/90" />
                  ) : initials ? (
                    <span>{initials}</span>
                  ) : (
                    <User className="w-5 h-5 text-white/90" />
                  )}
                </div>

                {/* Chat details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-emerald-950" : "text-slate-900"
                      }`}
                      title={chat.name}
                    >
                      {chat.name}
                    </h3>
                    {chat.lastMessage?.timestamp ? (
                      <span
                        className="text-[10px] text-slate-400 flex-shrink-0"
                        suppressHydrationWarning
                      >
                        {formatShortTime(chat.lastMessage.timestamp, isMounted)}
                      </span>
                    ) : null}
                  </div>

                  {/* Last Message preview */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      {renderLastMessageIcon(chat.lastMessage?.type)}
                      <span>
                        {chat.lastMessage
                          ? chat.lastMessage.text || `[${chat.lastMessage.type}]`
                          : "No messages"}
                      </span>
                    </p>

                    {/* Total messages badge */}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium flex-shrink-0 ${
                        isSelected
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {chat.messageCount}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/[\s_-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-emerald-600",
    "bg-teal-600",
    "bg-sky-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-amber-600",
    "bg-rose-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatShortTime(timestamp: number, isClient: boolean): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);

  // During SSR or before client mount, render a deterministic string to prevent hydration mismatch
  if (!isClient) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const diffDays = Math.round(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 7 && diffDays >= 0) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function renderLastMessageIcon(type?: string) {
  if (!type || type === "text") return null;
  switch (type) {
    case "image":
    case "gif":
      return <ImageIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    case "audio":
      return <Mic className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    case "video":
      return <Video className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    case "location":
      return <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    case "file":
      return <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    case "link":
      return <LinkIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    case "call":
      return <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    default:
      return null;
  }
}
