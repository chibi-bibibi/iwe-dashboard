import postgres from "postgres";

let sql: any | null = null;
function getSqlClient() {
  if (sql) return sql;
  if (typeof window !== "undefined") {
    // Prevent postgres client initialization in the browser
    throw new Error("Postgres client must not be initialized in the browser");
  }
  const url = process.env.POSTGRES_URL || "";
  sql = postgres(url, { ssl: "require" });
  return sql;
}

export type RegularConcertProgram = {
  id: string;
  part: string;
  order: number;
  title?: string | null;
  arranger?: string | null;
  reference_sound_source?: string | null;
  memo?: string | null;
  regular_concert_id: string;
};

export async function getProgramsByConcertId(
  concertId: string,
): Promise<RegularConcertProgram[]> {
  if (!concertId) return [];
  const id = String(concertId);
  try {
    const client = getSqlClient();
    const rows = await client<RegularConcertProgram[]>`
      SELECT id::text as id, part, "order", title, arranger, " reference_sound_source" as reference_sound_source, memo, regular_concert_id::text
      FROM iwe.regular_concert_program
      WHERE regular_concert_id = ${id}
      ORDER BY
        CASE
          WHEN part = '1' THEN 0
          WHEN part = '2' THEN 1
          WHEN part = '3' THEN 2
          WHEN part = 'アンコール' THEN 9
          ELSE 4
        END,
        "order" ASC
    `;
    return rows;
  } catch (e) {
    console.error("getProgramsByConcertId error:", e);
    return [];
  }
}

export type RegularConcertProgramWithConcert = RegularConcertProgram & {
  concert_count?: number | null;
  concert_date?: string | null;
};

export async function getAllPrograms(): Promise<
  RegularConcertProgramWithConcert[]
> {
  try {
    const client = getSqlClient();
    const rows = await client<RegularConcertProgramWithConcert[]>`
      SELECT p.id::text as id, p.part, p."order", p.title, p.arranger, p." reference_sound_source" as reference_sound_source, p.memo, p.regular_concert_id::text as regular_concert_id,
        rc.count as concert_count, rc.date as concert_date
      FROM iwe.regular_concert_program p
      LEFT JOIN iwe.regular_concert rc ON p.regular_concert_id = rc.id
      ORDER BY
        rc.count ASC NULLS LAST,
        CASE
          WHEN p.part = '1' THEN 0
          WHEN p.part = '2' THEN 1
          WHEN p.part = '3' THEN 2
          WHEN p.part = 'アンコール' THEN 9
          ELSE 4
        END,
        p."order" ASC
    `;
    return rows;
  } catch (e) {
    console.error("getAllPrograms error:", e);
    return [];
  }
}
