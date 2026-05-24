'use client'
import { useState, useRef, useCallback } from 'react'
import MacroPieChart from '@/components/MacroPieChart'
import { calcTotals, calcMacroPercent, estimateWeight, calcNutritionForItem } from '@/lib/nutrition'
import type { ReceiptItem, Receipt, FamilyMember } from '@/lib/types'

type Step = 'idle' | 'ocr' | 'nutrition' | 'recommendations' | 'done' | 'error'

interface ParsedReceipt {
  store: string
  date: string
  currency: string
  total: number
  items: { name: string; nameEn: string; quantity: number; unit: string; price: number }[]
}

export default function UploadPage() {
  const [step, setStep] = useState<Step>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileObj = useRef<File | null>(null)

  const processFile = useCallback(async (file: File) => {
    fileObj.current = file
    setPreview(URL.createObjectURL(file))
    setStep('ocr')
    setProgress(5)
    setError('')

    try {
      // Step 1: OCR
      const fd = new FormData()
      fd.append('receipt', file)
      const ocrRes = await fetch('/api/analyze-receipt', { method: 'POST', body: fd })
      if (!ocrRes.ok) throw new Error('OCR failed')
      const parsed: ParsedReceipt = await ocrRes.json()
      setProgress(30)

      // Step 2: Nutrition lookup (parallel, with progress)
      setStep('nutrition')
      const enriched: ReceiptItem[] = []
      let done = 0

      await Promise.all(
        parsed.items.map(async (item, i) => {
          const weightGrams = estimateWeight(item.name, item.quantity, item.unit)
          try {
            const nRes = await fetch('/api/nutrition', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: item.name, nameEn: item.nameEn }),
            })
            const nData = await nRes.json()
            const totalsForItem = nData.per100g
              ? calcNutritionForItem(nData.per100g, weightGrams)
              : undefined

            enriched[i] = {
              id: crypto.randomUUID(),
              name: item.nameEn || item.name,
              quantity: item.quantity,
              unit: item.unit,
              weightGrams,
              price: item.price,
              nutrition: totalsForItem && nData.per100g ? {
                ...totalsForItem,
                per100g: nData.per100g,
                source: nData.source,
                productName: nData.productName,
              } : undefined,
            }
          } catch {
            enriched[i] = {
              id: crypto.randomUUID(),
              name: item.nameEn || item.name,
              quantity: item.quantity,
              unit: item.unit,
              weightGrams,
              price: item.price,
            }
          }
          done++
          setProgress(30 + Math.round((done / parsed.items.length) * 45))
        })
      )
      setProgress(75)

      // Step 3: Calc totals
      const totals = calcTotals(enriched)
      const macroPercent = calcMacroPercent(totals)

      // Step 4: Recommendations
      setStep('recommendations')
      const recRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totals, macroPercent,
          items: enriched.map(i => ({ name: i.name, nameEn: i.name, nutrition: i.nutrition })),
          members: [] as FamilyMember[],
          store: parsed.store,
        }),
      })
      const { recommendations } = await recRes.json()
      setProgress(95)

      // Step 5: Save to Supabase
      const finalReceipt: Receipt = {
        id: crypto.randomUUID(),
        family_id: '',
        store: parsed.store,
        date: parsed.date,
        total: parsed.total,
        currency: parsed.currency,
        items: enriched,
        totalNutrition: totals,
        macroPercent,
        recommendations,
        created_at: new Date().toISOString(),
      }

      // Save to localStorage for now (Supabase requires auth setup)
      const history = JSON.parse(localStorage.getItem('receipts') || '[]')
      history.unshift(finalReceipt)
      localStorage.setItem('receipts', JSON.stringify(history.slice(0, 20)))

      setReceipt(finalReceipt)
      setStep('done')
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обработки')
      setStep('error')
    }
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  const stepLabel: Record<Step, string> = {
    idle: '',
    ocr: '🔍 Распознаю чек...',
    nutrition: '🥦 Ищу данные о питательности...',
    recommendations: '🤖 Готовлю рекомендации...',
    done: '',
    error: '',
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white font-['DM_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap');
        .glow { box-shadow: 0 0 40px rgba(46,196,182,0.12); }
        .tag { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes fade-up { from { opacity:0;transform:translateY(12px); } to { opacity:1;transform:translateY(0); } }
        .fade-up { animation: fade-up 0.4s ease forwards; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <header className="px-6 py-5 border-b border-white/8 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2ec4b6]/20 flex items-center justify-center text-[#2ec4b6] text-lg">🥗</div>
          <span className="font-semibold text-white/90 tracking-tight">NutriCheck</span>
        </div>
        <a href="/history" className="text-sm text-white/40 hover:text-white/70 transition-colors">История →</a>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Upload zone */}
        {step === 'idle' && (
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
              ${dragging ? 'border-[#2ec4b6] bg-[#2ec4b6]/5' : 'border-white/15 hover:border-white/30 hover:bg-white/2'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">🧾</div>
              <div>
                <p className="text-white/80 font-medium text-lg">Загрузи фото чека</p>
                <p className="text-white/40 text-sm mt-1">JPG, PNG, WEBP · Любой магазин · Любой язык</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {['Netto', 'Lidl', 'Aldi', 'Rewe', 'ATB', 'Silpo', 'Novus'].map(s => (
                  <span key={s} className="tag bg-white/6 text-white/40">{s}</span>
                ))}
                <span className="tag bg-white/6 text-white/40">+ любой другой</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        )}

        {/* Processing state */}
        {['ocr', 'nutrition', 'recommendations'].includes(step) && (
          <div className="fade-up rounded-2xl bg-white/4 border border-white/10 p-8 flex flex-col items-center gap-6">
            <div className="w-14 h-14 rounded-full border-2 border-[#2ec4b6]/30 border-t-[#2ec4b6] spin" />
            <div className="text-center">
              <p className="text-white/90 font-medium text-lg pulse">{stepLabel[step]}</p>
              <p className="text-white/40 text-sm mt-1">{progress}% выполнено</p>
            </div>
            <div className="w-full max-w-xs bg-white/8 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-[#2ec4b6] transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
            {preview && (
              <img src={preview} className="w-32 h-32 object-cover rounded-xl opacity-40" alt="receipt" />
            )}
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="fade-up rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center space-y-3">
            <p className="text-red-400 font-medium">⚠️ {error || 'Что-то пошло не так'}</p>
            <button onClick={() => { setStep('idle'); setPreview(null) }}
              className="text-sm text-white/50 hover:text-white/80 underline">Попробовать снова</button>
          </div>
        )}

        {/* Results */}
        {step === 'done' && receipt && (
          <div className="fade-up space-y-6">
            {/* Store header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{receipt.store}</h1>
                <p className="text-white/40 text-sm mt-0.5">
                  {receipt.date || 'Сегодня'} · {receipt.total} {receipt.currency} · {receipt.items.length} товаров
                </p>
              </div>
              <button onClick={() => { setStep('idle'); setPreview(null); setReceipt(null) }}
                className="text-xs text-white/40 hover:text-white/70 border border-white/15 rounded-lg px-3 py-1.5 transition-colors">
                Новый чек
              </button>
            </div>

            {/* Macro charts */}
            <div className="rounded-2xl bg-white/4 border border-white/10 p-6 glow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/40 uppercase tracking-widest">Баланс БЖУ</span>
                <span className="tag bg-white/6 text-white/40">ВОЗ норма</span>
              </div>
              <MacroPieChart
                actual={receipt.macroPercent}
                totals={receipt.totalNutrition}
              />
            </div>

            {/* Recommendations */}
            {receipt.recommendations && (
              <div className="rounded-2xl bg-[#2ec4b6]/8 border border-[#2ec4b6]/20 p-5">
                <p className="text-xs text-[#2ec4b6]/70 uppercase tracking-widest mb-2">Рекомендации ИИ</p>
                <p className="text-white/80 text-sm leading-relaxed">{receipt.recommendations}</p>
              </div>
            )}

            {/* Products table */}
            <div className="rounded-2xl bg-white/4 border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/8">
                <p className="text-xs text-white/40 uppercase tracking-widest">Состав корзины</p>
              </div>
              <div className="divide-y divide-white/6">
                {receipt.items
                  .filter(i => i.nutrition)
                  .sort((a, b) => (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0))
                  .map(item => (
                    <div key={item.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/2 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/85 truncate">{item.name}</p>
                        <p className="text-xs text-white/35">{item.weightGrams}г</p>
                      </div>
                      <div className="flex gap-4 text-xs font-mono text-right shrink-0">
                        <span className="text-white/50 w-16">{item.nutrition?.calories} ккал</span>
                        <span style={{ color: '#e9c46a' }} className="w-12 hidden sm:block">Б {item.nutrition?.protein}г</span>
                        <span style={{ color: '#ff9f1c' }} className="w-12 hidden sm:block">Ж {item.nutrition?.fat}г</span>
                        <span style={{ color: '#2ec4b6' }} className="w-12 hidden sm:block">У {item.nutrition?.carbs}г</span>
                        {item.nutrition?.source === 'estimated' && (
                          <span className="tag bg-amber-500/10 text-amber-400/70">~ест.</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              {/* Totals row */}
              <div className="px-5 py-4 bg-white/3 flex items-center gap-4 border-t border-white/10">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/90">Итого</p>
                </div>
                <div className="flex gap-4 text-sm font-mono text-right shrink-0">
                  <span className="text-white/80 w-16">{Math.round(receipt.totalNutrition.calories)} ккал</span>
                  <span style={{ color: '#e9c46a' }} className="w-12 hidden sm:block">Б {receipt.totalNutrition.protein}г</span>
                  <span style={{ color: '#ff9f1c' }} className="w-12 hidden sm:block">Ж {receipt.totalNutrition.fat}г</span>
                  <span style={{ color: '#2ec4b6' }} className="w-12 hidden sm:block">У {receipt.totalNutrition.carbs}г</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
