import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    ok: true,
    database: hasDatabase ? "configured" : "demo",
    apiFootball: process.env.API_FOOTBALL_KEY ? "configured" : "missing"
  });
}
