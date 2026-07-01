"use client";

import React from "react";

/* ─── Base Skeleton pulse block ─── */
export function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
      style={style}
    />
  );
}

/* ─── Table row skeleton ─── */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <SkeletonBlock
            className="h-4 rounded-md"
            style={{ width: i === 0 ? "70%" : i === cols - 1 ? "40%" : "80%" }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ─── Table skeleton (header + N rows) ─── */
export function SkeletonTable({
  rows = 6,
  cols = 5,
  headers,
}: {
  rows?: number;
  cols?: number;
  headers?: string[];
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {(headers ?? Array.from({ length: cols }).map((_, i) => `col-${i}`)).map(
                (h, i) => (
                  <th key={i} className="p-4">
                    <SkeletonBlock className="h-3 w-20 rounded" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Stat card skeleton (for dashboard) ─── */
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock className="h-9 w-9 rounded-xl" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-8 w-24 mb-2 rounded-lg" />
      <SkeletonBlock className="h-4 w-32 rounded-md" />
    </div>
  );
}

/* ─── Card skeleton (generic) ─── */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm animate-pulse space-y-3">
      <SkeletonBlock className="h-5 w-48 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-4 rounded-md"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

/* ─── Question row skeleton ─── */
export function SkeletonQuestionRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="p-4 w-12">
        <SkeletonBlock className="h-4 w-4 rounded" />
      </td>
      <td className="p-4">
        <SkeletonBlock className="h-4 w-full max-w-sm rounded-md mb-1" />
        <SkeletonBlock className="h-3 w-3/4 rounded-md" />
      </td>
      <td className="p-4">
        <SkeletonBlock className="h-5 w-24 rounded-md mb-1" />
        <SkeletonBlock className="h-3 w-20 rounded" />
      </td>
      <td className="p-4">
        <SkeletonBlock className="h-5 w-14 rounded-lg" />
      </td>
      <td className="p-4 text-center">
        <SkeletonBlock className="h-5 w-6 mx-auto rounded" />
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

/* ─── User row skeleton ─── */
export function SkeletonUserRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
          <div className="space-y-1 flex-1">
            <SkeletonBlock className="h-4 w-32 rounded-md" />
            <SkeletonBlock className="h-3 w-40 rounded" />
          </div>
        </div>
      </td>
      <td className="p-4"><SkeletonBlock className="h-6 w-16 rounded-lg" /></td>
      <td className="p-4"><SkeletonBlock className="h-4 w-24 rounded-md" /></td>
      <td className="p-4"><SkeletonBlock className="h-4 w-20 rounded-md" /></td>
      <td className="p-4"><SkeletonBlock className="h-4 w-24 rounded-md" /></td>
      <td className="p-4 text-right"><SkeletonBlock className="h-7 w-7 ml-auto rounded-lg" /></td>
    </tr>
  );
}

/* ─── Exam row skeleton ─── */
export function SkeletonExamRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      <td className="p-4 pl-6"><SkeletonBlock className="h-4 w-40 rounded-md" /></td>
      <td className="p-4"><SkeletonBlock className="h-5 w-16 rounded-full" /></td>
      <td className="p-4 text-center"><SkeletonBlock className="h-4 w-6 mx-auto rounded" /></td>
      <td className="p-4 text-center"><SkeletonBlock className="h-4 w-8 mx-auto rounded" /></td>
      <td className="p-4 text-center"><SkeletonBlock className="h-4 w-10 mx-auto rounded" /></td>
      <td className="p-4 text-center"><SkeletonBlock className="h-4 w-10 mx-auto rounded" /></td>
      <td className="p-4 text-center"><SkeletonBlock className="h-5 w-12 mx-auto rounded-full" /></td>
      <td className="p-4"><SkeletonBlock className="h-7 w-20 rounded-lg" /></td>
      <td className="p-4 pr-6 text-right">
        <div className="flex justify-end gap-2">
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}
