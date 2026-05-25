import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { FamilyMember } from '@/lib/types'

// Harris-Benedict equation for BMR
function calcDailyCalories(member: Omit<FamilyMember, 'id' | 'dailyCalories'>): number {
  // Base: ~2000 kcal, adjusted by goal
  const base = 2000
  if (member.goal === 'lose') return base - 300
  if (member.goal === 'gain') return base + 300
  return base
}

export async function GET(req: NextRequest) {
  const familyId = req.nextUrl.searchParams.get('familyId')
  if (!familyId) {
    // Return all families
    const { data, error } = await supabase.from('nutri_families').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data: family } = await supabase.from('nutri_families').select('*').eq('id', familyId).single()
  const { data: members } = await supabase.from('nutri_family_members').select('*').eq('family_id', familyId)

  return NextResponse.json({ ...family, members: members || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { familyName, members }: { familyName: string; members: Omit<FamilyMember, 'id' | 'dailyCalories'>[] } = body

  // Create family
  const { data: family, error: familyError } = await supabase
    .from('nutri_families')
    .insert({ name: familyName })
    .select()
    .single()

  if (familyError) return NextResponse.json({ error: familyError.message }, { status: 500 })

  // Create members
  if (members?.length > 0) {
    const membersToInsert = members.map(m => ({
      family_id: family.id,
      name: m.name,
      age: m.age,
      weight: m.weight,
      height: m.height,
      goal: m.goal,
      daily_calories: calcDailyCalories(m),
    }))
    const { error: membersError } = await supabase.from('nutri_family_members').insert(membersToInsert)
    if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  return NextResponse.json({ id: family.id, success: true })
}
