import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type || 'image/jpeg'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `Analyze this grocery receipt and extract all items.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "store": "store name",
  "date": "YYYY-MM-DD or empty string",
  "currency": "EUR or detected currency",
  "total": 0.00,
  "items": [
    {
      "name": "product name in original language",
      "nameEn": "product name translated to English",
      "quantity": 1,
      "unit": "pcs",
      "price": 0.00
    }
  ]
}

Rules:
- Include ALL food/drink items only (skip deposit fees, bags, non-food)
- Keep original product name AND provide English translation
- For quantity: if receipt shows "2x 0.29" then quantity=2, price=0.29
- For unit: use "pcs", "g", "kg", "ml", "l" based on product type
- Estimate unit from product name if possible (e.g. "150g" → unit="g", quantity=150)
- date: extract from receipt or leave empty string`,
            },
          ],
        },
      ],
    })

    const text = response.choices[0]?.message?.content || ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('analyze-receipt error:', err)
    return NextResponse.json({ error: 'Failed to analyze receipt' }, { status: 500 })
  }
}
