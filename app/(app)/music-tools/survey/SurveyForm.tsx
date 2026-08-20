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
          <div className="font-medium mb-2">{b.label}</div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="w-12 py-2 px-3">選択</th>
                  <th className="py-2 px-3">曲名</th>
                  <th className="w-36 py-2 px-3">部</th>
                  <th className="w-48 py-2 px-3">編曲者</th>
                  <th className="w-48 py-2 px-3">備考</th>
                </tr>
              </thead>
              <tbody>
                {b.programs.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 px-3">
                      <input
                        type="radio"
                        name={`bucket-${b.bucketIndex}`}
                        checked={selections[b.bucketIndex] === p.id}
                        onChange={() => onSelect(b.bucketIndex, p.id)}
                      />
                    </td>
                    <td className="py-2 px-3 align-top">
                      {p.title ?? "(無題)"}
                    </td>
                    <td className="py-2 px-3 align-top">
                      {p.part === "1"
                        ? "第1部"
                        : p.part === "2"
                          ? "第2部"
                          : p.part === "3"
                            ? "第3部"
                            : p.part}
                    </td>
                    <td className="py-2 px-3 align-top">{p.arranger ?? ""}</td>
                    <td className="py-2 px-3 align-top">{p.memo ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
