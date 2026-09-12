import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp Viewer",
  description: "Web viewer and exporter for WhatsApp msgstore.db database backups and chats",
  openGraph: {
    title: "WhatsApp Viewer",
    description: "Web viewer and exporter for WhatsApp msgstore.db database backups and chats",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-slate-100 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
