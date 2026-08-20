import PageHeader from "../../../../ui/page-header";
import { getProgramsByConcertId } from "../../../../lib/data.regular_concert_program";
import { getRegularConcerts } from "../../../../lib/data.regular_concert";
import { formatToJapaneseEra } from "../../../../lib/formatToJapaneseEra";
import { JSX } from "react";
export default async function RegularConcertDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = (await params) as { id: string };
  const concerts = await getRegularConcerts(500);
  const concert = concerts.find((c) => c.id === id);
  const programs = await getProgramsByConcertId(id);

  if (!concert) {
    return (
      <main>
        <PageHeader parent="Music" title="Not found" />
        <p>該当する演奏会が見つかりません。</p>
      </main>
    );
  }

  return (
    <main>
      <PageHeader title={`第${concert.count ?? "?"}回定期演奏会`} />
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mt-6 mb-2">プログラム</h3>
        {programs.length === 0 ? (
          <p className="text-muted-foreground">プログラムがありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="text-left p-3 w-1/4 font-semibold text-sm">
                    部
                  </th>
                  <th className="text-left p-3 w-1/2 font-semibold text-sm">
                    曲名
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows: JSX.Element[] = [];
                  let prevPart: string | null = null;
                  for (const p of programs) {
                    const partLabel =
                      p.part === "1"
                        ? "第1部"
                        : p.part === "2"
                          ? "第2部"
                          : p.part === "3"
                            ? "第3部"
                            : p.part;
                    rows.push(
                      <tr key={p.id} className="border-t hover:bg-muted">
                        <td className="p-2 align-top w-1/4">
                          {p.part !== prevPart ? partLabel : <span />}
                        </td>
                        <td className="p-2 align-top w-1/2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium leading-snug sm:text-[0.95rem]">
                              <span className="wrap-break-word">
                                {p.title ?? "(無題)"}
                              </span>
                            </div>

                            {p.arranger ? (
                              <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                                <span className="wrap-break-word">
                                  {p.arranger}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>,
                    );
                    prevPart = p.part ?? null;
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
