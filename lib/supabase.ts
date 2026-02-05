import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[v0] Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: 'admin' | 'input' | 'reader'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      supir: {
        Row: {
          id: string
          nama: string
          nama_pt: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['supir']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['supir']['Insert']>
      }
      truck: {
        Row: {
          id: string
          nomor_polisi: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['truck']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['truck']['Insert']>
      }
      material: {
        Row: {
          id: string
          nama_material: string
          satuan: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['material']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['material']['Insert']>
      }
      rute: {
        Row: {
          id: string
          nama_rute: string
          uang_jalan: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rute']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rute']['Insert']>
      }
      surat_jalan: {
        Row: {
          id: string
          nomor_surat_jalan: string
          tanggal_surat_jalan: string
          truck_id: string
          supir_id: string
          rute_id: string
          material_id: string
          kuantitas_pengisian: number
          satuan: string
          status: 'pending' | 'terkirim' | 'gagal'
          tanggal_pengiriman: string | null
          kuantitas_terkirim: number | null
          nomor_invoice: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['surat_jalan']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['surat_jalan']['Insert']>
      }
    }
  }
}
