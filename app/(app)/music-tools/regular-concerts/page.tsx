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
                  <th className="text-left p-2">日付</th>
                  <th className="text-left p-2">回数</th>
                  <th className="text-left p-2">会場</th>
                  <th className="text-left p-2">備考</th>
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
                        {formatToJapaneseEra(c.date)}
                      </Link>
                    </td>
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
                        {c.hall}
                      </Link>
                    </td>
                    <td className="p-2 align-top">
                      <Link
                        href={`/music-tools/regular-concerts/${c.id}`}
                        className="block"
                      >
                        {c.memo ?? ""}
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
