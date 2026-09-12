import { ChatInfo, ChatMessage } from "./types";

export function exportChatToHtml(chat: ChatInfo, messages: ChatMessage[]): string {
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  // Group messages by day
  let currentDay = "";
  let messagesHtml = "";

  for (const msg of sorted) {
    const date = new Date(msg.timestamp);
    const dayStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (dayStr !== currentDay) {
      currentDay = dayStr;
      messagesHtml += `
      <div class="day">
        <span>${escapeHtml(dayStr)}</span>
      </div>`;
    }

    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isOut = msg.fromMe;
    const sender = isOut ? "You" : msg.remoteResourceDisplayName || msg.remoteResource || chat.name;

    let contentHtml = "";

    // Quoted message
    if (msg.quotedMessage) {
      contentHtml += `
        <div class="quote">
          <div style="font-weight: bold; font-size: 8.5pt;">Quote: ${escapeHtml(msg.quotedMessage.sender || "Message")}</div>
          <div style="color: #555; font-size: 9pt;">${escapeHtml(msg.quotedMessage.text || "")}</div>
        </div>`;
    }

    // Thumbnail / Image
    if (msg.thumbnailBase64) {
      contentHtml += `
        <div style="margin-bottom: 6px;">
          <img src="${msg.thumbnailBase64}" alt="Media thumbnail" style="max-width: 280px; max-height: 280px; border-radius: 4px; display: block;" />
        </div>`;
    }

    // Text & captions
    if (msg.type === "link") {
      contentHtml += `
        <div><a href="${escapeHtml(msg.text || "")}" target="_blank" rel="noopener noreferrer" style="color: #0366d6; text-decoration: underline; word-break: break-all;">${escapeHtml(msg.text || "")}</a></div>
        ${msg.mediaCaption ? `<div style="margin-top: 4px; font-size: 9pt; color: #555;">${escapeHtml(msg.mediaCaption)}</div>` : ""}`;
    } else if (msg.type === "location") {
      contentHtml += `
        <div><strong>📍 Location</strong>: ${msg.latitude}, ${msg.longitude}</div>
        <div><a href="https://maps.google.com/?q=${msg.latitude},${msg.longitude}" target="_blank" rel="noopener noreferrer" style="color: #0366d6; text-decoration: underline;">Open in Google Maps</a></div>`;
    } else if (msg.type === "audio") {
      contentHtml += `
        <div>🎵 Voice Note / Audio [${msg.mediaDuration ? msg.mediaDuration + "s" : "Audio"}]</div>`;
    } else if (msg.type === "video") {
      contentHtml += `
        <div>🎬 Video ${msg.mediaName ? `(${escapeHtml(msg.mediaName)})` : ""}</div>
        ${msg.mediaCaption ? `<div style="margin-top: 4px;">${escapeHtml(msg.mediaCaption)}</div>` : ""}`;
    } else if (msg.type === "contact") {
      contentHtml += `
        <div>👤 Contact Card</div>`;
    } else {
      contentHtml += `<div>${escapeHtml(msg.text || msg.mediaCaption || "")}</div>`;
    }

    messagesHtml += `
      <div class="message ${isOut ? "outgoing_message" : "incoming_message"}">
        ${chat.isGroup && !isOut ? `<div style="font-size: 8pt; color: #128c7e; font-weight: bold; margin-bottom: 2px;">${escapeHtml(sender)}</div>` : ""}
        <div class="text">
          ${contentHtml}
        </div>
        <div class="footer">
          <span>${escapeHtml(timeStr)}</span>
          ${isOut ? ` <span style="color: #4fc3f7;">✓✓</span>` : ""}
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>WhatsApp Chat - ${escapeHtml(chat.name)}</title>
  <style type="text/css">
    body {
      background-color: #E5DDD5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    .chat {
      max-width: 720px;
      margin: 0 auto;
      background-color: #ECE5DD;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      border-radius: 8px;
      overflow: hidden;
    }
    .chat_header {
      background-color: #075E54;
      color: #FFFFFF;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .heading {
      font-size: 18px;
      font-weight: 600;
    }
    .subheading {
      font-size: 12px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .messages_container {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .day {
      text-align: center;
      margin: 16px 0 8px 0;
    }
    .day > span {
      background-color: rgba(225, 245, 254, 0.92);
      color: #556066;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 6px;
      box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
    }
    .message {
      max-width: 75%;
      padding: 6px 9px 8px 9px;
      border-radius: 7.5px;
      box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
      position: relative;
      word-wrap: break-word;
      font-size: 13.5px;
      line-height: 1.35;
    }
    .incoming_message {
      background-color: #FFFFFF;
      align-self: flex-start;
      border-top-left-radius: 0;
    }
    .outgoing_message {
      background-color: #DCF8C6;
      align-self: flex-end;
      border-top-right-radius: 0;
    }
    .quote {
      background-color: rgba(0, 0, 0, 0.05);
      border-left: 3px solid #128c7e;
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .footer {
      font-size: 10px;
      color: rgba(0,0,0,0.45);
      text-align: right;
      margin-top: 4px;
      display: flex;
      justify-content: flex-end;
      gap: 3px;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="chat">
    <div class="chat_header">
      <div>
        <div class="heading">${escapeHtml(chat.name)}</div>
        <div class="subheading">${escapeHtml(chat.id)} &bull; ${messages.length} messages</div>
      </div>
      <div style="font-size: 11px; opacity: 0.8;">Exported via WhatsApp Viewer</div>
    </div>
    <div class="messages_container">
      ${messagesHtml}
    </div>
  </div>
</body>
</html>`;
}

export function exportChatToJson(chat: ChatInfo, messages: ChatMessage[]): string {
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  const jsonExport = {
    chat: {
      key: chat.id,
      name: chat.name,
      user: chat.user,
      server: chat.server,
      isGroup: chat.isGroup,
      messageCount: sorted.length,
    },
    messages: sorted.map((m) => ({
      id: m.id,
      timestamp: new Date(m.timestamp).toISOString(),
      timestampEpoch: m.timestamp,
      fromMe: m.fromMe,
      type: m.type,
      text: m.text || null,
      caption: m.mediaCaption || null,
      filename: m.mediaName || null,
      filesize: m.mediaSize || null,
      duration: m.mediaDuration || null,
      location: m.latitude && m.longitude ? { latitude: m.latitude, longitude: m.longitude } : null,
      hasImageThumbnail: Boolean(m.thumbnailBase64),
      remoteResource: m.remoteResource || null,
      quotedMessage: m.quotedMessage || null,
    })),
  };

  return JSON.stringify(jsonExport, null, 2);
}

export function exportChatToTxt(chat: ChatInfo, messages: ChatMessage[]): string {
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  let output = `======================================================\n`;
  output += `WhatsApp Chat: ${chat.name} (${chat.id})\n`;
  output += `Total Messages: ${sorted.length}\n`;
  output += `Exported: ${new Date().toLocaleString()}\n`;
  output += `======================================================\n\n`;

  for (const m of sorted) {
    const d = new Date(m.timestamp);
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const sender = m.fromMe ? "You" : m.remoteResourceDisplayName || m.remoteResource || chat.name;

    let body = m.text || "";
    if (m.type !== "text") {
      body = `[${m.type.toUpperCase()}] ${m.mediaCaption || m.mediaName || body}`;
    }
    if (m.quotedMessage) {
      body = `[Replying to: "${m.quotedMessage.text}"] ${body}`;
    }

    output += `[${dateStr}, ${timeStr}] ${sender}: ${body}\n`;
  }

  return output;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
