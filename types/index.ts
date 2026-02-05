// User Types
export type UserRole = 'admin' | 'input_surat_jalan' | 'input_kas' | 'input_invoice' | 'reader';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Master Data Types
export interface Supir {
  id: string;
  nama: string;
  namaPT: string;
  isActive: boolean;
  createdAt: string;
}

export interface Truck {
  id: string;
  nomorPolisi: string;
  isActive: boolean;
  createdAt: string;
}

export interface Material {
  id: string;
  namaMaterial: string;
  satuan: string;
  createdAt: string;
}

export interface Rute {
  id: string;
  namaRute: string;
  uangJalan: number;
  createdAt: string;
}

// Surat Jalan Types
export type SuratJalanStatus = 'pending' | 'terkirim' | 'gagal';

export interface SuratJalan {
  id: string;
  nomorSuratJalan: string;
  tanggalSuratJalan: string;
  nomorPolisi: string;
  truckId: string;
  namaSupir: string;
  supirId: string;
  namaPT: string;
  namaRute: string;
  ruteId: string;
  uangJalan: number;
  namaMaterial: string;
  materialId: string;
  kuantitasPengisian: number;
  satuan: string;
  status: SuratJalanStatus;
  
  // Realisasi fields
  tanggalPengiriman?: string;
  kuantitasTerkirim?: number;
  
  // Invoice field
  nomorInvoice?: string;
  tanggalInvoice?: string;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// Transaksi Kas Types
export type TipeTransaksi = 'terima' | 'keluar';
export type KategoriTransaksi = 'uang_jalan' | 'manual';

export interface TransaksiKas {
  id: string;
  tanggal: string;
  tipe: TipeTransaksi;
  kategori: KategoriTransaksi;
  jumlah: number;
  keterangan: string;
  suratJalanId?: string;
  nomorSuratJalan?: string;
  createdAt: string;
  createdBy: string;
}

export interface SaldoKas {
  saldo: number;
  lastUpdated: string;
}

// Report Types
export interface UangJalanReport {
  tanggal: string;
  totalSuratJalan: number;
  totalUangJalan: number;
  details: {
    nomorSuratJalan: string;
    namaRute: string;
    uangJalan: number;
  }[];
}

export interface InvoiceReport {
  nomorSuratJalan: string;
  tanggalSuratJalan: string;
  nomorInvoice?: string;
  tanggalInvoice?: string;
  status: 'belum' | 'sudah';
}
