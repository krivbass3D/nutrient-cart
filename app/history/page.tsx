'use client'
import { useEffect, useState } from 'react'
import type { Receipt } from '@/lib/types'
import { RECOMMENDED_MACROS } from '@/lib/types'

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('receipts') || '[]')
    setReceipts(stored)
  }, [])

  const totalCalories = receipts.slice(0, 7).reduce((sum, r) => sum + r.totalNutrition.calories, 0)
  const avgMacros = receipts.slice(0, 7).reduce(
    (acc, r) => ({
      p: acc.p + r.macroPercent.proteinPct,
      f: acc.f + r.macroPercent.fatPct,
      c: acc.c + r.macroPercent.carbsPct,
    }),
    { p: 0, f: 0, c: 0 }
  )
  const count = Math.max(1, receipts.slice(0, 7).length)

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white font-['DM_Sans',sans-serif]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <header className="px-6 py-5 border-b border-white/8 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2ec4b6]/20 flex items-center justify-center text-[#2ec4b6] text-lg">🥗</div>
          <span className="font-semibold text-white/90 tracking-tight">NutriCheck</span>
        </div>
        <a href="/upload" className="text-sm bg-[#2ec4b6] text-[#0d0d1a] font-semibold px-4 py-2 rounded-xl hover:bg-[#2ec4b6]/90 transition-colors">
          + Новый чек
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-2xl font-semibold">История покупок</h1>

        {receipts.length === 0 ? (
          <div className="rounded-2xl bg-white/4 border border-white/10 p-12 text-center">
            <p className="text-white/30 text-sm">Пока нет загруженных чеков</p>
            <a href="/upload" className="mt-4 inline-block text-sm text-[#2ec4b6] hover:underline">Загрузить первый →</a>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Чеков', value: receipts.length, unit: '' },
                { label: 'Калорий (ср.)', value: Math.round(totalCalories / count), unit: 'ккал' },
                { label: 'Белки (ср.)', value: `${Math.round(avgMacros.p / count)}%`, unit: `→${RECOMMENDED_MACROS.proteinPct}%` },
                { label: 'Углеводы (ср.)', value: `${Math.round(avgMacros.c / count)}%`, unit: `→${RECOMMENDED_MACROS.carbsPct}%` },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-white/4 border border-white/10 p-4">
                  <p className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-semibold mt-1">{stat.value}</p>
                  {stat.unit && <p className="text-xs text-white/30">{stat.unit}</p>}
                </div>
              ))}
            </div>

            {/* Receipt list */}
            <div className="space-y-3">
              {receipts.map(r => (
                <div key={r.id} className="rounded-2xl bg-white/4 border border-white/10 p-5 hover:bg-white/6 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white/90">{r.store}</p>
                        <span className="text-xs text-white/30">{r.date}</span>
                      </div>
                      <p className="text-sm text-white/40 mt-1">
                        {r.items.length} товаров · {r.total} {r.currency}
                      </p>
                      {r.recommendations && (
                        <p className="text-xs text-white/40 mt-2 line-clamp-2 leading-relaxed">{r.recommendations}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold font-mono">{Math.round(r.totalNutrition.calories)}</p>
                      <p className="text-xs text-white/30">ккал</p>
                      <div className="flex gap-1.5 mt-2 justify-end">
                        {[
                          { v: r.macroPercent.proteinPct, r: RECOMMENDED_MACROS.proteinPct, c: '#e9c46a' },
                          { v: r.macroPercent.fatPct, r: RECOMMENDED_MACROS.fatPct, c: '#ff9f1c' },
                          { v: r.macroPercent.carbsPct, r: RECOMMENDED_MACROS.carbsPct, c: '#2ec4b6' },
                        ].map((m, i) => (
                          <span key={i} className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${Math.abs(m.v - m.r) <= 5 ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {m.v}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
