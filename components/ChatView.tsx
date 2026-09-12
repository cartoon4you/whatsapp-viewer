"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatInfo, ChatMessage } from "../lib/types";
import { renderFormattedText } from "../lib/smileyParser";
import { exportChatToHtml, exportChatToJson, exportChatToTxt, downloadFile } from "../lib/exporter";
import {
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  User,
  Check,
  CheckCheck,
  ExternalLink,
  MapPin,
  Play,
  Pause,
  Volume2,
  Image as ImageIcon,
  Video,
  FileIcon,
  Maximize2,
} from "lucide-react";

interface ChatViewProps {
  chat: ChatInfo;
  messages: ChatMessage[];
  onPreviewMedia: (src: string, title?: string) => void;
}

export default function ChatView({ chat, messages, onPreviewMedia }: ChatViewProps) {
  const [chatSearch, setChatSearch] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter messages by search query if set
  const displayedMessages = chatSearch
    ? messages.filter((m) => {
        const q = chatSearch.toLowerCase();
        return (
          (m.text && m.text.toLowerCase().includes(q)) ||
          (m.mediaCaption && m.mediaCaption.toLowerCase().includes(q)) ||
          (m.mediaName && m.mediaName.toLowerCase().includes(q))
        );
      })
    : messages;

  const handleExportHtml = () => {
    const html = exportChatToHtml(chat, messages);
    const safeName = chat.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadFile(html, `whatsapp_chat_${safeName}.html`, "text/html");
    setExportMenuOpen(false);
  };

  const handleExportJson = () => {
    const json = exportChatToJson(chat, messages);
    const safeName = chat.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadFile(json, `whatsapp_chat_${safeName}.json`, "application/json");
    setExportMenuOpen(false);
  };

  const handleExportTxt = () => {
    const txt = exportChatToTxt(chat, messages);
    const safeName = chat.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadFile(txt, `whatsapp_chat_${safeName}.txt`, "text/plain");
    setExportMenuOpen(false);
  };

  // Group messages by day
  const groupedByDate: { key: string; dateLabel: string; items: ChatMessage[] }[] = [];
  let currentKey = "";
  let currentLabel = "";
  let currentGroup: ChatMessage[] = [];

  for (const msg of displayedMessages) {
    const key = getDateKey(msg.timestamp);
    const dateStr = formatDateGroup(msg.timestamp, isMounted);
    if (key !== currentKey) {
      if (currentGroup.length > 0) {
        groupedByDate.push({ key: currentKey, dateLabel: currentLabel, items: currentGroup });
      }
      currentKey = key;
      currentLabel = dateStr;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  }
  if (currentGroup.length > 0) {
    groupedByDate.push({ key: currentKey, dateLabel: currentLabel, items: currentGroup });
  }

  return (
    <div className="flex flex-col h-full bg-[#EFEAE2] relative">
      {/* WhatsApp Background Subtle Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `radial-gradient(#128c7e 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Chat Conversation Top Header */}
      <div className="relative z-10 bg-slate-100/95 backdrop-blur border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
        {/* Contact Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
            {chat.isGroup ? (
              <Users className="w-5 h-5 text-white/90" />
            ) : (
              <span>{chat.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 truncate" title={chat.name}>
              {chat.name}
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              {chat.isGroup ? "Group Chat" : chat.id} &bull; {messages.length} messages
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          {showSearchInput ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search in chat..."
                className="w-44 text-xs bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
                autoFocus
              />
              <button
                onClick={() => {
                  setChatSearch("");
                  setShowSearchInput(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              id="search-in-chat-button"
              onClick={() => setShowSearchInput(true)}
              title="Search messages in this conversation"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              id="export-chat-button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 divide-y divide-slate-100">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Export Chat As
                  </div>
                  <button
                    id="export-html-option"
                    onClick={handleExportHtml}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors"
                  >
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">HTML Page (.html)</div>
                      <div className="text-[10px] text-slate-400">Standalone styled viewer</div>
                    </div>
                  </button>
                  <button
                    id="export-json-option"
                    onClick={handleExportJson}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">JSON Data (.json)</div>
                      <div className="text-[10px] text-slate-400">Structured data export</div>
                    </div>
                  </button>
                  <button
                    id="export-txt-option"
                    onClick={handleExportTxt}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="font-medium">Plain Text (.txt)</div>
                      <div className="text-[10px] text-slate-400">Simple transcript</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message Timeline Area */}
      <div className="relative z-0 flex-1 overflow-y-auto p-4 space-y-4">
        {displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            {chatSearch ? (
              <p>No messages match &ldquo;{chatSearch}&rdquo;</p>
            ) : (
              <p>No messages in this chat</p>
            )}
          </div>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.key} className="space-y-2">
              {/* Day Header Badge */}
              <div className="flex justify-center my-2">
                <span
                  className="bg-white/90 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-md shadow-xs border border-slate-200/60"
                  suppressHydrationWarning
                >
                  {group.dateLabel}
                </span>
              </div>

              {/* Messages in this day */}
              {group.items.map((msg) => {
                const isOut = msg.fromMe;
                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`flex flex-col ${isOut ? "items-end" : "items-start"} mb-1.5`}
                  >
                    <div
                      className={`relative max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 shadow-xs text-xs leading-relaxed break-words ${
                        isOut
                          ? "bg-[#D9FDD3] text-slate-900 rounded-tr-none"
                          : "bg-white text-slate-900 rounded-tl-none border border-slate-200/40"
                      }`}
                    >
                      {/* Group Sender Name */}
                      {chat.isGroup && !isOut && (
                        <div className="text-[11px] font-bold text-emerald-700 mb-1">
                          {msg.remoteResourceDisplayName ||
                            msg.remoteResource?.split("@")[0] ||
                            "Participant"}
                        </div>
                      )}

                      {/* Quoted Message Preview */}
                      {msg.quotedMessage && (
                        <div className="mb-2 p-2 bg-black/5 rounded border-l-3 border-emerald-600 text-[11px] text-slate-700">
                          <div className="font-semibold text-emerald-800 flex items-center justify-between">
                            <span>{msg.quotedMessage.sender || "Reply to message"}</span>
                          </div>
                          <div className="text-slate-600 truncate mt-0.5">
                            {msg.quotedMessage.text || "[Media attachment]"}
                          </div>
                        </div>
                      )}

                      {/* Media: Image or GIF */}
                      {(msg.type === "image" || msg.type === "gif") && (
                        <div className="mb-2">
                          {msg.thumbnailBase64 ? (
                            <div className="relative group cursor-pointer overflow-hidden rounded-md max-w-sm">
                              <img
                                src={msg.thumbnailBase64}
                                alt="Message thumbnail"
                                className="w-full h-auto max-h-60 object-cover rounded-md transition-transform group-hover:scale-[1.02]"
                                onClick={() =>
                                  onPreviewMedia(
                                    msg.thumbnailBase64!,
                                    msg.mediaCaption || "WhatsApp Image"
                                  )
                                }
                              />
                              <button
                                onClick={() =>
                                  onPreviewMedia(
                                    msg.thumbnailBase64!,
                                    msg.mediaCaption || "WhatsApp Image"
                                  )
                                }
                                className="absolute right-2 bottom-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-xs opacity-80 group-hover:opacity-100 transition-opacity"
                                title="Expand image"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-black/5 rounded-md text-slate-600">
                              <ImageIcon className="w-5 h-5 text-emerald-600" />
                              <span className="font-medium">
                                {msg.type === "gif" ? "GIF Animation" : "Photo"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Media: Audio Voice Note */}
                      {msg.type === "audio" && (
                        <div className="mb-2 flex items-center gap-3 p-2 bg-black/5 rounded-md min-w-[220px]">
                          <button
                            onClick={() =>
                              setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                            }
                            className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="h-1.5 bg-slate-300 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-emerald-600 transition-all ${
                                  playingAudioId === msg.id ? "w-2/3 animate-pulse" : "w-1/4"
                                }`}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-emerald-600" />
                                Voice Note
                              </span>
                              <span>
                                {msg.mediaDuration
                                  ? `${msg.mediaDuration}s`
                                  : "0:12"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Media: Video */}
                      {msg.type === "video" && (
                        <div className="mb-2">
                          {msg.thumbnailBase64 ? (
                            <div
                              className="relative cursor-pointer group rounded-md overflow-hidden max-w-sm"
                              onClick={() =>
                                onPreviewMedia(
                                  msg.thumbnailBase64!,
                                  msg.mediaCaption || "WhatsApp Video"
                                )
                              }
                            >
                              <img
                                src={msg.thumbnailBase64}
                                alt="Video thumbnail"
                                className="w-full h-auto max-h-60 object-cover rounded-md"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/90 text-emerald-800 flex items-center justify-center shadow-md">
                                  <Play className="w-5 h-5 fill-emerald-800 ml-0.5" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-black/5 rounded-md text-slate-600">
                              <Video className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">Video File</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Media: Location */}
                      {msg.type === "location" && (
                        <div className="mb-2 p-2.5 bg-black/5 rounded-md">
                          {msg.thumbnailBase64 && (
                            <img
                              src={msg.thumbnailBase64}
                              alt="Location map"
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-slate-800">
                                Shared Location
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Lat: {msg.latitude?.toFixed(4)}, Lng:{" "}
                                {msg.longitude?.toFixed(4)}
                              </div>
                              <a
                                href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-medium text-[11px] mt-1"
                              >
                                <span>Open in Maps</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Link Preview / URL */}
                      {msg.type === "link" && (
                        <div className="mb-1">
                          {msg.thumbnailBase64 && (
                            <img
                              src={msg.thumbnailBase64}
                              alt="Link preview"
                              className="w-full max-h-36 object-cover rounded mb-1.5"
                            />
                          )}
                          <a
                            href={msg.text}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium flex items-center gap-1 break-all"
                          >
                            <span>{msg.text}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Regular text or caption */}
                      {msg.type !== "link" && (
                        <div>
                          {renderFormattedText(msg.text || msg.mediaCaption || "")}
                        </div>
                      )}

                      {/* Timestamp & Status Footer */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 select-none">
                        <span suppressHydrationWarning>{formatTimeOnly(msg.timestamp, isMounted)}</span>
                        {isOut && (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-500 stroke-[2.5]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDateGroup(timestamp: number, isClient: boolean): string {
  const date = new Date(timestamp);
  if (!isClient) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeOnly(timestamp: number, isClient: boolean): string {
  const date = new Date(timestamp);
  if (!isClient) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
