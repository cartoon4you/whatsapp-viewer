import React from "react";

// Convert codepoint to filename format (e.g. 0xE001 -> "0E001", 0x1F603 -> "1F603", 0x2705 -> "02705")
function getSmileyFileName(codePoint: number): string {
  let hex = codePoint.toString(16).toUpperCase();
  if (hex.length === 4) {
    hex = "0" + hex;
  }
  return hex;
}

// Set of known smiley hex filenames (e.g. "0E001", "1F603", etc.)
const KNOWN_SMILEYS = new Set<string>();

// PUA range for older WhatsApp emoticons is \uE001 - \uE537
export function isWhatsAppEmoticon(codePoint: number): boolean {
  return (codePoint >= 0xe001 && codePoint <= 0xe537) || (codePoint >= 0x2000 && codePoint <= 0x2bff);
}

export function renderFormattedText(text: unknown): React.ReactNode {
  if (!text) return null;
  const str = typeof text === "string" ? text : String(text);
  if (!str) return null;

  // Split string into characters / code points
  const elements: React.ReactNode[] = [];
  const chars = Array.from(str);

  let currentText = "";
  let keyIndex = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const cp = char.codePointAt(0);

    if (cp && isWhatsAppEmoticon(cp)) {
      if (currentText) {
        elements.push(<span key={keyIndex++}>{currentText}</span>);
        currentText = "";
      }
      const hex = getSmileyFileName(cp);
      elements.push(
        <img
          key={keyIndex++}
          src={`/smileys/${hex}.PNG`}
          alt={char}
          className="inline-block w-5 h-5 align-text-bottom mx-0.5"
          onError={(e) => {
            // fallback to character itself if image missing
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      );
    } else {
      currentText += char;
    }
  }

  if (currentText) {
    elements.push(<span key={keyIndex++}>{currentText}</span>);
  }

  return elements;
}
