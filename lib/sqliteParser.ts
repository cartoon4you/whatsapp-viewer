import initSqlJs, { Database } from "sql.js";
import { ChatInfo, ChatMessage, MessageType, QuotedMessageInfo } from "./types";

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;
let sqlInstancePromise: Promise<SqlJsStatic> | null = null;

export async function getSqlInstance(): Promise<SqlJsStatic> {
  if (sqlInstancePromise) {
    return sqlInstancePromise;
  }

  sqlInstancePromise = (async () => {
    // 1. Try to fetch the binary directly and pass as wasmBinary
    // This avoids emscripten's internal fetch(..., { credentials: "same-origin" }) which can fail in cross-origin iframes or strict sandbox environments
    const wasmCandidateUrls = [
      "/sql-wasm.wasm",
      "/api/wasm",
      "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm",
      "https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/sql-wasm.wasm",
      "https://unpkg.com/sql.js@1.12.0/dist/sql-wasm.wasm",
    ];

    let wasmBinary: ArrayBuffer | null = null;
    for (const url of wasmCandidateUrls) {
      try {
        const fullUrl =
          typeof window !== "undefined" && url.startsWith("/")
            ? `${window.location.origin}${url}`
            : url;
        const res = await fetch(fullUrl, { cache: "force-cache" });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          // Check for WebAssembly magic number (\0asm: 0x00, 0x61, 0x73, 0x6d)
          if (buf.byteLength >= 4) {
            const bytes = new Uint8Array(buf.slice(0, 4));
            if (bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d) {
              wasmBinary = buf;
              break;
            }
          }
        }
      } catch {
        // Try next URL
      }
    }

    if (wasmBinary) {
      return await initSqlJs({ wasmBinary });
    }

    // 2. Fallback to locateFile using CDN if direct fetch couldn't find binary
    return await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
    });
  })();

  return sqlInstancePromise.catch((err) => {
    sqlInstancePromise = null;
    throw err;
  });
}

export async function parseSqliteDatabase(
  buffer: ArrayBuffer,
  fileName: string,
  contactsMap: Record<string, string> = {}
): Promise<{ chats: ChatInfo[]; messages: ChatMessage[]; contacts: Record<string, string> }> {
  // Initialize sql.js
  const SQL = await getSqlInstance();

  const db: Database = new SQL.Database(new Uint8Array(buffer));

  // Check existing tables
  const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const tables = new Set<string>();
  if (tablesRes.length > 0) {
    for (const row of tablesRes[0].values) {
      if (typeof row[0] === "string") {
        tables.add(row[0]);
      }
    }
  }

  const jidMap = new Map<string, { id: number; user: string; server: string; raw: string }>();
  if (tables.has("jid")) {
    try {
      const jidRes = db.exec("SELECT _id, user, server, raw_string FROM jid");
      if (jidRes.length > 0) {
        for (const row of jidRes[0].values) {
          const raw = String(row[3]);
          jidMap.set(raw, {
            id: Number(row[0]),
            user: String(row[1] || ""),
            server: String(row[2] || ""),
            raw,
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  // Thumbnails table
  const thumbnailMap = new Map<string, string>();
  if (tables.has("message_thumbnails")) {
    try {
      const thumbRes = db.exec("SELECT key_remote_jid, key_id, thumbnail FROM message_thumbnails");
      if (thumbRes.length > 0) {
        for (const row of thumbRes[0].values) {
          const key = `${row[0]}::${row[1]}`;
          if (row[2] && row[2] instanceof Uint8Array) {
            const base64 = uint8ToBase64(row[2]);
            thumbnailMap.set(key, `data:image/jpeg;base64,${base64}`);
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Quotes table
  const quotesMap = new Map<number, QuotedMessageInfo>();
  if (tables.has("messages_quotes")) {
    try {
      const quotesRes = db.exec(
        "SELECT _id, key_remote_jid, key_from_me, key_id, data, timestamp FROM messages_quotes"
      );
      if (quotesRes.length > 0) {
        for (const row of quotesRes[0].values) {
          quotesMap.set(Number(row[0]), {
            id: String(row[3]),
            fromMe: Number(row[2]) === 1,
            text: String(row[4] || ""),
            timestamp: Number(row[5] || 0),
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  const chatsMap = new Map<string, ChatInfo>();
  const messages: ChatMessage[] = [];

  const waTypeMap: Record<number, MessageType> = {
    0: "text",
    1: "image",
    2: "audio",
    3: "video",
    4: "contact",
    5: "location",
    8: "call",
    9: "file",
    13: "gif",
    16: "location",
  };

  // Case 1: classic `messages` table
  if (tables.has("messages")) {
    const tableInfo = db.exec("PRAGMA table_info(messages)");
    const cols = new Set<string>();
    if (tableInfo.length > 0) {
      for (const row of tableInfo[0].values) {
        cols.add(String(row[1]));
      }
    }

    const selectCols = [
      "_id",
      "key_remote_jid",
      cols.has("key_from_me") ? "key_from_me" : "0 as key_from_me",
      cols.has("key_id") ? "key_id" : "_id as key_id",
      cols.has("data") ? "data" : "'' as data",
      cols.has("timestamp") ? "timestamp" : "0 as timestamp",
      cols.has("media_wa_type") ? "media_wa_type" : "0 as media_wa_type",
      cols.has("media_size") ? "media_size" : "0 as media_size",
      cols.has("media_name") ? "media_name" : "'' as media_name",
      cols.has("media_caption") ? "media_caption" : "'' as media_caption",
      cols.has("media_duration") ? "media_duration" : "0 as media_duration",
      cols.has("media_mime_type") ? "media_mime_type" : "'' as media_mime_type",
      cols.has("latitude") ? "latitude" : "0.0 as latitude",
      cols.has("longitude") ? "longitude" : "0.0 as longitude",
      cols.has("remote_resource") ? "remote_resource" : "'' as remote_resource",
      cols.has("raw_data") ? "raw_data" : "NULL as raw_data",
      cols.has("thumb_image") ? "thumb_image" : "NULL as thumb_image",
      cols.has("quoted_row_id") ? "quoted_row_id" : "0 as quoted_row_id",
    ];

    const query = `SELECT ${selectCols.join(", ")} FROM messages ORDER BY timestamp ASC`;
    const msgRes = db.exec(query);

    if (msgRes.length > 0) {
      for (const row of msgRes[0].values) {
        const id = String(row[3] || row[0]);
        const chatId = String(row[1]);
        if (!chatId || chatId === "-1") continue;

        if (!chatsMap.has(chatId)) {
          const jidInfo = jidMap.get(chatId);
          const isGroup = chatId.endsWith("@g.us");
          const displayName = contactsMap[chatId] || jidInfo?.user || chatId.split("@")[0];

          chatsMap.set(chatId, {
            id: chatId,
            name: displayName,
            user: jidInfo?.user || chatId.split("@")[0],
            server: jidInfo?.server || chatId.split("@")[1] || "",
            isGroup,
            messageCount: 0,
            lastMessage: null,
          });
        }

        const chat = chatsMap.get(chatId)!;
        chat.messageCount++;

        const waTypeNum = Number(row[6]);
        let type: MessageType = waTypeMap[waTypeNum] || "text";

        let text = "";
        if (typeof row[4] === "string") {
          text = row[4];
        } else if (row[4] instanceof Uint8Array) {
          text = new TextDecoder("utf-8", { fatal: false }).decode(row[4]);
        } else if (row[4] != null) {
          text = String(row[4]);
        }

        let mediaCaption = "";
        if (typeof row[9] === "string") {
          mediaCaption = row[9];
        } else if (row[9] instanceof Uint8Array) {
          mediaCaption = new TextDecoder("utf-8", { fatal: false }).decode(row[9]);
        } else if (row[9] != null) {
          mediaCaption = String(row[9]);
        }

        if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
          type = "link";
        }

        let thumb: string | null = null;
        const thumbKey = `${chatId}::${id}`;
        if (thumbnailMap.has(thumbKey)) {
          thumb = thumbnailMap.get(thumbKey)!;
        } else if (row[15] instanceof Uint8Array && row[15].length > 2) {
          if (row[15][0] === 0xff && row[15][1] === 0xd8) {
            thumb = `data:image/jpeg;base64,${uint8ToBase64(row[15])}`;
          }
        } else if (row[16] instanceof Uint8Array && row[16].length > 2) {
          if (row[16][0] === 0xff && row[16][1] === 0xd8) {
            thumb = `data:image/jpeg;base64,${uint8ToBase64(row[16])}`;
          }
        }

        const quotedRowId = Number(row[17]);
        const quoted = quotedRowId && quotesMap.has(quotedRowId) ? quotesMap.get(quotedRowId)! : null;

        const msgObj: ChatMessage = {
          id,
          chatId,
          fromMe: Number(row[2]) === 1,
          timestamp: Number(row[5]),
          type,
          text,
          mediaCaption: mediaCaption || undefined,
          mediaName: row[8] ? String(row[8]) : undefined,
          mediaSize: row[7] ? Number(row[7]) : undefined,
          mediaDuration: row[10] ? Number(row[10]) : undefined,
          mediaMimeType: row[11] ? String(row[11]) : undefined,
          thumbnailBase64: thumb,
          latitude: row[12] ? Number(row[12]) : undefined,
          longitude: row[13] ? Number(row[13]) : undefined,
          remoteResource: row[14] ? String(row[14]) : undefined,
          quotedMessage: quoted,
        };

        messages.push(msgObj);
        chat.lastMessage = {
          text: msgObj.text || msgObj.mediaCaption || `[${msgObj.type}]`,
          timestamp: msgObj.timestamp,
          fromMe: msgObj.fromMe,
          type: msgObj.type,
        };
      }
    }
  }

  // Also include any chats that have 0 messages from `chat` table
  if (tables.has("chat") && tables.has("jid")) {
    try {
      const chatRes = db.exec(
        "SELECT chat._id, jid.raw_string, jid.user, jid.server FROM chat JOIN jid ON chat.jid_row_id = jid._id"
      );
      if (chatRes.length > 0) {
        for (const row of chatRes[0].values) {
          const raw = String(row[1]);
          if (!chatsMap.has(raw)) {
            const user = String(row[2] || raw.split("@")[0]);
            const server = String(row[3] || raw.split("@")[1] || "");
            chatsMap.set(raw, {
              id: raw,
              name: contactsMap[raw] || user,
              user,
              server,
              isGroup: raw.endsWith("@g.us"),
              messageCount: 0,
              lastMessage: null,
            });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Sort chats by message timestamp descending (most recent first)
  const chats = Array.from(chatsMap.values()).sort((a, b) => {
    const timeA = a.lastMessage?.timestamp || 0;
    const timeB = b.lastMessage?.timestamp || 0;
    return timeB - timeA;
  });

  return {
    chats,
    messages,
    contacts: contactsMap,
  };
}

export async function parseWaContactsDatabase(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const SQL = await getSqlInstance();

  const db: Database = new SQL.Database(new Uint8Array(buffer));
  const contacts: Record<string, string> = {};

  try {
    const res = db.exec("SELECT jid, display_name, wa_name, number FROM wa_contacts");
    if (res.length > 0) {
      for (const row of res[0].values) {
        const jid = String(row[0]);
        const name = String(row[1] || row[2] || row[3] || "");
        if (jid && name) {
          contacts[jid] = name;
        }
      }
    }
  } catch {
    // Ignore
  }

  return contacts;
}

function uint8ToBase64(u8: Uint8Array): string {
  let binary = "";
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}
