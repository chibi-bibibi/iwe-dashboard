"use server";

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
});

async function createSurveySelection(programIds: string[]): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (programIds.length === 0) {
      return {
        success: false,
        message: "登録するデータがありません。",
      };
    }

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
    console.error(error);

    return {
      success: false,
      message: "登録に失敗しました。",
    };
  }
}

export async function submitSurvey(programIds: string[]) {
  return createSurveySelection(programIds);
}
