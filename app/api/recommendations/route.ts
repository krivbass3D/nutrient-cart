import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { TotalNutrition, MacroPercent, FamilyMember } from '@/lib/types'
import { RECOMMENDED_MACROS } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const {
      totals,
      macroPercent,
      items,
      members,
      store,
    }: {
      totals: TotalNutrition
      macroPercent: MacroPercent
      items: { name: string; nameEn: string; nutrition?: { calories: number; protein: number; fat: number; carbs: number } }[]
      members: FamilyMember[]
      store: string
    } = await req.json()

    const membersDesc = members.length > 0
      ? members.map(m => `${m.name} (${m.age}y, ${m.weight}kg, goal: ${m.goal})`).join(', ')
      : 'family (no specific profiles set)'

    const topItems = items
      .filter(i => i.nutrition)
      .sort((a, b) => (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0))
      .slice(0, 5)
      .map(i => `${i.nameEn || i.name}: ${i.nutrition?.calories}kcal, ${i.nutrition?.protein}g prot, ${i.nutrition?.fat}g fat, ${i.nutrition?.carbs}g carbs`)
      .join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'You are a friendly nutrition advisor. Give practical, specific advice in Russian. Be warm and motivating.',
        },
        {
          role: 'user',
          content: `Analyze this grocery purchase and give practical advice.

FAMILY: ${membersDesc}
STORE: ${store}

PURCHASED MACROS (total for all items):
- Calories: ${Math.round(totals.calories)} kcal
- Protein: ${totals.protein}g (${macroPercent.proteinPct}% of macros)
- Fat: ${totals.fat}g (${macroPercent.fatPct}% of macros)
- Carbs: ${totals.carbs}g (${macroPercent.carbsPct}% of macros)

WHO RECOMMENDED: Protein ${RECOMMENDED_MACROS.proteinPct}% / Fat ${RECOMMENDED_MACROS.fatPct}% / Carbs ${RECOMMENDED_MACROS.carbsPct}%

TOP CALORIE ITEMS:
${topItems}

Write 3-4 sentences of practical nutrition advice in Russian. Be specific about:
1. What's good in this purchase (if anything)
2. What macro is imbalanced and by how much
3. One specific actionable suggestion (which product to add or reduce)
Keep it friendly and motivating. No bullet points, just natural flowing text.`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content || ''
    return NextResponse.json({ recommendations: text })
  } catch (err) {
    console.error('recommendations error:', err)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
