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

    /*
     * 3曲選択済みの場合は、
     * 既に選んでいる曲の解除だけ可能。
     */
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

    /*
     * すべてのグループが3曲選択されているか確認
     */
    const incompleteBuckets = buckets.filter(
      (bucket) => (selections[bucket.bucketIndex] ?? []).length !== MAX_SELECT,
    );

    if (incompleteBuckets.length > 0) {
      const firstIncomplete = incompleteBuckets[0];

      const element = document.getElementById(
        `survey-bucket-${firstIncomplete.bucketIndex}`,
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    /*
     * 選択された曲ID
     */
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
   * ===================================================== */

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
   * ===================================================== */

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
   * ===================================================== */

  return (
    <>
      <form onSubmit={onSubmit} className="w-full">
        {/* ==================================================
            固定ヘッダー
            タイトル・進捗・検索
           ================================================== */}

        <div
          className="
            sticky
            top-0
            z-40
            bg-background/95
            px-2
            pb-3
            pt-2
            backdrop-blur
          "
        >
          <div
            className="
              rounded-xl
              border
              bg-background
              p-4
              shadow-sm
            "
          >
            {/* タイトル */}

            <div>
              <h2 className="text-base font-semibold">
                各グループから{MAX_SELECT}曲ずつ選んでください。
              </h2>
            </div>

            {/* 回答状況 */}

            <div
              className="
                mt-4
                rounded-lg
                bg-muted/40
                px-3
                py-2.5
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">回答状況</span>

                <span
                  className={[
                    "text-sm font-semibold",
                    allComplete ? "text-primary" : "text-foreground",
                  ].join(" ")}
                >
                  {completedBuckets} / {buckets.length} グループ
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">選択した曲</span>

                <span className="font-semibold">{totalSelected}曲</span>
              </div>

              {/* 進捗バー */}

              <div
                className="
                  mt-2
                  h-1.5
                  w-full
                  overflow-hidden
                  rounded-full
                  bg-muted
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-primary
                    transition-all
                    duration-300
                  "
                  style={{
                    width: `${
                      buckets.length > 0
                        ? (completedBuckets / buckets.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* 検索 */}

            <div className="mt-3">
              <label
                htmlFor="survey-search"
                className="mb-1.5 block text-xs font-medium"
              >
                曲を検索
              </label>

              <div className="relative">
                <MagnifyingGlassIcon
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    h-4
                    w-4
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
                    rounded-lg
                    border
                    bg-card
                    py-2.5
                    pl-9
                    pr-9
                    text-sm
                    outline-none
                    transition
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
                      right-2.5
                      top-1/2
                      -translate-y-1/2
                      rounded
                      p-1
                      text-muted-foreground
                      hover:text-foreground
                    "
                    aria-label="検索をクリア"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* クリア */}

            {totalSelected > 0 && (
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={clearAll}
                  className="
                    text-xs
                    text-muted-foreground
                    underline
                    decoration-dotted
                    underline-offset-2
                    hover:text-foreground
                  "
                >
                  選択をすべてクリア
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            グループ一覧
           ================================================== */}

        <div className="space-y-3 px-2 pt-1">
          {filteredBuckets.map((bucket) => {
            const selected = selections[bucket.bucketIndex] ?? [];

            const isCompleted = selected.length === MAX_SELECT;

            return (
              <section
                key={bucket.bucketIndex}
                id={`survey-bucket-${bucket.bucketIndex}`}
                className="
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
                        {isCompleted && (
                          <CheckIcon
                            className="
                              h-5
                              w-5
                              shrink-0
                              text-primary
                            "
                          />
                        )}

                        <h3 className="truncate text-sm font-semibold">
                          {bucket.label}
                        </h3>
                      </div>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {bucket.programs.length}曲から
                        {MAX_SELECT}曲選択
                      </p>
                    </div>

                    <div
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1",
                        "text-xs font-semibold",
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
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
                              {isSelected ? order : ""}
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
                                    wrap-break-word
                                    text-[11px]
                                    leading-relaxed
                                    text-muted-foreground
                                  "
                                >
                                  {detail}
                                </div>
                              )}
                            </div>

                            {/* 選択状態 */}

                            {isSelected && (
                              <CheckIcon
                                className="
                                  mt-0.5
                                  h-5
                                  w-5
                                  shrink-0
                                  text-primary
                                "
                              />
                            )}
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

        <div className="px-2 pt-4">
          <section
            className="
              rounded-xl
              border
              bg-background
              p-4
              shadow-sm
            "
          >
            <div>
              <h2 className="text-sm font-semibold">自由記入欄</h2>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                曲についての感想や、選曲に関するご意見などがあれば
                ご自由にお書きください。
              </p>
            </div>

            <textarea
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              placeholder="ご意見・ご感想など"
              rows={5}
              maxLength={1000}
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
                transition
                placeholder:text-muted-foreground
                focus:ring-2
                focus:ring-primary/40
              "
            />

            <div className="mt-1 text-right text-[11px] text-muted-foreground">
              {freeText.length} / 400文字
            </div>
          </section>
        </div>

        {/* ==================================================
            送信前確認
           ================================================== */}

        <div className="px-2 pt-4">
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
              {/* アイコン */}

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

              {/* タイトル */}

              <h2 className="text-base font-semibold">
                {submitResult.success ? "送信完了" : "送信エラー"}
              </h2>

              {/* メッセージ */}

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {submitResult.message}
              </p>

              {/* ホームへ戻る */}

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
