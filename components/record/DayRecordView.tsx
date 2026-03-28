'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO, addDays, subDays } from 'date-fns';
import type { DayRecord } from '@/types/record';

type DayRecordViewProps = {
  date: string;
};

export function DayRecordView({ date }: DayRecordViewProps) {
  const [record, setRecord] = useState<DayRecord | null>(null);

  const dateObj = parseISO(date);
  const prevDate = format(subDays(dateObj, 1), 'yyyy-MM-dd');
  const nextDate = format(addDays(dateObj, 1), 'yyyy-MM-dd');

  const displayDate = format(dateObj, 'EEEE, MMMM d');

  // Mock data for now
  const wordCount = 103;
  const refinementCount = 2;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">WriteWell</h1>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full">
            4 day streak
          </span>
        </div>
        <Link
          href="/calendar"
          className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Calendar
        </Link>
      </header>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">{displayDate}</h2>
          <p className="text-sm text-neutral-600">
            {wordCount} words · {refinementCount} refinements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/day/${prevDate}`}
            className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link
            href={`/day/${nextDate}`}
            className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key points section */}
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                1
              </span>
              <h3 className="text-lg font-medium">Key points</h3>
            </div>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded">
              read only
            </span>
          </div>
          <div className="px-6 py-6 text-neutral-700 leading-relaxed">
            <ul className="space-y-2">
              <li>- Went to a new coffee shop in the morning</li>
              <li>- Had a productive meeting with my team</li>
              <li>- Tried cooking a new recipe for dinner</li>
              <li>- Feeling more confident speaking English</li>
            </ul>
          </div>
        </section>

        {/* Free write section */}
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                2
              </span>
              <h3 className="text-lg font-medium">Free write</h3>
            </div>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded">
              read only
            </span>
          </div>
          <div className="px-6 py-6 text-neutral-700 leading-relaxed">
            <p>
              Today was a good day overall. I waked up early and decide to try a new coffee shop near my
              apartment. The place was very cozy and quiet, so I stay there for about one hour and read my
              book. In the afternoon I have a meeting with my team at work. We discussed about our new
              project and I tried to speak more in English during the meeting. I think I did okay but I still make
              some mistake with grammar. For dinner, I cooked a pasta dish that I find on the internet. It was
              delicious! I am proud of myself.
            </p>
          </div>
          <div className="px-6 py-3 text-sm text-neutral-500 border-t border-neutral-100">
            {wordCount} words
          </div>
        </section>

        {/* Refinement chain */}
        <div className="flex justify-center py-4">
          <div className="w-px h-8 bg-neutral-300" />
        </div>

        {/* Version 1 */}
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                3
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                Version 1
              </span>
            </div>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded">
              read only
            </span>
          </div>
          <div className="px-6 py-6 text-neutral-700 leading-relaxed">
            <p>
              Today was a good day overall. I woke up early and decided to try a new coffee shop near my
              apartment. The place was very cozy and quiet, so I stayed there for about an hour and read my
              book. In the afternoon, I had a meeting with my team at work. We discussed our new project
              and I tried to speak more in English during the meeting. I think I did okay, but I still made some
              mistakes with grammar. For dinner, I cooked a pasta dish that I found online. It was delicious! I
              am proud of myself.
            </p>
          </div>
          <div className="px-6 py-4 border-t border-neutral-100 flex justify-end">
            <button className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium">
              Copy
            </button>
          </div>
        </section>

        <div className="flex justify-center py-4">
          <div className="w-px h-8 bg-neutral-300" />
        </div>

        {/* Version 2 */}
        <section className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                4
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                Version 2
              </span>
            </div>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded">
              read only
            </span>
          </div>
          <div className="px-6 py-6 text-neutral-700 leading-relaxed">
            <p>
              Today was a genuinely good day. I woke up early and decided to visit a new coffee shop near
              my apartment — the place was cozy and quiet, so I settled in for about an hour with my book.
              In the afternoon, I had a productive team meeting where we discussed our new project. I made
              a conscious effort to speak more in English throughout, and while I still stumbled over a few
              grammatical points, I felt I held my own. For dinner, I tried a pasta recipe I found online, and it
              turned out wonderfully. All in all, a day worth feeling proud of.
            </p>
          </div>
          <div className="px-6 py-4 border-t border-neutral-100 flex justify-end">
            <button className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium">
              Copy
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
