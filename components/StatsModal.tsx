"use client";

import React from "react";
import { ChatInfo, ChatMessage } from "../lib/types";
import {
  X,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Video,
  MapPin,
  Link as LinkIcon,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface StatsModalProps {
  sourceName: string;
  chats: ChatInfo[];
  messages: ChatMessage[];
  onClose: () => void;
}

export default function StatsModal({
  sourceName,
  chats,
  messages,
  onClose,
}: StatsModalProps) {
  const outgoingCount = messages.filter((m) => m.fromMe).length;
  const incomingCount = messages.filter((m) => !m.fromMe).length;

  const typeCounts: Record<string, number> = {
    text: 0,
    image: 0,
    audio: 0,
    video: 0,
    location: 0,
    link: 0,
    contact: 0,
    gif: 0,
    file: 0,
  };

  let earliestTime = Infinity;
  let latestTime = -Infinity;

  for (const msg of messages) {
    typeCounts[msg.type] = (typeCounts[msg.type] || 0) + 1;
    if (msg.timestamp) {
      if (msg.timestamp < earliestTime) earliestTime = msg.timestamp;
      if (msg.timestamp > latestTime) latestTime = msg.timestamp;
    }
  }

  // Top active chat
  const topChat = [...chats].sort((a, b) => b.messageCount - a.messageCount)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Database Statistics</h2>
            <p className="text-[11px] text-emerald-200">{sourceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-slate-700">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[11px] text-slate-500 mb-1">Conversations</div>
              <div className="text-lg font-bold text-slate-900">{chats.length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[11px] text-slate-500 mb-1">Total Messages</div>
              <div className="text-lg font-bold text-emerald-700">{messages.length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-[11px] text-slate-500 mb-1">Top Active</div>
              <div className="text-xs font-semibold text-slate-900 truncate" title={topChat?.name}>
                {topChat?.name || "N/A"}
              </div>
            </div>
          </div>

          {/* Direction Breakdown */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-800 mb-2">Message Flow</div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Sent (Outgoing):</span>
                <span className="font-bold text-slate-900">{outgoingCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                <span>Received (Incoming):</span>
                <span className="font-bold text-slate-900">{incomingCount}</span>
              </div>
            </div>
          </div>

          {/* Media Types Grid */}
          <div>
            <div className="font-semibold text-slate-800 mb-2">Media & Message Types</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Text
                </span>
                <span className="font-semibold">{typeCounts.text || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Images
                </span>
                <span className="font-semibold">{typeCounts.image || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Mic className="w-3.5 h-3.5 text-purple-600" /> Voice / Audio
                </span>
                <span className="font-semibold">{typeCounts.audio || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Video className="w-3.5 h-3.5 text-blue-600" /> Videos
                </span>
                <span className="font-semibold">{typeCounts.video || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" /> Locations
                </span>
                <span className="font-semibold">{typeCounts.location || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <LinkIcon className="w-3.5 h-3.5 text-sky-600" /> Links
                </span>
                <span className="font-semibold">{typeCounts.link || 0}</span>
              </div>
            </div>
          </div>

          {/* Date Range */}
          {earliestTime !== Infinity && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date Span:
              </span>
              <span suppressHydrationWarning>
                {new Date(earliestTime).toLocaleDateString()} —{" "}
                {new Date(latestTime).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100/80 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
