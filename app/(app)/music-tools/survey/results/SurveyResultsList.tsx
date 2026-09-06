"use client";

import { useMemo, useState } from "react";
import type { SurveyResult } from "../../../../lib/data.survey-selections";

type RangeFilter = "all" | "1-10" | "11-20" | "21-30" | "31-39";
type PartFilter = "all" | "1" | "2" | "3" | "アンコール";

const rangeFilters: { value: RangeFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "1-10", label: "1〜10回" },
  { value: "11-20", label: "11〜20回" },
  { value: "21-30", label: "21〜30回" },
  { value: "31-39", label: "31〜39回" },
];

const partFilters: { value: PartFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "1", label: "第1部" },
  { value: "2", label: "第2部" },
  { value: "3", label: "第3部" },
  { value: "アンコール", label: "アンコール" },
];

function partLabel(part: SurveyResult["part"]) {
  if (part === "1") return "第1部";
  if (part === "2") return "第2部";
  if (part === "3") return "第3部";
  return part ?? "部不明";
}

function isInRange(count: number | null, range: RangeFilter) {
  if (range === "all") return true;
  if (count === null) return false;

  const [start, end] = range.split("-").map(Number);
  return count >= start && count <= end;
}

export default function SurveyResultsList({
  results,
}: {
  results: SurveyResult[];
}) {
  const [range, setRange] = useState<RangeFilter>("all");
  const [part, setPart] = useState<PartFilter>("all");

  const filteredResults = useMemo(
    () =>
      results.filter(
        (result) =>
          isInRange(result.concert_count, range) &&
          (part === "all" || result.part === part),
      ),
    [part, range, results],
  );

  return (
    <>
      <div className="space-y-4 border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">曲別投票数</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              投票数の多い順に表示しています。
            </p>
          </div>
          <a
            href="/api/survey/results.csv"
            download="survey-results.csv"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            CSVダウンロード
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          CSVダウンロードはフィルターの状態にかかわらず、常に全件をダウンロードします。
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground">
              演奏会回数
            </span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as RangeFilter)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {rangeFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground">
              部
            </span>
            <select
              value={part}
              onChange={(event) => setPart(event.target.value as PartFilter)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {partFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          条件に一致する結果がありません。
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {filteredResults.map((result, index) => (
            <li
              key={result.program_id}
              className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-5 py-4"
            >
              <span className="text-center text-sm text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="wrap-break-word font-medium">
                  {result.title ?? "曲名未設定"}
                </p>
                <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
                  第{result.concert_count ?? "?"}回 / {partLabel(result.part)}
                  {result.arranger ? ` / ${result.arranger}` : ""}
                </p>
              </div>
              <span className="whitespace-nowrap text-lg font-semibold">
                {result.votes}票
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
