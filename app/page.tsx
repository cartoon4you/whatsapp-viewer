"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import ChatList from "../components/ChatList";
import ChatView from "../components/ChatView";
import MediaModal from "../components/MediaModal";
import StatsModal from "../components/StatsModal";
import { ChatInfo, ChatMessage } from "../lib/types";
import { parseSqliteDatabase, parseWaContactsDatabase, getSqlInstance } from "../lib/sqliteParser";
import sampleDataRaw from "./data/sampleData.json";
import { MessageSquare, UploadCloud, AlertCircle } from "lucide-react";

export default function HomePage() {
  const [sourceName, setSourceName] = useState<string>("Sample msgstore.db (Test Backup)");
  const [chats, setChats] = useState<ChatInfo[]>(sampleDataRaw.chats as ChatInfo[]);
  const [messages, setMessages] = useState<ChatMessage[]>(sampleDataRaw.messages as ChatMessage[]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    sampleDataRaw.chats[0]?.id || null
  );

  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [previewMedia, setPreviewMedia] = useState<{ src: string; title?: string } | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Pre-load sql.js wasm engine in background on page load
  useEffect(() => {
    getSqlInstance().catch((e) => {
      console.warn("Background preload of SQL engine encountered an issue:", e);
    });
  }, []);

  // Handler for uploading msgstore.db
  const handleOpenDb = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const buffer = await file.arrayBuffer();
        const result = await parseSqliteDatabase(buffer, file.name, contacts);

        if (result.chats.length === 0) {
          throw new Error(
            "No WhatsApp chats found in this database. Please ensure this is a valid msgstore.db SQLite backup."
          );
        }

        setSourceName(file.name);
        setChats(result.chats);
        setMessages(result.messages);
        if (result.chats.length > 0) {
          setSelectedChatId(result.chats[0].id);
        }
      } catch (err: unknown) {
        console.error("Error reading database:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to parse database. If your file is encrypted (e.g., .crypt12 or .crypt14), it must be decrypted first."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [contacts]
  );

  // Handler for uploading wa.db
  const handleOpenWaDb = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const buffer = await file.arrayBuffer();
        const newContacts = await parseWaContactsDatabase(buffer);
        const mergedContacts = { ...contacts, ...newContacts };
        setContacts(mergedContacts);

        // Update existing chats with new contact names
        setChats((prev) =>
          prev.map((chat) => ({
            ...chat,
            name: mergedContacts[chat.id] || chat.name,
          }))
        );
      } catch (err: unknown) {
        console.error("Error reading wa.db:", err);
        setErrorMessage("Failed to parse wa.db contacts file.");
      } finally {
        setIsProcessing(false);
      }
    },
    [contacts]
  );

  // Reset to built-in sample data
  const handleLoadSample = () => {
    setSourceName("Sample msgstore.db (Test Backup)");
    setChats(sampleDataRaw.chats as ChatInfo[]);
    setMessages(sampleDataRaw.messages as ChatMessage[]);
    setContacts({});
    setSelectedChatId(sampleDataRaw.chats[0]?.id || null);
    setErrorMessage(null);
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.toLowerCase().includes("wa.db")) {
        handleOpenWaDb(file);
      } else {
        handleOpenDb(file);
      }
    }
  };

  // Selected chat & filtered messages
  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;
  const currentChatMessages = selectedChat
    ? messages.filter((m) => m.chatId === selectedChat.id)
    : [];

  // Global search filtering
  const displayedChats = globalSearchQuery
    ? chats.filter((c) => {
        const q = globalSearchQuery.toLowerCase();
        const matchesChat =
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.user.toLowerCase().includes(q);
        const matchesMsg = messages.some(
          (m) =>
            m.chatId === c.id &&
            ((m.text && m.text.toLowerCase().includes(q)) ||
              (m.mediaCaption && m.mediaCaption.toLowerCase().includes(q)))
        );
        return matchesChat || matchesMsg;
      })
    : chats;

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Header */}
      <Header
        sourceName={sourceName}
        totalChats={chats.length}
        totalMessages={messages.length}
        onOpenDb={handleOpenDb}
        onOpenWaDb={handleOpenWaDb}
        onLoadSample={handleLoadSample}
        onOpenStats={() => setIsStatsOpen(true)}
        globalSearchQuery={globalSearchQuery}
        onGlobalSearchChange={setGlobalSearchQuery}
        isProcessing={isProcessing}
      />

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Layout: Sidebar + Chat View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Conversations list */}
        <div className="w-80 sm:w-96 flex-shrink-0 h-full">
          <ChatList
            chats={displayedChats}
            selectedChatId={selectedChatId}
            onSelectChat={(id) => setSelectedChatId(id)}
          />
        </div>

        {/* Right Main Panel: Conversation Messages View */}
        <div className="flex-1 h-full min-w-0 bg-slate-50">
          {selectedChat ? (
            <ChatView
              chat={selectedChat}
              messages={currentChatMessages}
              onPreviewMedia={(src, title) => setPreviewMedia({ src, title })}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                No Conversation Selected
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a conversation from the sidebar to inspect messages, media, and export options.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Drag and Drop Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 pointer-events-none">
          <div className="w-20 h-20 rounded-2xl bg-emerald-700/80 flex items-center justify-center mb-4 border-2 border-dashed border-white/60 animate-bounce">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-lg font-bold">Drop msgstore.db or wa.db here</h2>
          <p className="text-xs text-emerald-200 mt-1">
            Release your SQLite database file to instantly view your WhatsApp messages
          </p>
        </div>
      )}

      {/* Media Fullscreen Preview Modal */}
      {previewMedia && (
        <MediaModal
          mediaSrc={previewMedia.src}
          title={previewMedia.title}
          onClose={() => setPreviewMedia(null)}
        />
      )}

      {/* Database Statistics Modal */}
      {isStatsOpen && (
        <StatsModal
          sourceName={sourceName}
          chats={chats}
          messages={messages}
          onClose={() => setIsStatsOpen(false)}
        />
      )}
    </div>
  );
}
