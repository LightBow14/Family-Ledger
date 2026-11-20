import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // "YYYY-MM"

  const rows = month
    ? await sql`
        SELECT e.id, e.amount, e.note, e.expense_date, e.created_at,
               u.id as user_id, u.name as user_name,
               c.id as category_id, c.name as category_name
        FROM expenses e
        JOIN users u ON e.user_id = u.id
        JOIN categories c ON e.category_id = c.id
        WHERE to_char(e.expense_date, 'YYYY-MM') = ${month}
        ORDER BY e.expense_date DESC, e.created_at DESC
      `
    : await sql`
        SELECT e.id, e.amount, e.note, e.expense_date, e.created_at,
               u.id as user_id, u.name as user_name,
               c.id as category_id, c.name as category_name
        FROM expenses e
        JOIN users u ON e.user_id = u.id
        JOIN categories c ON e.category_id = c.id
        ORDER BY e.expense_date DESC, e.created_at DESC
      `;

  return NextResponse.json(
    rows.map((r) => ({ ...r, amount: Number(r.amount) }))
  );
}

export async function POST(request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
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

  const expenseDate = date || new Date().toISOString().slice(0, 10);

  const [created] = await sql`
    INSERT INTO expenses (user_id, category_id, amount, note, expense_date)
    VALUES (${userId}, ${category_id}, ${numericAmount}, ${note || ""}, ${expenseDate})
    RETURNING id
  `;

  return NextResponse.json({ id: created.id }, { status: 201 });
}
