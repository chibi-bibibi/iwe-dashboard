import postgres from "postgres";

let sql: any | null = null;
function getSqlClient() {
  if (sql) return sql;
  if (typeof window !== "undefined") {
    throw new Error("Postgres client must not be initialized in the browser");
  }
  const url = process.env.POSTGRES_URL || "";
  sql = postgres(url, { ssl: "require" });
  return sql;
}

export type RegularConcert = {
  id: string;
  date?: string | null;
  count?: number | null;
  hall?: string | null;
  memo?: string | null;
};

export async function getRegularConcerts(
  limit = 100,
): Promise<RegularConcert[]> {
  try {
    const client = getSqlClient();
    const rows = await client<RegularConcert[]>`
      SELECT id::text as id, date, count, hall, memo
      FROM iwe.regular_concert
      ORDER BY count ASC NULLS LAST
      LIMIT ${limit}
    `;
    return rows;
  } catch (e) {
    console.error("getRegularConcerts error:", e);
    return [];
  }
}

export async function getRegularConcertById(
  id: string,
): Promise<RegularConcert | null> {
  try {
    const client = getSqlClient();
    const rows = await client<RegularConcert[]>`
      SELECT id::text as id, date, count, hall, memo
      FROM iwe.regular_concert
      WHERE id = ${String(id)}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (e) {
    console.error("getRegularConcertById error:", e);
    return null;
  }
}
