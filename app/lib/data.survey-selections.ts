"use server";

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
});

export async function submitSurvey(programIds: string[]): Promise<{
  success: boolean;
  message: string;
}> {
  if (programIds.length === 0) {
    return {
      success: false,
      message: "登録するデータがありません。",
    };
  }

  try {
    const now = new Date().toISOString();

    await sql`
      INSERT INTO iwe.survey_selections (
        program_id,
        created_at,
        updated_at
      )
      VALUES ${sql(programIds.map((programId) => [programId, now, now]))}
    `;

    return {
      success: true,
      message: "登録に成功しました。",
    };
  } catch (error) {
    console.error("survey_selections INSERT error:", error);

    return {
      success: false,
      message: "登録に失敗しました。",
    };
  }
}
