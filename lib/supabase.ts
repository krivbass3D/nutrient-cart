import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      families: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string }
        Update: { name?: string }
      }
      family_members: {
        Row: {
          id: string; family_id: string; name: string
          age: number; weight: number; height: number
          goal: string; daily_calories: number; created_at: string
        }
        Insert: {
          family_id: string; name: string; age: number
          weight: number; height: number; goal: string; daily_calories: number
        }
        Update: Partial<Database['public']['Tables']['family_members']['Insert']>
      }
      receipts: {
        Row: {
          id: string; family_id: string; store: string; date: string
          total: number; currency: string; items: string
          total_nutrition: string; macro_percent: string
          recommendations: string; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
    }
  }
}
