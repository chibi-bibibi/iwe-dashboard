"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";

import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import { submitSurvey } from "@/app/lib/data.survey-selections";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  regular_concert_id: string | null;
  concert_count?: number | null;
  concert_date?: string | null;
  part?: string | null;
  title?: string | null;
  arranger?: string | null;
  memo?: string | null;
};

type Bucket = {
  bucketIndex: number;
  label: string;
  programs: Program[];
};

const STORAGE_KEY = "iwe-survey-selections";
const MAX_SELECT = 3;
const FREE_TEXT_MAX_LENGTH = 400;

const EMPTY_SELECTIONS: Record<number, string[]> = {};

const partLabel = (part?: string | null) => {
  if (part === "1") return "第1部";
  if (part === "2") return "第2部";
  if (part === "3") return "第3部";

  return part;
};

/* =========================================================
 * localStorage
 * ======================================================= */

let selectionsSnapshot = EMPTY_SELECTIONS;
let selectionsRaw: string | null | undefined;

function loadSelectionsFromStorage(): Record<number, string[]> {
  if (typeof window === "undefined") {
    return EMPTY_SELECTIONS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_SELECTIONS;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return EMPTY_SELECTIONS;
    }

    const result: Record<number, string[]> = {};

    for (const key of Object.keys(parsed)) {
      const value = (parsed as Record<string, unknown>)[key];
      const index = Number(key);

      if (!Number.isFinite(index)) {
        continue;
      }

      if (Array.isArray(value)) {
        result[index] = value
          .filter((item): item is string => typeof item === "string")
          .slice(0, MAX_SELECT);
      } else if (typeof value === "string") {
        result[index] = [value];
      }
    }

    return result;
  } catch {
    return EMPTY_SELECTIONS;
  }
}

function getSelectionsSnapshot(): Record<number, string[]> {
  if (typeof window === "undefined") {
    return EMPTY_SELECTIONS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === selectionsRaw) {
    return selectionsSnapshot;
  }

  selectionsRaw = raw;
  selectionsSnapshot = loadSelectionsFromStorage();

  return selectionsSnapshot;
}

function getSelectionsServerSnapshot(): Record<number, string[]> {
  return EMPTY_SELECTIONS;
}

function subscribeToSelections(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      selectionsRaw = undefined;
      callback();
    }
  };

  const handleCustomStorage = () => {
    selectionsRaw = undefined;
    callback();
  };

  window.addEventListener("storage", handleStorage);

  window.addEventListener("iwe-survey-selections-change", handleCustomStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);

    window.removeEventListener(
      "iwe-survey-selections-change",
      handleCustomStorage,
    );
  };
}

function saveSelectionsToStorage(selections: Record<number, string[]>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = JSON.stringify(selections);

    window.localStorage.setItem(STORAGE_KEY, raw);

    selectionsRaw = raw;
    selectionsSnapshot = selections;

    window.dispatchEvent(new Event("iwe-survey-selections-change"));
  } catch {
    // localStorage が使用できない場合は何もしない
  }
}

function useSelections(): [
  Record<number, string[]>,
  (
    update:
      | Record<number, string[]>
      | ((current: Record<number, string[]>) => Record<number, string[]>),
  ) => void,
] {
  const selections = useSyncExternalStore(
    subscribeToSelections,
    getSelectionsSnapshot,
    getSelectionsServerSnapshot,
  );

  const setSelections = (
    update:
      | Record<number, string[]>
      | ((current: Record<number, string[]>) => Record<number, string[]>),
  ) => {
    const current = getSelectionsSnapshot();

    const next = typeof update === "function" ? update(current) : update;

    saveSelectionsToStorage(next);
  };

  return [selections, setSelections];
}

/* =========================================================
 * 進捗グループ
 *
 * buckets の配列位置を基準にする。
 *
 * 0〜9   → 1-10回
 * 10〜19 → 11-20回
 * 20〜29 → 21-30回
 * 30〜38 → 31-39回
 * ======================================================= */

const progressGroups = [
  {
    label: "1-10回",
    startIndex: 0,
    endIndex: 9,
  },
  {
    label: "11-20回",
    startIndex: 10,
    endIndex: 19,
  },
  {
    label: "21-30回",
    startIndex: 20,
    endIndex: 29,
  },
  {
    label: "31-39回",
    startIndex: 30,
    endIndex: 38,
  },
];

/* =========================================================
 * SurveyForm
 * ======================================================= */

export default function SurveyForm({ buckets }: { buckets: Bucket[] }) {
  const router = useRouter();

  const [selections, setSelections] = useSelections();

  const [search, setSearch] = useState("");

  const [freeText, setFreeText] = useState("");

  const [submitResult, setSubmitResult] = useState<{
    open: boolean;
    message: string;
    success: boolean;
  }>({
    open: false,
    message: "",
    success: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =======================================================
   * 曲選択
   * ===================================================== */

  const onToggleSelect = (bucketIndex: number, programId: string) => {
    const current = selections[bucketIndex] ?? [];

    if (!current.includes(programId) && current.length >= MAX_SELECT) {
      return;
    }

    setSelections((state) => {
      const selected = state[bucketIndex] ?? [];

      const next = selected.includes(programId)
        ? selected.filter((id) => id !== programId)
        : [...selected, programId];

      return {
        ...state,
        [bucketIndex]: next,
      };
    });
  };

  /* =======================================================
   * 全クリア
   * ===================================================== */

  const clearAll = () => {
    setSelections({});
  };

  /* =======================================================
   * Submit
   * ===================================================== */

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const incompleteBuckets = buckets.filter(
      (bucket) => (selections[bucket.bucketIndex] ?? []).length !== MAX_SELECT,
    );

    if (incompleteBuckets.length > 0) {
      const firstIncomplete = incompleteBuckets[0];

      const element = document.getElementById(
        `survey-bucket-${firstIncomplete.bucketIndex}`,
      );

      element?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    const programIds = Object.values(selections)
      .flat()
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (programIds.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await submitSurvey(programIds, freeText.trim());

      console.log("result:", result);

      if (result.success) {
        setSelections({});
        setFreeText("");
      }

      setSubmitResult({
        open: true,
        message: result.message,
        success: result.success,
      });
    } catch (error) {
      console.error(error);

      setSubmitResult({
        open: true,
        message: "回答の保存に失敗しました。",
        success: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
   * 集計
   * ======================================================= */

  const totalSelected = useMemo(() => {
    return Object.values(selections).reduce(
      (total, selected) => total + selected.length,
      0,
    );
  }, [selections]);

  const completedBuckets = useMemo(() => {
    return buckets.filter(
      (bucket) => (selections[bucket.bucketIndex] ?? []).length === MAX_SELECT,
    ).length;
  }, [buckets, selections]);

  const allComplete = buckets.length > 0 && completedBuckets === buckets.length;

  /* =======================================================
   * 検索
   * ======================================================= */

  const filteredBuckets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return buckets;
    }

    return buckets.map((bucket) => ({
      ...bucket,

      programs: bucket.programs.filter((program) =>
        [program.title, program.arranger, program.memo, program.concert_date]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      ),
    }));
  }, [buckets, search]);

  /* =======================================================
   * Render
   * ======================================================= */

  return (
    <>
      <form onSubmit={onSubmit} className="w-full">
        {/* ==================================================
            固定ヘッダー
           ================================================== */}

        <div
          className="
            sticky
            top-0
            z-50
            w-full
            border-b
            bg-background/95
            px-2
            py-2
            shadow-sm
            backdrop-blur
          "
        >
          <div className="mx-auto w-full max-w-3xl">
            {/* タイトル */}

            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">
                  各グループから{MAX_SELECT}曲選択してください。
                </h2>
              </div>
            </div>

            {/* 回数範囲 */}

            <div className="mt-2 grid grid-cols-5 gap-1.5 relative">
              {filteredBuckets.map((group) => {
                const selected = selections[group.bucketIndex] ?? [];
                const isCompleted = selected.length === MAX_SELECT;
                const start = group.bucketIndex * 10 + 1;
                const end = start + 9 !== 40 ? start + 9 : 39;

                return (
                  <div
                    key={group.label}
                    className={[
                      "flex min-w-0 items-center justify-center",
                      "gap-1 rounded-md px-1 py-1.5",
                      "text-[10px] font-semibold",
                      "transition-colors",

                      //   isCompleted
                      //     ? "border-primary bg-primary text-primary-foreground"
                      //     : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60",
                    ].join(" ")}
                  >
                    {isCompleted && (
                      <CheckIcon
                        className="
                          h-3
                          w-3
                          shrink-0
                          stroke-[2.5]
                        "
                      />
                    )}

                    <span>
                      {start}-{end}回
                    </span>
                  </div>
                );
              })}

              <div className="absolute bottom-2 right-0 text-[10px] text-muted-foreground">
                選択中{" "}
                <span className="font-semibold text-foreground">
                  {totalSelected}
                </span>
                曲
              </div>
            </div>

            {/* 選択数 + 検索 */}

            <div className="mt-2 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <MagnifyingGlassIcon
                  className="
                    pointer-events-none
                    absolute
                    left-2.5
                    top-1/2
                    h-3.5
                    w-3.5
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />

                <input
                  id="survey-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="曲名・編曲者で検索"
                  className="
                    w-full
                    rounded-md
                    border
                    bg-card
                    py-1.5
                    pl-8
                    pr-7
                    text-xs
                    outline-none
                    focus:ring-2
                    focus:ring-primary/40
                  "
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="
                      absolute
                      right-1.5
                      top-1/2
                      -translate-y-1/2
                      rounded
                      p-1
                      text-muted-foreground
                    "
                    aria-label="検索をクリア"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {totalSelected > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="
                    shrink-0
                    text-[10px]
                    text-muted-foreground
                    underline
                    decoration-dotted
                    underline-offset-2
                  "
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            グループ一覧
           ================================================== */}

        <div className="mx-auto w-full max-w-3xl space-y-3 px-2 pt-3">
          {filteredBuckets.map((bucket) => {
            const selected = selections[bucket.bucketIndex] ?? [];

            const isCompleted = selected.length === MAX_SELECT;

            return (
              <section
                key={bucket.bucketIndex}
                id={`survey-bucket-${bucket.bucketIndex}`}
                className="
                  scroll-mt-32.5
                  overflow-hidden
                  rounded-xl
                  border
                  bg-background
                  shadow-sm
                "
              >
                {/* グループヘッダー */}

                <div
                  className={[
                    "border-b px-3.5 py-3",

                    isCompleted
                      ? "border-primary/20 bg-primary/5"
                      : "bg-background",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">
                          {bucket.label}
                        </h3>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          対象：{bucket.programs.length}曲
                        </p>
                      </div>
                    </div>

                    <div
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1",
                        "text-xs font-semibold",
                      ].join(" ")}
                    >
                      {selected.length} / {MAX_SELECT}
                    </div>
                  </div>
                </div>

                {/* 曲一覧 */}

                <div className="p-2.5">
                  {bucket.programs.length === 0 ? (
                    <div
                      className="
                        rounded-lg
                        bg-muted/30
                        px-3
                        py-5
                        text-center
                        text-xs
                        text-muted-foreground
                      "
                    >
                      検索条件に一致する曲がありません。
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bucket.programs.map((program) => {
                        const isSelected = selected.includes(program.id);

                        const order = selected.indexOf(program.id) + 1;

                        const disabled =
                          selected.length >= MAX_SELECT && !isSelected;

                        const detail = [
                          program.arranger,
                          partLabel(program.part),
                          program.memo,
                        ]
                          .filter(Boolean)
                          .join(" ・ ");

                        return (
                          <label
                            key={program.id}
                            className={[
                              "flex items-start gap-3",
                              "rounded-lg border p-3",
                              "transition-colors",

                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card",

                              disabled
                                ? "cursor-not-allowed opacity-40"
                                : "cursor-pointer hover:bg-muted/40",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() =>
                                onToggleSelect(bucket.bucketIndex, program.id)
                              }
                              className="sr-only"
                            />

                            {/* 選択番号 */}

                            <span
                              className={[
                                "mt-0.5 flex h-6 w-6 shrink-0",
                                "items-center justify-center",
                                "rounded-full border",
                                "text-xs font-semibold",

                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground",
                              ].join(" ")}
                            >
                              {isSelected ? (
                                <CheckIcon
                                  className="
                                  mt-0.5
                                  h-3
                                  w-3
                                  shrink-0
                                "
                                />
                              ) : (
                                ""
                              )}
                            </span>

                            {/* 曲情報 */}

                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium leading-snug">
                                {program.title ?? "(無題)"}
                              </div>

                              {detail && (
                                <div
                                  className="
                                    mt-1
                                    wrap-break-words
                                    text-[11px]
                                    leading-relaxed
                                    text-muted-foreground
                                  "
                                >
                                  {detail}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* ==================================================
            自由記入欄
           ================================================== */}

        <div className="mx-auto w-full max-w-3xl px-2 pt-4">
          <section
            className="
              rounded-xl
              border
              bg-background
              p-4
              shadow-sm
            "
          >
            <h2 className="text-sm font-semibold">自由記入欄</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              曲についての感想やご意見などがあればご自由にお書きください。
            </p>

            <textarea
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              placeholder="ご意見・ご感想など"
              rows={3}
              maxLength={FREE_TEXT_MAX_LENGTH}
              className="
                mt-3
                w-full
                resize-y
                rounded-lg
                border
                bg-card
                px-3
                py-2.5
                text-sm
                leading-relaxed
                outline-none
                placeholder:text-muted-foreground
                focus:ring-2
                focus:ring-primary/40
              "
            />

            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {freeText.length} / {FREE_TEXT_MAX_LENGTH}文字
            </div>
          </section>
        </div>

        {/* ==================================================
            送信前確認
           ================================================== */}

        <div className="mx-auto w-full max-w-3xl px-2 pt-4">
          <div
            className={[
              "rounded-xl border p-4",

              allComplete
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/20",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex h-6 w-6 shrink-0",
                  "items-center justify-center",
                  "rounded-full",

                  allComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {allComplete ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{completedBuckets}</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {allComplete
                    ? "すべてのグループの選択が完了しました"
                    : "まだ選択が完了していません"}
                </p>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {allComplete
                    ? `合計${totalSelected}曲を選択しています。この内容で送信できます。`
                    : `各グループから${MAX_SELECT}曲ずつ選択してください。`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            送信ボタン
           ================================================== */}

        <div
          className="
            mx-auto
            w-full
            max-w-3xl
            px-2
            pb-[max(1.5rem,env(safe-area-inset-bottom))]
            pt-3
          "
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "w-full rounded-xl px-5 py-3",
              "text-sm font-semibold",
              "shadow-sm",
              "transition-colors",

              isSubmitting
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : allComplete
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-primary/60 text-primary-foreground",
            ].join(" ")}
          >
            {isSubmitting
              ? "送信中..."
              : `回答を送信する（${totalSelected}曲）`}
          </button>

          {!allComplete && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              すべてのグループで3曲選択すると送信できます
            </p>
          )}
        </div>
      </form>

      {/* ==================================================
          Submit Result Modal
         ================================================== */}

      {submitResult.open && (
        <div
          className="
            fixed
            inset-0
            z-100
            flex
            items-center
            justify-center
            bg-black/40
            px-4
          "
          role="dialog"
          aria-modal="true"
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-xl
              bg-background
              p-5
              shadow-xl
            "
          >
            <div className="text-center">
              <div
                className={[
                  "mx-auto mb-3 flex h-12 w-12",
                  "items-center justify-center",
                  "rounded-full",

                  submitResult.success
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive",
                ].join(" ")}
              >
                {submitResult.success ? (
                  <CheckIcon className="h-6 w-6" />
                ) : (
                  <XMarkIcon className="h-6 w-6" />
                )}
              </div>

              <h2 className="text-base font-semibold">
                {submitResult.success ? "送信完了" : "送信エラー"}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {submitResult.message}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSubmitResult({
                    open: false,
                    message: "",
                    success: false,
                  });

                  router.push("/");
                }}
                className="
                  mt-5
                  w-full
                  rounded-lg
                  bg-primary
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-primary-foreground
                  hover:bg-primary/90
                "
              >
                ホームへ戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
