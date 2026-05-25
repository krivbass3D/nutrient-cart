import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface OFF_Product {
  product_name?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    fat_100g?: number
    carbohydrates_100g?: number
  }
}

async function lookupOpenFoodFacts(query: string): Promise<OFF_Product | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=3&fields=product_name,nutriments`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    const data = await res.json()
    const products: OFF_Product[] = data.products || []
    return products.find(p => p.nutriments?.['energy-kcal_100g'] !== undefined) || null
  } catch {
    return null
  }
}

async function estimateWithGPT(productName: string, nameEn: string): Promise<{
  calories: number; protein: number; fat: number; carbs: number
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 60,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Estimate typical nutritional values per 100g for: "${nameEn}" (original: "${productName}")
Return ONLY JSON in this format: {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}
Use standard food database values. Round to 1 decimal.`,
    }],
  })
  const text = response.choices[0]?.message?.content || '{}'
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean)
}

export async function POST(req: NextRequest) {
  try {
    const { name, nameEn } = await req.json()

    // 1. Try Open Food Facts with English name
    let product = await lookupOpenFoodFacts(nameEn || name)
    // 2. Fallback to original name
    if (!product) product = await lookupOpenFoodFacts(name)

    if (product?.nutriments) {
      const n = product.nutriments
      return NextResponse.json({
        source: 'openfoodfacts',
        productName: product.product_name || nameEn || name,
        per100g: {
          calories: Math.round(n['energy-kcal_100g'] || 0),
          protein: Math.round((n.proteins_100g || 0) * 10) / 10,
          fat: Math.round((n.fat_100g || 0) * 10) / 10,
          carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
        },
      })
    }

    // 3. Fallback: GPT estimation
    const estimated = await estimateWithGPT(name, nameEn || name)
    return NextResponse.json({
      source: 'estimated',
      productName: nameEn || name,
      per100g: estimated,
    })
  } catch (err) {
    console.error('nutrition lookup error:', err)
    return NextResponse.json({ error: 'Nutrition lookup failed' }, { status: 500 })
  }
}
