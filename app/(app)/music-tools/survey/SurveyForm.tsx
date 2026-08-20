"use client";
import React, { useState } from "react";

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

export default function SurveyForm({ buckets }: { buckets: Bucket[] }) {
  const [selections, setSelections] = useState<Record<number, string>>(() => {
    try {
      if (typeof window === "undefined") return {};
      const raw = localStorage.getItem("iwe-survey-selections");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState<string | null>(null);

  const onSelect = (bucketIndex: number, programId: string) => {
    setSelections((s) => ({ ...s, [bucketIndex]: programId }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("iwe-survey-selections", JSON.stringify(selections));
      setModalText("テスト画面のため回答は送信されません");
      setModalVisible(true);
    } catch (err) {
      setModalText("保存に失敗しました。");
      setModalVisible(true);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {modalVisible && modalText ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative rounded-md bg-white p-6 shadow-lg max-w-md w-full">
            <div className="text-sm text-center">{modalText}</div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="rounded-md px-4 py-2 bg-primary text-primary-foreground"
                onClick={() => setModalVisible(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {buckets.map((b) => (
        <section key={b.bucketIndex} className="rounded-md border p-3">
          <div className="mb-2 font-medium">{b.label}</div>

          <div className="space-y-2">
            {b.programs.map((p) => {
              const noteText = [
                p.arranger,
                [
                  p.part === "1"
                    ? "第1部"
                    : p.part === "2"
                      ? "第2部"
                      : p.part === "3"
                        ? "第3部"
                        : p.part,
                  p.memo,
                ]
                  .filter(Boolean)
                  .join("、")
                  ? `(${[
                      p.part === "1"
                        ? "第1部"
                        : p.part === "2"
                          ? "第2部"
                          : p.part === "3"
                            ? "第3部"
                            : p.part,
                      p.memo,
                    ]
                      .filter(Boolean)
                      .join("、")})`
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              const selected = selections[b.bucketIndex] === p.id;

              return (
                <label
                  key={p.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-muted/40",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`bucket-${b.bucketIndex}`}
                    checked={selected}
                    onChange={() => onSelect(b.bucketIndex, p.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-snug sm:text-[0.95rem]">
                      <span className="wrap-break-word">
                        {p.title ?? "(無題)"}
                      </span>
                    </div>

                    {noteText ? (
                      <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                        <span className="wrap-break-word">{noteText}</span>
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      ))}
      <div>
        <button
          className="rounded-md px-4 py-2 bg-primary text-primary-foreground"
          type="submit"
        >
          送信
        </button>
      </div>
    </form>
  );
}
