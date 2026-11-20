import postgres from "postgres";

const globalForSql = globalThis;

const sql =
  globalForSql.__family_ledger_sql ||
  postgres(process.env.DATABASE_URL, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForSql.__family_ledger_sql = sql;
}

export default sql;
