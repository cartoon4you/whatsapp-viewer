import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  try {
    let wasmPath = path.join(process.cwd(), "public", "sql-wasm.wasm");
    if (!fs.existsSync(wasmPath)) {
      wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
    }
    const buffer = fs.readFileSync(wasmPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/wasm",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to read sql-wasm.wasm in /api/wasm:", error);
    return new NextResponse("Failed to load WASM", { status: 500 });
  }
}
