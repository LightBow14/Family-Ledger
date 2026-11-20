import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const rows = await sql`SELECT id, name FROM categories ORDER BY name`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  try {
    const [created] = await sql`
      INSERT INTO categories (name) VALUES (${name}) RETURNING id, name
    `;
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json(
      { error: "Category already exists" },
      { status: 400 }
    );
  }
}
