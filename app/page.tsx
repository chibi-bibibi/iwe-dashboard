import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">IWE ダッシュボード</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          管理画面の簡易ホームページです。以下から移動してください。
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/music-tools/regular-concerts"
            className="rounded-md px-4 py-2 border"
          >
            定期演奏会
          </Link>
          <Link
            href="/music-tools/programs"
            className="rounded-md px-4 py-2 border"
          >
            演奏会プログラム一覧
          </Link>

          <Link
            href="/music-tools/survey"
            className="rounded-md px-4 py-2 border"
          >
            アンケート
          </Link>
        </div>
      </div>
    </main>
  );
}
