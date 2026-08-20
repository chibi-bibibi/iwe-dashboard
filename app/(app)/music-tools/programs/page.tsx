import PageHeader from "@/app/ui/page-header";
import Link from "next/link";
import { getAllPrograms } from "../../../lib/data.regular_concert_program";
import { formatToJapaneseEra } from "../../../lib/formatToJapaneseEra";
import { JSX } from "react";

export default async function ProgramsPage() {
  const programs = await getAllPrograms();

  return (
    <main>
      <PageHeader title="演奏会プログラム一覧" />
      <div className="rounded-lg border border-border bg-card p-6">
        {programs.length === 0 ? (
          <p className="text-muted-foreground">データがありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-6">
              {(() => {
                const groups = new Map<string, typeof programs>();
                for (const p of programs) {
                  const id = p.regular_concert_id ?? "unknown";
                  if (!groups.has(id)) groups.set(id, [] as any);
                  groups.get(id)!.push(p);
                }

                const concertNodes: JSX.Element[] = [];
                for (const [id, progs] of groups) {
                  const first = progs[0];
                  const displayDate = formatToJapaneseEra(first.concert_date);
                  concertNodes.push(
                    <div key={`concert-${id}`}>
                      <div className="p-3 font-semibold bg-muted/30 rounded-md">
                        第{first.concert_count ?? "?"}回　{displayDate}
                      </div>
                      <table className="w-full table-auto">
                        <thead>
                          <tr>
                            <th className="text-left p-3 w-36 font-semibold text-sm">
                              部
                            </th>
                            <th className="text-left p-3 font-semibold text-sm">
                              曲名
                            </th>
                            <th className="text-left p-3 font-semibold text-sm">
                              編曲者
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rows: JSX.Element[] = [];
                            let prevPart: string | null = null;
                            for (const p of progs) {
                              const partLabel =
                                p.part === "1"
                                  ? "第1部"
                                  : p.part === "2"
                                    ? "第2部"
                                    : p.part === "3"
                                      ? "第3部"
                                      : p.part;
                              rows.push(
                                <tr
                                  key={p.id}
                                  className="border-t hover:bg-muted"
                                >
                                  <td className="p-2 align-top w-36">
                                    {p.part !== prevPart ? partLabel : <span />}
                                  </td>
                                  <td className="p-2 align-top">
                                    {p.title ?? ""}
                                  </td>
                                  <td className="p-2 align-top">
                                    {p.arranger ?? ""}
                                  </td>
                                </tr>,
                              );
                              prevPart = p.part ?? null;
                            }
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>,
                  );
                }
                return concertNodes;
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
