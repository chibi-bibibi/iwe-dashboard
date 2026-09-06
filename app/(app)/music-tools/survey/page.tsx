import PageHeader from "../../../ui/page-header";

export default function SurveyPage() {
  return (
    <main className="min-h-dvh w-full">
      <div className="w-full">
        <PageHeader title="第40回定期演奏会向けアンケート" />
      </div>

      <section className="flex min-h-[60vh] items-center justify-center px-5 text-center">
        <p className="text-lg font-semibold leading-8">
          アンケート期間は終了しました。
          <br />
          ご協力ありがとうございました。
        </p>
      </section>
    </main>
  );
}
