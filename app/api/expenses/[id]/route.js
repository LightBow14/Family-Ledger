import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

async function loadExpenseOwner(id) {
  const [row] = await sql`SELECT user_id FROM expenses WHERE id = ${id}`;
  return row?.user_id ?? null;
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const ownerId = await loadExpenseOwner(id);
  if (ownerId === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ownerId !== userId) {
    // Enforced server-side, not just hidden in the UI: only the person who
    // logged an expense can edit it, no matter what the client sends.
    return NextResponse.json(
      { error: "You can only edit your own entries" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { category_id, amount, note, date } = body;

  if (!category_id || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: "category_id and amount are required" },
      { status: 400 }
    );
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number" },
      { status: 400 }
    );
  }

  await sql`
    UPDATE expenses
    SET category_id = ${category_id},
        amount = ${numericAmount},
        note = ${note || ""},
        expense_date = ${date || new Date().toISOString().slice(0, 10)}
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const ownerId = await loadExpenseOwner(id);
  if (ownerId === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ownerId !== userId) {
    return NextResponse.json(
      { error: "You can only delete your own entries" },
      { status: 403 }
    );
  }

  await sql`DELETE FROM expenses WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
