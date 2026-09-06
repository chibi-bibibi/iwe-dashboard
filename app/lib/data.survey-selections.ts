"use server";

import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
});

async function createSurveyResponse(
  programIds: string[],
  freeText: string,
): Promise<{
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

    const result = await sql.begin(async (tx) => {
      /*
       * 1. 回答本体を作成
       */
      const [response] = await tx`
        INSERT INTO iwe.survey_responses (
          free_text,
          created_at,
          updated_at
        )
        VALUES (
          ${freeText.trim() || null},
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      /*
       * 2. 選択された曲を登録
       */
      await tx`
        INSERT INTO iwe.survey_selections (
          response_id,
          program_id,
          created_at,
          updated_at
        )
        VALUES ${tx(
          programIds.map((programId) => [
            response.id,
            programId,
            new Date(),
            new Date(),
          ]),
        )}
      `;

      return response;
    });

    console.log("survey response created:", result.id);

    return {
      success: true,
      message: "登録に成功しました。",
    };
  } catch (error) {
    console.error("survey registration error:", error);

    return {
      success: false,
      message: "登録に失敗しました。",
    };
  }
}

export async function submitSurvey(programIds: string[], freeText: string) {
  return createSurveyResponse(programIds, freeText);
}

export type SurveyResult = {
  program_id: string;
  concert_count: number | null;
  part: string | null;
  title: string | null;
  arranger: string | null;
  votes: number;
};

export async function getSurveyResults(): Promise<SurveyResult[]> {
  try {
    const results = await sql<SurveyResult[]>`
      SELECT
        p.id::text AS program_id,
        rc.count AS concert_count,
        p.part,
        p.title,
        p.arranger,
        COUNT(DISTINCT s.response_id)::int AS votes
      FROM iwe.survey_selections s
      INNER JOIN iwe.regular_concert_program p ON p.id = s.program_id
      LEFT JOIN iwe.regular_concert rc ON rc.id = p.regular_concert_id
      GROUP BY p.id, p."order", rc.count, p.part, p.title, p.arranger
      ORDER BY votes DESC, rc.count ASC NULLS LAST, p."order" ASC
    `;

    return results;
  } catch (error) {
    console.error("getSurveyResults error:", error);
    return [];
  }
}
