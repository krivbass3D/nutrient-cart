export interface FamilyMember {
  id: string
  name: string
  age: number
  weight: number
  height: number
  goal: 'maintain' | 'lose' | 'gain'
  dailyCalories: number
}

export interface Family {
  id: string
  name: string
  members: FamilyMember[]
  created_at: string
}

export interface NutritionPer100g {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface NutritionData {
  calories: number
  protein: number
  fat: number
  carbs: number
  per100g: NutritionPer100g
  source: 'openfoodfacts' | 'estimated'
  productName?: string
}

export interface ReceiptItem {
  id: string
  name: string
  quantity: number
  unit: string
  weightGrams: number
  price: number
  nutrition?: NutritionData
}

export interface TotalNutrition {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface MacroPercent {
  proteinPct: number
  fatPct: number
  carbsPct: number
}

export interface Receipt {
  id: string
  family_id: string
  store: string
  date: string
  total: number
  currency: string
  items: ReceiptItem[]
  totalNutrition: TotalNutrition
  macroPercent: MacroPercent
  recommendations: string
  created_at: string
}

// WHO daily reference values
export const RECOMMENDED_MACROS: MacroPercent = {
  carbsPct: 55,
  fatPct: 25,
  proteinPct: 20,
}

export const RECOMMENDED_DAILY: TotalNutrition = {
  calories: 2000,
  protein: 50,
  fat: 65,
  carbs: 300,
}
