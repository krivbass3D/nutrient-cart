import type { TotalNutrition, MacroPercent, ReceiptItem, NutritionData } from './types'

export function calcTotals(items: ReceiptItem[]): TotalNutrition {
  return items.reduce(
    (acc, item) => {
      if (!item.nutrition) return acc
      return {
        calories: acc.calories + item.nutrition.calories,
        protein: acc.protein + item.nutrition.protein,
        fat: acc.fat + item.nutrition.fat,
        carbs: acc.carbs + item.nutrition.carbs,
      }
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

export function calcMacroPercent(totals: TotalNutrition): MacroPercent {
  const sum = totals.protein + totals.fat + totals.carbs
  if (sum === 0) return { proteinPct: 0, fatPct: 0, carbsPct: 0 }
  return {
    proteinPct: Math.round((totals.protein / sum) * 100),
    fatPct: Math.round((totals.fat / sum) * 100),
    carbsPct: Math.round((totals.carbs / sum) * 100),
  }
}

// Estimate grams from receipt item name and quantity
export function estimateWeight(name: string, quantity: number, unit: string): number {
  const lowerName = name.toLowerCase()
  const lowerUnit = unit.toLowerCase()

  if (lowerUnit.includes('kg') || lowerUnit.includes('кг')) return quantity * 1000
  if (lowerUnit.includes('g') || lowerUnit.includes('г')) return quantity

  // Try to extract weight from product name (e.g. "Almigurt 150g", "H-Milch 1L")
  const gramMatch = lowerName.match(/(\d+(?:[.,]\d+)?)\s*g\b/)
  if (gramMatch) return parseFloat(gramMatch[1].replace(',', '.')) * quantity

  const kgMatch = lowerName.match(/(\d+(?:[.,]\d+)?)\s*kg\b/)
  if (kgMatch) return parseFloat(kgMatch[1].replace(',', '.')) * 1000 * quantity

  const literMatch = lowerName.match(/(\d+(?:[.,]\d+)?)\s*[lл]\b/)
  if (literMatch) return parseFloat(literMatch[1].replace(',', '.')) * 1000 * quantity

  const mlMatch = lowerName.match(/(\d+(?:[.,]\d+)?)\s*ml\b/)
  if (mlMatch) return parseFloat(mlMatch[1].replace(',', '.')) * quantity

  // Default: assume 250g for unknown items
  return 250 * quantity
}

export function calcNutritionForItem(
  per100g: NutritionData['per100g'],
  weightGrams: number
): Pick<NutritionData, 'calories' | 'protein' | 'fat' | 'carbs'> {
  const factor = weightGrams / 100
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    fat: Math.round(per100g.fat * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
  }
}

export function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals)
}
