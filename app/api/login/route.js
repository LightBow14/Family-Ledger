import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const password = body.password || "";

  if (!name || !password) {
    return NextResponse.json(
      { error: "Name and password are required" },
      { status: 400 }
    );
  }

  const existing = await sql`
    SELECT * FROM users WHERE name ILIKE ${name} LIMIT 1
  `;

  let user;

  if (existing.length === 0) {
    // First time this name has been used -> create the account.
    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await sql`
      INSERT INTO users (name, password_hash)
      VALUES (${name}, ${passwordHash})
      RETURNING id, name
    `;
    user = created;
  } else {
    const found = existing[0];
    if (!found.password_hash) {
      // Account exists but has no password yet -> set it now.
      const passwordHash = await bcrypt.hash(password, 10);
      await sql`
        UPDATE users SET password_hash = ${passwordHash} WHERE id = ${found.id}
      `;
      user = { id: found.id, name: found.name };
    } else {
      const ok = await bcrypt.compare(password, found.password_hash);
      if (!ok) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
      user = { id: found.id, name: found.name };
    }
  }

  const token = await createSessionToken(user.id);
  const response = NextResponse.json(user);
  setSessionCookie(response, token);
  return response;
}
