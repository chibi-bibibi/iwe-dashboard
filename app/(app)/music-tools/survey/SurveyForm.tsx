"use client";

import React, { useMemo, useRef, useState, useSyncExternalStore } from "react";

import {
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { submitSurvey } from "@/app/lib/data.survey-selections";
import router from "next/router";

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
    // localStorage が使えない場合は何もしない
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
  const [selections, setSelections] = useSelections();

  const [search, setSearch] = useState("");

  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);

  const [submitResult, setSubmitResult] = useState<{
    open: boolean;
    message: string;
    success: boolean;
  }>({
    open: false,
    message: "",
    success: false,
  });

  /*
   * 初期状態はすべて閉じる。
   * 100曲程度あっても画面を圧迫しない。
   */
  const [openBuckets, setOpenBuckets] = useState<Record<number, boolean>>(
    () => {
      const result: Record<number, boolean> = {};

      for (const bucket of buckets) {
        result[bucket.bucketIndex] = false;
      }

      return result;
    },
  );

  const listRef = useRef<HTMLDivElement | null>(null);

  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});

  const toastSequence = useRef(0);

  /* =======================================================
   * Toast
   * ===================================================== */

  const showToast = (text: string) => {
    const id = ++toastSequence.current;

    setToasts((current) => [
      ...current,
      {
        id,
        text,
      },
    ]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  };

  /* =======================================================
   * スクロール制御
   *
   * アコーディオン領域の端でスクロールしても、
   * ページ本体へスクロールを逃がさない。
   * ===================================================== */

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = listRef.current;

    if (!container) {
      return;
    }

    const maxScroll = container.scrollHeight - container.clientHeight;

    const atTop = container.scrollTop <= 0;
    const atBottom = container.scrollTop >= maxScroll - 1;

    if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) {
      event.preventDefault();
    }

    event.stopPropagation();
  };

  /* =======================================================
   * グループジャンプ
   * ===================================================== */

  const openAndScrollTo = (bucketIndex: number) => {
    setOpenBuckets((current) => ({
      ...current,
      [bucketIndex]: true,
    }));

    /*
     * Reactがアコーディオンを開いた後に
     * スクロール位置を計算する。
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = listRef.current;
        const section = sectionRefs.current[bucketIndex];

        if (!container || !section) {
          return;
        }

        const containerRect = container.getBoundingClientRect();

        const sectionRect = section.getBoundingClientRect();

        const target =
          sectionRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
          top: Math.max(0, target),
          behavior: "smooth",
        });
      });
    });
  };

  /* =======================================================
   * Accordion
   * ===================================================== */

  const toggleBucket = (bucketIndex: number) => {
    setOpenBuckets((current) => ({
      ...current,
      [bucketIndex]: !current[bucketIndex],
    }));
  };

  /* =======================================================
   * 選択
   * ===================================================== */

  const onToggleSelect = (bucketIndex: number, programId: string) => {
    const current = selections[bucketIndex] ?? [];

    if (!current.includes(programId) && current.length >= MAX_SELECT) {
      showToast(`各グループは最大${MAX_SELECT}曲まで選べます`);
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
    showToast("すべての選択をクリアしました");
  };

  /* =======================================================
   * Submit
   * ===================================================== */

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const incompleteBuckets = buckets.filter(
      (bucket) => (selections[bucket.bucketIndex] ?? []).length !== MAX_SELECT,
    );

    if (incompleteBuckets.length > 0) {
      showToast(
        `3曲すべて選択していないグループが${incompleteBuckets.length}件あります（${incompleteBuckets
          .map((bucket) => bucket.label)
          .slice(0, 3)
          .join("、")}${incompleteBuckets.length > 3 ? " ほか" : ""}）`,
      );

      openAndScrollTo(incompleteBuckets[0].bucketIndex);

      return;
    }

    const programIds = Object.values(selections)
      .flat()
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    try {
      const result = await submitSurvey(programIds);

      console.log("result:", result);

      if (result.success) {
        setSelections({});
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
    <form
      onSubmit={onSubmit}
      className="
        flex
        h-full
        min-h-0
        w-full
        flex-col
        overflow-hidden
      "
    >
      {/* ==================================================
          操作エリア
          固定
         ================================================== */}

      <div
        className="
          shrink-0
          bg-background
          px-2
          pb-2
        "
      >
        <p className="mb-2 text-xs text-muted-foreground">
          各グループから{MAX_SELECT}曲選んでください。
        </p>

        <div
          className="
            space-y-2
            rounded-lg
            border
            bg-background
            p-2.5
            shadow-sm
          "
        >
          {/* 選択状況 */}

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs sm:text-sm">
              選択済み{" "}
              <span className="font-semibold text-primary">
                {completedBuckets}
              </span>{" "}
              / {buckets.length} グループ
              <span className="mx-1 text-muted-foreground">・</span>
              <span className="font-semibold text-primary">
                {totalSelected}
              </span>
              曲
            </div>

            {totalSelected > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="
                  shrink-0
                  text-xs
                  text-muted-foreground
                  underline
                  decoration-dotted
                  hover:text-foreground
                "
              >
                全てクリア
              </button>
            )}
          </div>

          {/* 進捗バー */}

          <div
            className="
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

          {/* 検索 */}

          <div className="relative">
            <MagnifyingGlassIcon
              className="
                pointer-events-none
                absolute
                left-2.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-muted-foreground
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="曲名・編曲者・メモで検索"
              className="
                w-full
                rounded-md
                border
                bg-card
                py-2
                pl-8
                pr-8
                text-sm
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
                  right-2
                  top-1/2
                  -translate-y-1/2
                  text-muted-foreground
                "
                aria-label="検索をクリア"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* グループジャンプ */}

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>グループへ移動</span>
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </div>

            <div
              className="
                flex
                gap-1.5
                overflow-x-auto
                pb-0.5
              "
            >
              {buckets.map((bucket, index) => {
                const selectedCount =
                  selections[bucket.bucketIndex]?.length ?? 0;

                return (
                  <button
                    key={bucket.bucketIndex}
                    type="button"
                    onClick={() => openAndScrollTo(bucket.bucketIndex)}
                    title={`${bucket.label}へ移動`}
                    aria-label={`${bucket.label}へ移動`}
                    className={[
                      "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full",
                      "text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",

                      selectedCount === MAX_SELECT
                        ? "bg-primary text-primary-foreground"
                        : selectedCount > 0
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                    ].join(" ")}
                  >
                    {selectedCount === MAX_SELECT ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          アコーディオン領域
          ★★★ ここだけスクロール ★★★
         ================================================== */}

      <div
        ref={listRef}
        onWheel={handleWheel}
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overscroll-contain
          px-2
          pb-2
        "
      >
        <div
          className="
            overflow-hidden
            rounded-lg
            border
            bg-background
          "
        >
          {filteredBuckets.map((bucket) => {
            const selected = selections[bucket.bucketIndex] ?? [];

            const open = !!openBuckets[bucket.bucketIndex];

            const selectedPrograms = bucket.programs.filter((program) =>
              selected.includes(program.id),
            );

            return (
              <section
                key={bucket.bucketIndex}
                ref={(element) => {
                  sectionRefs.current[bucket.bucketIndex] = element;
                }}
                className="
                    overflow-hidden
                    bg-background
                  "
              >
                {/* ==================================================
                      アコーディオンヘッダー
                     ================================================== */}

                <button
                  type="button"
                  onClick={() => toggleBucket(bucket.bucketIndex)}
                  className={[
                    open ? "sticky top-0 z-20" : "",
                    "flex w-full flex-col gap-1.5",
                    "bg-background px-3 py-2.5 text-left",
                    "transition-colors hover:bg-muted/30",
                    bucket.bucketIndex > 0 ? "border-t" : "",
                  ].join(" ")}
                  aria-expanded={open}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {open ? (
                        <ChevronDownIcon
                          className="
                              h-4
                              w-4
                              shrink-0
                              text-muted-foreground
                            "
                        />
                      ) : (
                        <ChevronRightIcon
                          className="
                              h-4
                              w-4
                              shrink-0
                              text-muted-foreground
                            "
                        />
                      )}

                      {selected.length === MAX_SELECT && (
                        <CheckIcon
                          className="
                              h-4
                              w-4
                              shrink-0
                              text-primary
                            "
                        />
                      )}

                      <span className="truncate text-sm font-semibold">
                        {bucket.label}
                      </span>

                      <span className="shrink-0 text-xs font-normal text-muted-foreground">
                        {bucket.programs.length}曲
                      </span>
                    </div>

                    {/* 選択数 */}

                    <span
                      className={[
                        "shrink-0 text-xs font-normal text-muted-foreground",
                      ].join(" ")}
                    >
                      {selected.length}/{MAX_SELECT}
                    </span>
                  </div>

                  {/* 閉じているときは選択曲を表示 */}

                  {!open && selectedPrograms.length > 0 && (
                    <div className="ml-6 flex flex-wrap gap-1">
                      {selectedPrograms.map((program, index) => (
                        <span
                          key={program.id}
                          className="
                                  max-w-full
                                  truncate
                                  rounded-full
                                  bg-primary/10
                                  px-2
                                  py-0.5
                                  text-[11px]
                                  text-primary
                                "
                        >
                          {index + 1}. {program.title ?? "(無題)"}
                        </span>
                      ))}
                    </div>
                  )}
                </button>

                {/* ==================================================
                      曲一覧
                     ================================================== */}

                {open && (
                  <div
                    className="
                        border-t
                        px-2.5
                        pb-2.5
                        pt-2
                      "
                  >
                    <div className="space-y-1.5">
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
                              "flex cursor-pointer items-start gap-2.5 rounded-md border px-2.5 py-2",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:bg-muted/40",
                              disabled ? "cursor-not-allowed opacity-45" : "",
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
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border",
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
                                <div className="mt-0.5 break-words text-[11px] leading-relaxed text-muted-foreground">
                                  {detail}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          送信ボタン
          ★ 固定
         ================================================== */}

      <div
        className="
    shrink-0
    bg-background
    px-2
    pb-[max(5rem,env(safe-area-inset-bottom))]
    pt-1
  "
      >
        <button
          type="submit"
          className={[
            "w-full rounded-lg px-5 py-2.5",
            "text-sm font-semibold",
            "transition-colors",
            "shadow-sm",
            allComplete
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-primary/60 text-primary-foreground",
          ].join(" ")}
        >
          送信（{totalSelected}曲）
        </button>
      </div>

      {/* ==================================================
          Toast
         ================================================== */}

      {/* ==================================================
    Submit Result Modal
   ================================================== */}

      {submitResult.open && (
        <div
          className="
      fixed
      inset-0
      z-[100]
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
                  "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full",
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

              <p className="mt-2 text-sm text-muted-foreground">
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
    </form>
  );
}
