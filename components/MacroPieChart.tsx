'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MacroPercent, TotalNutrition } from '@/lib/types'
import { RECOMMENDED_MACROS } from '@/lib/types'

const COLORS = {
  carbs: '#2ec4b6',
  fat: '#ff9f1c',
  protein: '#e9c46a',
}

interface Props {
  actual?: MacroPercent
  totals?: TotalNutrition
  size?: number
}

function buildData(pct: MacroPercent) {
  return [
    { name: 'Углеводы', value: pct.carbsPct, color: COLORS.carbs },
    { name: 'Жиры', value: pct.fatPct, color: COLORS.fat },
    { name: 'Белки', value: pct.proteinPct, color: COLORS.protein },
  ]
}

function EmptyPie({ size = 180 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={size / 2 - 8}
        fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}
      />
      <line x1={size / 2} y1={8} x2={size / 2} y2={size - 8} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <line x1={8} y1={size / 2} x2={size - 8} y2={size / 2} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <line
        x1={size / 2 - (size / 2 - 8) * 0.866}
        y1={size / 2 - (size / 2 - 8) * 0.5}
        x2={size / 2 + (size / 2 - 8) * 0.866}
        y2={size / 2 + (size / 2 - 8) * 0.5}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1}
      />
    </svg>
  )
}

export default function MacroPieChart({ actual, totals, size = 180 }: Props) {
  const recommended = buildData(RECOMMENDED_MACROS)
  const actualData = actual ? buildData(actual) : null

  return (
    <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">
      {/* Legend */}
      <div className="flex gap-6 sm:hidden">
        {[
          { label: 'Углеводы', color: COLORS.carbs },
          { label: 'Жиры', color: COLORS.fat },
          { label: 'Белки', color: COLORS.protein },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            <span className="text-xs text-white/60">{label}</span>
          </div>
        ))}
      </div>

      {/* Recommended chart */}
      <div className="flex flex-col items-center gap-3">
        <ResponsiveContainer width={size} height={size}>
          <PieChart>
            <Pie data={recommended} cx="50%" cy="50%" outerRadius={size / 2 - 8}
              dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
              {recommended.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
              formatter={(val: number) => [`${val}%`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest">Рекомендуемое</p>
          <div className="flex gap-3 mt-1 justify-center">
            {recommended.map(d => (
              <span key={d.name} className="text-xs font-mono" style={{ color: d.color }}>
                {d.value}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actual chart */}
      <div className="flex flex-col items-center gap-3">
        {actualData ? (
          <ResponsiveContainer width={size} height={size}>
            <PieChart>
              <Pie data={actualData} cx="50%" cy="50%" outerRadius={size / 2 - 8}
                dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                {actualData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={(val: number) => [`${val}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyPie size={size} />
        )}
        <div className="text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest">Фактическое</p>
          {actualData ? (
            <div className="flex gap-3 mt-1 justify-center">
              {actualData.map(d => (
                <span key={d.name} className="text-xs font-mono" style={{ color: d.color }}>
                  {d.value}%
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 mt-1">загрузи чек</p>
          )}
        </div>
      </div>

      {/* Legend desktop */}
      <div className="hidden sm:flex flex-col gap-2">
        {[
          { label: 'Углеводы', color: COLORS.carbs, rec: RECOMMENDED_MACROS.carbsPct, act: actual?.carbsPct },
          { label: 'Жиры', color: COLORS.fat, rec: RECOMMENDED_MACROS.fatPct, act: actual?.fatPct },
          { label: 'Белки', color: COLORS.protein, rec: RECOMMENDED_MACROS.proteinPct, act: actual?.proteinPct },
        ].map(({ label, color, rec, act }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-sm text-white/70 w-24">{label}</span>
            <span className="text-xs text-white/40 font-mono w-10">→{rec}%</span>
            {act !== undefined && (
              <span className={`text-xs font-mono w-10 font-semibold ${
                Math.abs(act - rec) <= 5 ? 'text-green-400' : 'text-amber-400'
              }`}>{act}%</span>
            )}
          </div>
        ))}
        {totals && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-white/40">Итого в корзине</p>
            <p className="text-lg font-bold text-white mt-1">{Math.round(totals.calories)} <span className="text-xs text-white/40">ккал</span></p>
            <p className="text-xs text-white/50">Б: {totals.protein}г · Ж: {totals.fat}г · У: {totals.carbs}г</p>
          </div>
        )}
      </div>
    </div>
  )
}
