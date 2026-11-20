import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const [user] = await sql`SELECT id, name FROM users WHERE id = ${userId}`;
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json(user);
}
