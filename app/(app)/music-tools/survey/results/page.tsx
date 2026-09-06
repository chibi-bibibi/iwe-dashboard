import PageHeader from "../../../../ui/page-header";
import { getSurveyResults } from "../../../../lib/data.survey-selections";
import SurveyResultsList from "./SurveyResultsList";

export default async function SurveyResultsPage() {
  const results = await getSurveyResults();

  return (
    <main className="min-h-dvh w-full">
      <PageHeader title="アンケート結果" />

      <section className="mt-6 space-y-6 px-2">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <SurveyResultsList results={results} />
        </div>
      </section>
    </main>
  );
}
