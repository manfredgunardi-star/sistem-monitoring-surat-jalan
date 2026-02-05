import { supabase } from './supabase'
import type { Supir, Truck, Material, Rute, SuratJalan, User, TransaksiKas, SaldoKas } from '@/types'

// Helper function to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    acc[camelKey] = toCamelCase(obj[key])
    return acc
  }, {} as any)
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    acc[snakeKey] = toSnakeCase(obj[key])
    return acc
  }, {} as any)
}

// Supir Service (localStorage fallback)
const SUPIR_STORAGE_KEY = 'supir_data'

const getSupirFromStorage = (): Supir[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(SUPIR_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveSupirToStorage = (data: Supir[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(SUPIR_STORAGE_KEY, JSON.stringify(data))
}

export const supirService = {
  getAll: async (): Promise<Supir[]> => {
    console.log('[v0] getAll supir - using localStorage')
    return getSupirFromStorage().sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  },

  getActive: async (): Promise<Supir[]> => {
    const all = getSupirFromStorage()
    return all.filter(s => s.isActive).sort((a, b) => a.nama.localeCompare(b.nama))
  },

  getById: async (id: string): Promise<Supir | null> => {
    const all = getSupirFromStorage()
    return all.find(s => s.id === id) || null
  },

  create: async (data: Omit<Supir, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supir> => {
    console.log('[v0] Creating supir - using localStorage')
    const all = getSupirFromStorage()
    const newSupir: Supir = {
      ...data,
      id: `supir-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: `supir${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.push(newSupir)
    saveSupirToStorage(all)
    return newSupir
  },

  update: async (id: string, updates: Partial<Supir>): Promise<Supir> => {
    const all = getSupirFromStorage()
    const index = all.findIndex(s => s.id === id)
    if (index === -1) throw new Error('Supir not found')
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() }
    saveSupirToStorage(all)
    return all[index]
  },

  delete: async (id: string): Promise<void> => {
    const all = getSupirFromStorage()
    const filtered = all.filter(s => s.id !== id)
    saveSupirToStorage(filtered)
  },

  bulkCreate: async (data: Omit<Supir, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Supir[]> => {
    console.log('[v0] Bulk creating supir - using localStorage')
    const all = getSupirFromStorage()
    const newSupirs: Supir[] = data.map(item => ({
      ...item,
      id: `supir-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: `supir${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    all.push(...newSupirs)
    saveSupirToStorage(all)
    return newSupirs
  },
}

// Truck Service (localStorage fallback)
const TRUCK_STORAGE_KEY = 'truck_data'

const getTruckFromStorage = (): Truck[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TRUCK_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveTruckToStorage = (data: Truck[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TRUCK_STORAGE_KEY, JSON.stringify(data))
}

export const truckService = {
  getAll: async (): Promise<Truck[]> => {
    console.log('[v0] getAll truck - using localStorage')
    return getTruckFromStorage().sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  },

  getActive: async (): Promise<Truck[]> => {
    const all = getTruckFromStorage()
    return all.filter(t => t.isActive).sort((a, b) => a.nomorPolisi.localeCompare(b.nomorPolisi))
  },

  getById: async (id: string): Promise<Truck | null> => {
    const all = getTruckFromStorage()
    return all.find(t => t.id === id) || null
  },

  create: async (data: Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Truck> => {
    console.log('[v0] Creating truck - using localStorage')
    const all = getTruckFromStorage()
    const newTruck: Truck = {
      ...data,
      id: `truck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.push(newTruck)
    saveTruckToStorage(all)
    return newTruck
  },

  update: async (id: string, updates: Partial<Truck>): Promise<Truck> => {
    const all = getTruckFromStorage()
    const index = all.findIndex(t => t.id === id)
    if (index === -1) throw new Error('Truck not found')
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() }
    saveTruckToStorage(all)
    return all[index]
  },

  delete: async (id: string): Promise<void> => {
    const all = getTruckFromStorage()
    const filtered = all.filter(t => t.id !== id)
    saveTruckToStorage(filtered)
  },

  bulkCreate: async (data: Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Truck[]> => {
    console.log('[v0] Bulk creating truck - using localStorage')
    const all = getTruckFromStorage()
    const newTrucks: Truck[] = data.map(item => ({
      ...item,
      id: `truck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    all.push(...newTrucks)
    saveTruckToStorage(all)
    return newTrucks
  },
}

// Material Service (localStorage fallback)
const MATERIAL_STORAGE_KEY = 'material_data'

const getMaterialFromStorage = (): Material[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(MATERIAL_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveMaterialToStorage = (data: Material[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(data))
}

export const materialService = {
  getAll: async (): Promise<Material[]> => {
    console.log('[v0] getAll material - using localStorage')
    return getMaterialFromStorage().sort((a, b) => a.namaMaterial.localeCompare(b.namaMaterial))
  },

  getById: async (id: string): Promise<Material | null> => {
    const all = getMaterialFromStorage()
    return all.find(m => m.id === id) || null
  },

  create: async (data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> => {
    console.log('[v0] Creating material - using localStorage')
    const all = getMaterialFromStorage()
    const newMaterial: Material = {
      ...data,
      id: `material-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.push(newMaterial)
    saveMaterialToStorage(all)
    return newMaterial
  },

  update: async (id: string, updates: Partial<Material>): Promise<Material> => {
    const all = getMaterialFromStorage()
    const index = all.findIndex(m => m.id === id)
    if (index === -1) throw new Error('Material not found')
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() }
    saveMaterialToStorage(all)
    return all[index]
  },

  delete: async (id: string): Promise<void> => {
    const all = getMaterialFromStorage()
    const filtered = all.filter(m => m.id !== id)
    saveMaterialToStorage(filtered)
  },

  bulkCreate: async (data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Material[]> => {
    console.log('[v0] Bulk creating material - using localStorage')
    const all = getMaterialFromStorage()
    const newMaterials: Material[] = data.map(item => ({
      ...item,
      id: `material-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    all.push(...newMaterials)
    saveMaterialToStorage(all)
    return newMaterials
  },
}

// Rute Service (localStorage fallback)
const RUTE_STORAGE_KEY = 'rute_data'

const getRuteFromStorage = (): Rute[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(RUTE_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveRuteToStorage = (data: Rute[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(RUTE_STORAGE_KEY, JSON.stringify(data))
}

export const ruteService = {
  getAll: async (): Promise<Rute[]> => {
    console.log('[v0] getAll rute - using localStorage')
    return getRuteFromStorage().sort((a, b) => a.namaRute.localeCompare(b.namaRute))
  },

  getById: async (id: string): Promise<Rute | null> => {
    const all = getRuteFromStorage()
    return all.find(r => r.id === id) || null
  },

  create: async (data: Omit<Rute, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rute> => {
    console.log('[v0] Creating rute - using localStorage')
    const all = getRuteFromStorage()
    const newRute: Rute = {
      ...data,
      id: `rute-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.push(newRute)
    saveRuteToStorage(all)
    return newRute
  },

  update: async (id: string, updates: Partial<Rute>): Promise<Rute> => {
    const all = getRuteFromStorage()
    const index = all.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Rute not found')
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() }
    saveRuteToStorage(all)
    return all[index]
  },

  delete: async (id: string): Promise<void> => {
    const all = getRuteFromStorage()
    const filtered = all.filter(r => r.id !== id)
    saveRuteToStorage(filtered)
  },

  bulkCreate: async (data: Omit<Rute, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Rute[]> => {
    console.log('[v0] Bulk creating rute - using localStorage')
    const all = getRuteFromStorage()
    const newRutes: Rute[] = data.map(item => ({
      ...item,
      id: `rute-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    all.push(...newRutes)
    saveRuteToStorage(all)
    return newRutes
  },
}

// Surat Jalan Service (localStorage fallback)
const SURAT_JALAN_STORAGE_KEY = 'surat_jalan_data'

const getSuratJalanFromStorage = (): SuratJalan[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(SURAT_JALAN_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveSuratJalanToStorage = (data: SuratJalan[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(SURAT_JALAN_STORAGE_KEY, JSON.stringify(data))
}

export const suratJalanService = {
  getAll: async (): Promise<SuratJalan[]> => {
    console.log('[v0] getAll surat jalan - using localStorage')
    return getSuratJalanFromStorage().sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  },

  getById: async (id: string): Promise<SuratJalan | null> => {
    const all = getSuratJalanFromStorage()
    return all.find(sj => sj.id === id) || null
  },

  getByStatus: async (status: string): Promise<SuratJalan[]> => {
    const all = getSuratJalanFromStorage()
    return all.filter(sj => sj.status === status).sort((a, b) => 
      new Date(b.tanggalSuratJalan).getTime() - new Date(a.tanggalSuratJalan).getTime()
    )
  },

  create: async (data: Omit<SuratJalan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SuratJalan> => {
    console.log('[v0] Creating surat jalan - using localStorage')
    const all = getSuratJalanFromStorage()
    const newSuratJalan: SuratJalan = {
      ...data,
      id: `sj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    all.push(newSuratJalan)
    saveSuratJalanToStorage(all)
    return newSuratJalan
  },

  update: async (id: string, updates: Partial<SuratJalan>): Promise<SuratJalan> => {
    console.log('[v0] Updating surat jalan - using localStorage')
    const all = getSuratJalanFromStorage()
    const index = all.findIndex(sj => sj.id === id)
    if (index === -1) throw new Error('Surat jalan not found')
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() }
    saveSuratJalanToStorage(all)
    return all[index]
  },

  delete: async (id: string): Promise<void> => {
    const all = getSuratJalanFromStorage()
    const filtered = all.filter(sj => sj.id !== id)
    saveSuratJalanToStorage(filtered)
  },
}

// User Service (localStorage fallback)
const USERS_STORAGE_KEY = 'users_data'

const getUsersFromStorage = (): User[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(USERS_STORAGE_KEY)
  if (!stored) {
    // Initialize with default admin
    const defaultUsers = [{
      id: 'admin-001',
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin' as any,
      isActive: true,
      createdAt: new Date().toISOString(),
    }]
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
    return defaultUsers
  }
  return JSON.parse(stored)
}

const saveUsersToStorage = (users: User[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    console.log('[v0] getAll users - using localStorage fallback')
    return getUsersFromStorage()
  },

  getById: async (id: string): Promise<User | null> => {
    const users = getUsersFromStorage()
    return users.find(u => u.id === id) || null
  },

  create: async (data: { username: string; password: string; name: string; role: string; isActive: boolean }): Promise<User> => {
    console.log('[v0] Creating user - using localStorage fallback')
    const users = getUsersFromStorage()
    
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: data.username,
      password: data.password,
      name: data.name,
      role: data.role as any,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
    }
    
    users.push(newUser)
    saveUsersToStorage(users)
    return newUser
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    console.log('[v0] Updating user - using localStorage fallback')
    const users = getUsersFromStorage()
    const index = users.findIndex(u => u.id === id)
    
    if (index === -1) throw new Error('User not found')
    
    users[index] = { ...users[index], ...updates }
    saveUsersToStorage(users)
    return users[index]
  },

  delete: async (id: string): Promise<void> => {
    console.log('[v0] Deleting user - using localStorage fallback')
    const users = getUsersFromStorage()
    const filtered = users.filter(u => u.id !== id)
    saveUsersToStorage(filtered)
  },

  getByUsername: async (username: string): Promise<User | null> => {
    console.log('[v0] getByUsername - using localStorage fallback')
    const users = getUsersFromStorage()
    return users.find(u => u.username === username) || null
  },

  authenticate: async (username: string, password: string): Promise<User | null> => {
    console.log('[v0] Authentication attempt for user:', username)
    
    // Check against all users in localStorage
    const users = getUsersFromStorage()
    const user = users.find(u => u.username === username && u.password === password)
    
    if (user) {
      if (!user.isActive) {
        console.log('[v0] User is inactive')
        return null
      }
      console.log('[v0] Authentication successful -', username)
      return user
    }
    
    console.log('[v0] Invalid credentials')
    return null
  },
}

// Transaksi Kas Service (localStorage fallback for now)
const KAS_STORAGE_KEY = 'transaksi_kas'
const SALDO_STORAGE_KEY = 'saldo_kas'

export const transaksiKasService = {
  getAll: (): TransaksiKas[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(KAS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  },

  getByDateRange: (startDate: string, endDate: string): TransaksiKas[] => {
    const all = transaksiKasService.getAll()
    return all.filter(t => t.tanggal >= startDate && t.tanggal <= endDate)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  },

  create: (data: Omit<TransaksiKas, 'id' | 'createdAt'>): TransaksiKas => {
    const all = transaksiKasService.getAll()
    const newTransaksi: TransaksiKas = {
      ...data,
      id: `kas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    
    all.push(newTransaksi)
    localStorage.setItem(KAS_STORAGE_KEY, JSON.stringify(all))
    
    // Update saldo
    const currentSaldo = transaksiKasService.getSaldo()
    const newSaldo = data.tipe === 'terima' 
      ? currentSaldo.saldo + data.jumlah
      : currentSaldo.saldo - data.jumlah
    
    localStorage.setItem(SALDO_STORAGE_KEY, JSON.stringify({
      saldo: newSaldo,
      lastUpdated: new Date().toISOString(),
    }))
    
    return newTransaksi
  },

  getSaldo: (): SaldoKas => {
    if (typeof window === 'undefined') return { saldo: 0, lastUpdated: new Date().toISOString() }
    const stored = localStorage.getItem(SALDO_STORAGE_KEY)
    return stored ? JSON.parse(stored) : { saldo: 0, lastUpdated: new Date().toISOString() }
  },

  delete: (id: string): void => {
    const all = transaksiKasService.getAll()
    const transaksi = all.find(t => t.id === id)
    if (!transaksi) return
    
    const filtered = all.filter(t => t.id !== id)
    localStorage.setItem(KAS_STORAGE_KEY, JSON.stringify(filtered))
    
    // Reverse saldo update
    const currentSaldo = transaksiKasService.getSaldo()
    const newSaldo = transaksi.tipe === 'terima'
      ? currentSaldo.saldo - transaksi.jumlah
      : currentSaldo.saldo + transaksi.jumlah
    
    localStorage.setItem(SALDO_STORAGE_KEY, JSON.stringify({
      saldo: newSaldo,
      lastUpdated: new Date().toISOString(),
    }))
  },
}
