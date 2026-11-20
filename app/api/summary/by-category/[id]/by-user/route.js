import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  const rows = month
    ? await sql`
        SELECT u.id as user_id, u.name as user_name, SUM(e.amount) as total
        FROM expenses e
        JOIN users u ON e.user_id = u.id
        WHERE e.category_id = ${id}
          AND to_char(e.expense_date, 'YYYY-MM') = ${month}
        GROUP BY u.id
        ORDER BY total DESC
      `
    : await sql`
        SELECT u.id as user_id, u.name as user_name, SUM(e.amount) as total
        FROM expenses e
        JOIN users u ON e.user_id = u.id
        WHERE e.category_id = ${id}
        GROUP BY u.id
        ORDER BY total DESC
      `;

  return NextResponse.json(
    rows.map((r) => ({ ...r, total: Number(r.total) }))
  );
}
