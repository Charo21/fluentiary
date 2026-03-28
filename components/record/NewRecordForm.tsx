'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function NewRecordForm() {
  const [keyPoints, setKeyPoints] = useState('');
  const [freeWrite, setFreeWrite] = useState('');

  const wordCount = freeWrite.trim().split(/\s+/).filter(Boolean).length;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/calendar"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold">WriteWell</h1>
        </div>
        <div className="text-neutral-600">{today}</div>
      </header>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                1
              </span>
              <h2 className="text-lg font-medium">Key points</h2>
            </div>
            <span className="text-sm text-neutral-500">Outline your thoughts</span>
          </div>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="Write your key points here. Each line or sentence is a point — jot down what's on your mind before you expand."
            className="w-full px-6 py-6 text-neutral-700 placeholder:text-neutral-400 resize-none focus:outline-none min-h-[240px]"
          />
        </section>

        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                2
              </span>
              <h2 className="text-lg font-medium">Free write</h2>
            </div>
            <span className="text-sm text-neutral-500">Expand in full sentences</span>
          </div>
          <textarea
            value={freeWrite}
            onChange={(e) => setFreeWrite(e.target.value)}
            placeholder="Write freely here. Expand on your key points, share details, tell the full story — don't worry about grammar yet."
            className="w-full px-6 py-6 text-neutral-700 placeholder:text-neutral-400 resize-none focus:outline-none min-h-[320px]"
          />
          <div className="px-6 py-3 text-sm text-neutral-500 border-t border-neutral-100">
            {wordCount} words
          </div>
        </section>

        <div className="flex justify-center pt-4">
          <button
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
              freeWrite.trim()
                ? "bg-neutral-900 text-white hover:bg-neutral-800"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            )}
            disabled={!freeWrite.trim()}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Refine with AI
          </button>
        </div>
      </div>
    </div>
  );
}
