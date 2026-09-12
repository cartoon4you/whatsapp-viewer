export interface ChatInfo {
  id: string; // e.g. "MessageFromToday@s.whatsapp.net" or "4917612345000-1234567890@g.us"
  name: string; // display name (either from wa.db, jid user, or raw)
  user: string;
  server: string;
  isGroup: boolean;
  messageCount: number;
  lastMessage?: {
    text: string;
    timestamp: number;
    fromMe: boolean;
    type: string;
  } | null;
}

export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "contact"
  | "location"
  | "call"
  | "file"
  | "gif"
  | "link";

export interface QuotedMessageInfo {
  id: string;
  timestamp?: number;
  text?: string;
  fromMe?: boolean;
  sender?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  fromMe: boolean;
  timestamp: number;
  type: MessageType;
  text?: string;
  mediaCaption?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaDuration?: number;
  mediaMimeType?: string;
  thumbnailBase64?: string | null; // data:image/jpeg;base64,...
  latitude?: number;
  longitude?: number;
  remoteResource?: string;
  remoteResourceDisplayName?: string;
  quotedMessage?: QuotedMessageInfo | null;
}

export interface WhatsAppDatabase {
  sourceName: string;
  chats: ChatInfo[];
  messages: ChatMessage[];
  contacts: Record<string, string>; // jid -> display_name
}
