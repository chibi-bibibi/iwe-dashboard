import PageHeader from "../../../ui/page-header";
import { getAllPrograms } from "../../../lib/data.regular_concert_program";
import SurveyForm from "./SurveyForm";

export default async function SurveyPage() {
  const programs = await getAllPrograms();

  const bucketsMap = new Map<number, any[]>();

  for (const p of programs) {
    const c = p.concert_count ?? 0;
    const idx = Math.max(0, Math.floor(((c || 0) - 1) / 10));

    if (!bucketsMap.has(idx)) {
      bucketsMap.set(idx, []);
    }

    bucketsMap.get(idx)!.push({
      id: p.id,
      regular_concert_id: p.regular_concert_id,
      concert_count: p.concert_count,
      concert_date: p.concert_date,
      part: p.part,
      title: p.title,
      arranger: p.arranger,
      memo: p.memo,
    });
  }

  const buckets = Array.from(bucketsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idx, progs]) => {
      const start = idx * 10 + 1;
      const end = (idx + 1) * 10 !== 40 ? (idx + 1) * 10 : 39;

      return {
        bucketIndex: idx,
        label: `第${start}回〜第${end}回`,
        programs: progs,
      };
    });

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="shrink-0">
        <PageHeader title="第40回定期演奏会向けアンケート" />
      </div>

      {/* アンケート */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <SurveyForm buckets={buckets} />
      </div>
    </main>
  );
}
