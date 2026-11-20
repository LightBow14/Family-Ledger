import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  const rows = month
    ? await sql`
        SELECT c.id as category_id, c.name as category_name,
               COALESCE(SUM(e.amount), 0) as total
        FROM categories c
        LEFT JOIN expenses e
          ON e.category_id = c.id AND to_char(e.expense_date, 'YYYY-MM') = ${month}
        GROUP BY c.id
        HAVING COALESCE(SUM(e.amount), 0) > 0
        ORDER BY total DESC
      `
    : await sql`
        SELECT c.id as category_id, c.name as category_name,
               COALESCE(SUM(e.amount), 0) as total
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
        GROUP BY c.id
        HAVING COALESCE(SUM(e.amount), 0) > 0
        ORDER BY total DESC
      `;

  return NextResponse.json(
    rows.map((r) => ({ ...r, total: Number(r.total) }))
  );
}
