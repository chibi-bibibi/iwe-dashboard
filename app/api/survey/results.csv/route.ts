import { getSurveyResults } from "@/app/lib/data.survey-selections";

function csvValue(value: string | number | null) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export async function GET() {
  const results = await getSurveyResults();
  const header = [
    "順位",
    "演奏会回数",
    "部",
    "曲名",
    "編曲者",
    "投票数",
  ];

  const rows = results.map((result, index) => [
    index + 1,
    result.concert_count,
    result.part,
    result.title,
    result.arranger,
    result.votes,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => csvValue(value)).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="survey-results.csv"',
    },
  });
}