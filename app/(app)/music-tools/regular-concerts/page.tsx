import PageHeader from "@/app/ui/page-header";
import { getRegularConcerts } from "../../../lib/data.regular_concert";
import Link from "next/link";

import { formatToJapaneseEra } from "../../../lib/formatToJapaneseEra";

export default async function RegularConcertsPage() {
  const concerts = await getRegularConcerts(200);

  return (
    <main>
      <PageHeader title="定期演奏会" />
      <div className="rounded-lg border border-border bg-card p-6">
        {concerts.length === 0 ? (
          <p className="text-muted-foreground">データがありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="text-left p-2">回</th>
                  <th className="text-left p-2">日付</th>
                  <th className="text-left p-2">会場</th>
                </tr>
              </thead>
              <tbody>
                {concerts.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted">
                    <td className="p-2 align-top">
                      <Link
                        href={`/music-tools/regular-concerts/${c.id}`}
                        className="block"
                      >
                        {c.count}
                      </Link>
                    </td>
                    <td className="p-2 align-top">
                      <Link
                        href={`/music-tools/regular-concerts/${c.id}`}
                        className="block"
                      >
                        {formatToJapaneseEra(c.date)}
                      </Link>
                    </td>
                    <td className="p-2 align-top">
                      <Link
                        href={`/music-tools/regular-concerts/${c.id}`}
                        className="block"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug sm:text-[0.95rem]">
                            <span className="wrap-break-word">
                              {c.hall ?? "(無題)"}
                            </span>
                          </div>

                          {c.memo ? (
                            <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                              <span className="wrap-break-word">{c.memo}</span>
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
