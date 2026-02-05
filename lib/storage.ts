import { User, Supir, Truck, Material, Rute, SuratJalan } from '@/types';

// Storage Keys
const STORAGE_KEYS = {
  USERS: 'sj_users',
  SUPIR: 'sj_supir',
  TRUCK: 'sj_truck',
  MATERIAL: 'sj_material',
  RUTE: 'sj_rute',
  SURAT_JALAN: 'sj_surat_jalan',
  CURRENT_USER: 'sj_current_user',
} as const;

// Generic Storage Functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(key);
    // Return deep copy to avoid reference issues
    return item ? JSON.parse(JSON.stringify(JSON.parse(item))) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Generate ID Functions
function generateId(prefix: string, existingIds: string[]): string {
  const numbers = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, '')) || 0);
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const newNumber = maxNumber + 1;
  
  return `${prefix}${newNumber.toString().padStart(4, '0')}`;
}

// Initialize Default Data
export function initializeDefaultData(): void {
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  if (users.length === 0) {
    const defaultAdmin: User = {
      id: 'USR0001',
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
      name: 'Administrator',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    saveToStorage(STORAGE_KEYS.USERS, [defaultAdmin]);
  }
}

// User Services
export const userService = {
  getAll: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  
  getById: (id: string): User | undefined => {
    const users = userService.getAll();
    return users.find(user => user.id === id);
  },
  
  getByUsername: (username: string): User | undefined => {
    const users = userService.getAll();
    return users.find(user => user.username === username);
  },
  
  create: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const users = userService.getAll();
    const existingIds = users.map(u => u.id);
    
    const newUser: User = {
      ...userData,
      id: generateId('USR', existingIds),
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  
  update: (id: string, updates: Partial<User>): User | null => {
    const users = userService.getAll();
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  },
  
  delete: (id: string): boolean => {
    const users = userService.getAll();
    const filtered = users.filter(user => user.id !== id);
    
    if (filtered.length === users.length) return false;
    
    saveToStorage(STORAGE_KEYS.USERS, filtered);
    return true;
  },
  
  authenticate: (username: string, password: string): User | null => {
    const user = userService.getByUsername(username);
    
    if (!user || !user.isActive) return null;
    if (user.password !== password) return null;
    
    return user;
  },
};

// Supir Services
export const supirService = {
  getAll: (): Supir[] => getFromStorage<Supir>(STORAGE_KEYS.SUPIR),
  
  getById: (id: string): Supir | undefined => {
    const supirs = supirService.getAll();
    return supirs.find(supir => supir.id === id);
  },
  
  create: (data: Omit<Supir, 'id' | 'createdAt'>): Supir => {
    const supirs = supirService.getAll();
    const existingIds = supirs.map(s => s.id);
    
    const newSupir: Supir = {
      ...data,
      id: generateId('SPR', existingIds),
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    
    supirs.push(newSupir);
    saveToStorage(STORAGE_KEYS.SUPIR, supirs);
    return newSupir;
  },
  
  update: (id: string, updates: Partial<Supir>): Supir | null => {
    const supirs = supirService.getAll();
    const index = supirs.findIndex(supir => supir.id === id);
    
    if (index === -1) return null;
    
    supirs[index] = { ...supirs[index], ...updates };
    saveToStorage(STORAGE_KEYS.SUPIR, supirs);
    return supirs[index];
  },
  
  delete: (id: string): boolean => {
    const supirs = supirService.getAll();
    const filtered = supirs.filter(supir => supir.id !== id);
    
    if (filtered.length === supirs.length) return false;
    
    saveToStorage(STORAGE_KEYS.SUPIR, filtered);
    return true;
  },
  
  bulkCreate: (data: Omit<Supir, 'id' | 'createdAt'>[]): Supir[] => {
    const supirs = supirService.getAll();
    const allIds = supirs.map(s => s.id);
    
    const newSupirs = data.map((item) => {
      const newId = generateId('SPR', allIds);
      allIds.push(newId); // Add to array to prevent duplicates in same batch
      return {
        ...item,
        id: newId,
        isActive: item.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
    });
    
    const updated = [...supirs, ...newSupirs];
    saveToStorage(STORAGE_KEYS.SUPIR, updated);
    return newSupirs;
  },
  
  getActive: (): Supir[] => {
    return supirService.getAll().filter(supir => supir.isActive);
  },
};

// Truck Services
export const truckService = {
  getAll: (): Truck[] => getFromStorage<Truck>(STORAGE_KEYS.TRUCK),
  
  getById: (id: string): Truck | undefined => {
    const trucks = truckService.getAll();
    return trucks.find(truck => truck.id === id);
  },
  
  create: (data: Omit<Truck, 'id' | 'createdAt'>): Truck => {
    const trucks = truckService.getAll();
    const existingIds = trucks.map(t => t.id);
    
    const newTruck: Truck = {
      ...data,
      id: generateId('TRK', existingIds),
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    
    trucks.push(newTruck);
    saveToStorage(STORAGE_KEYS.TRUCK, trucks);
    return newTruck;
  },
  
  update: (id: string, updates: Partial<Truck>): Truck | null => {
    const trucks = truckService.getAll();
    const index = trucks.findIndex(truck => truck.id === id);
    
    if (index === -1) return null;
    
    trucks[index] = { ...trucks[index], ...updates };
    saveToStorage(STORAGE_KEYS.TRUCK, trucks);
    return trucks[index];
  },
  
  delete: (id: string): boolean => {
    const trucks = truckService.getAll();
    const filtered = trucks.filter(truck => truck.id !== id);
    
    if (filtered.length === trucks.length) return false;
    
    saveToStorage(STORAGE_KEYS.TRUCK, filtered);
    return true;
  },
  
  bulkCreate: (data: Omit<Truck, 'id' | 'createdAt'>[]): Truck[] => {
    const trucks = truckService.getAll();
    const allIds = trucks.map(t => t.id);
    
    const newTrucks = data.map((item) => {
      const newId = generateId('TRK', allIds);
      allIds.push(newId);
      return {
        ...item,
        id: newId,
        isActive: item.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
    });
    
    const updated = [...trucks, ...newTrucks];
    saveToStorage(STORAGE_KEYS.TRUCK, updated);
    return newTrucks;
  },
  
  getActive: (): Truck[] => {
    return truckService.getAll().filter(truck => truck.isActive);
  },
};

// Material Services
export const materialService = {
  getAll: (): Material[] => getFromStorage<Material>(STORAGE_KEYS.MATERIAL),
  
  getById: (id: string): Material | undefined => {
    const materials = materialService.getAll();
    return materials.find(material => material.id === id);
  },
  
  create: (data: Omit<Material, 'id' | 'createdAt'>): Material => {
    const materials = materialService.getAll();
    const existingIds = materials.map(m => m.id);
    
    const newMaterial: Material = {
      ...data,
      id: generateId('MAT', existingIds),
      createdAt: new Date().toISOString(),
    };
    
    materials.push(newMaterial);
    saveToStorage(STORAGE_KEYS.MATERIAL, materials);
    return newMaterial;
  },
  
  update: (id: string, updates: Partial<Material>): Material | null => {
    const materials = materialService.getAll();
    const index = materials.findIndex(material => material.id === id);
    
    if (index === -1) return null;
    
    materials[index] = { ...materials[index], ...updates };
    saveToStorage(STORAGE_KEYS.MATERIAL, materials);
    return materials[index];
  },
  
  delete: (id: string): boolean => {
    const materials = materialService.getAll();
    const filtered = materials.filter(material => material.id !== id);
    
    if (filtered.length === materials.length) return false;
    
    saveToStorage(STORAGE_KEYS.MATERIAL, filtered);
    return true;
  },
  
  bulkCreate: (data: Omit<Material, 'id' | 'createdAt'>[]): Material[] => {
    const materials = materialService.getAll();
    const allIds = materials.map(m => m.id);
    
    const newMaterials = data.map((item) => {
      const newId = generateId('MAT', allIds);
      allIds.push(newId);
      return {
        ...item,
        id: newId,
        createdAt: new Date().toISOString(),
      };
    });
    
    const updated = [...materials, ...newMaterials];
    saveToStorage(STORAGE_KEYS.MATERIAL, updated);
    return newMaterials;
  },
};

// Rute Services
export const ruteService = {
  getAll: (): Rute[] => getFromStorage<Rute>(STORAGE_KEYS.RUTE),
  
  getById: (id: string): Rute | undefined => {
    const rutes = ruteService.getAll();
    return rutes.find(rute => rute.id === id);
  },
  
  create: (data: Omit<Rute, 'id' | 'createdAt'>): Rute => {
    const rutes = ruteService.getAll();
    const existingIds = rutes.map(r => r.id);
    
    const newRute: Rute = {
      ...data,
      id: generateId('RTE', existingIds),
      createdAt: new Date().toISOString(),
    };
    
    rutes.push(newRute);
    saveToStorage(STORAGE_KEYS.RUTE, rutes);
    return newRute;
  },
  
  update: (id: string, updates: Partial<Rute>): Rute | null => {
    const rutes = ruteService.getAll();
    const index = rutes.findIndex(rute => rute.id === id);
    
    if (index === -1) return null;
    
    rutes[index] = { ...rutes[index], ...updates };
    saveToStorage(STORAGE_KEYS.RUTE, rutes);
    return rutes[index];
  },
  
  delete: (id: string): boolean => {
    const rutes = ruteService.getAll();
    const filtered = rutes.filter(rute => rute.id !== id);
    
    if (filtered.length === rutes.length) return false;
    
    saveToStorage(STORAGE_KEYS.RUTE, filtered);
    return true;
  },
  
  bulkCreate: (data: Omit<Rute, 'id' | 'createdAt'>[]): Rute[] => {
    const rutes = ruteService.getAll();
    const allIds = rutes.map(r => r.id);
    
    const newRutes = data.map((item) => {
      const newId = generateId('RTE', allIds);
      allIds.push(newId);
      return {
        ...item,
        id: newId,
        createdAt: new Date().toISOString(),
      };
    });
    
    const updated = [...rutes, ...newRutes];
    saveToStorage(STORAGE_KEYS.RUTE, updated);
    return newRutes;
  },
};

// Surat Jalan Services
export const suratJalanService = {
  getAll: (): SuratJalan[] => getFromStorage<SuratJalan>(STORAGE_KEYS.SURAT_JALAN),
  
  getById: (id: string): SuratJalan | undefined => {
    const suratJalans = suratJalanService.getAll();
    return suratJalans.find(sj => sj.id === id);
  },
  
  getByStatus: (status: string): SuratJalan[] => {
    const suratJalans = suratJalanService.getAll();
    return suratJalans.filter(sj => sj.status === status);
  },
  
  create: (data: Omit<SuratJalan, 'id' | 'createdAt' | 'updatedAt'>): SuratJalan => {
    const suratJalans = suratJalanService.getAll();
    const existingIds = suratJalans.map(sj => sj.id);
    
    const newSuratJalan: SuratJalan = {
      ...data,
      id: generateId('SJ', existingIds),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    suratJalans.push(newSuratJalan);
    saveToStorage(STORAGE_KEYS.SURAT_JALAN, suratJalans);
    return newSuratJalan;
  },
  
  update: (id: string, updates: Partial<SuratJalan>): SuratJalan | null => {
    const suratJalans = suratJalanService.getAll();
    const index = suratJalans.findIndex(sj => sj.id === id);
    
    if (index === -1) return null;
    
    suratJalans[index] = {
      ...suratJalans[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveToStorage(STORAGE_KEYS.SURAT_JALAN, suratJalans);
    return suratJalans[index];
  },
  
  delete: (id: string): boolean => {
    const suratJalans = suratJalanService.getAll();
    const filtered = suratJalans.filter(sj => sj.id !== id);
    
    if (filtered.length === suratJalans.length) return false;
    
    saveToStorage(STORAGE_KEYS.SURAT_JALAN, filtered);
    return true;
  },
};

// Current User
export const currentUserService = {
  get: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (user: User): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save current user:', error);
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};
