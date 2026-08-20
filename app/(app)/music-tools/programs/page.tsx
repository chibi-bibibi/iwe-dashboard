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
                    <table className="w-full table-auto text-sm sm:text-[0.95rem]">
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
                                <td className="w-24 p-2 align-top sm:w-32 sm:p-3">
                                  {p.part !== prevPart ? partLabel : <span />}
                                </td>
                                <td className="p-2 align-top sm:p-3">
                                  <div className="space-y-1">
                                    <div className="text-base font-medium leading-snug sm:text-[1.05rem]">
                                      <span className="wrap-break-word">
                                        {p.title ?? ""}
                                      </span>
                                    </div>
                                    {p.arranger ? (
                                      <div className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
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
                  </div>,
                );
              }
              return concertNodes;
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
