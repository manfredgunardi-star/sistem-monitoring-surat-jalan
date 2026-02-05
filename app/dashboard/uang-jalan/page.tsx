'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TransaksiKas, TipeTransaksi } from '@/types';
import { DollarSign, Plus, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

// Temporary localStorage storage for transaksi kas
const STORAGE_KEY = 'transaksi_kas';
const SALDO_KEY = 'saldo_kas';

export default function UangJalanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [transaksiList, setTransaksiList] = useState<TransaksiKas[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [saldoFiltered, setSaldoFiltered] = useState(0);
  
  const [formData, setFormData] = useState<{
    tipe: TipeTransaksi;
    jumlah: number;
    keterangan: string;
    tanggal: string;
  }>({
    tipe: 'terima',
    jumlah: 0,
    keterangan: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const transaksi = stored ? JSON.parse(stored) : [];
      setTransaksiList(transaksi);

      const storedSaldo = localStorage.getItem(SALDO_KEY);
      let calculatedSaldo = 0;
      
      if (storedSaldo) {
        const parsedSaldo = parseFloat(storedSaldo);
        // Validate parsed saldo is a valid number
        if (!isNaN(parsedSaldo) && isFinite(parsedSaldo)) {
          calculatedSaldo = parsedSaldo;
        } else {
          // Recalculate from transactions if stored saldo is invalid
          console.log('[v0] Invalid saldo in storage, recalculating from transactions');
          calculatedSaldo = transaksi.reduce((acc: number, t: TransaksiKas) => {
            return t.tipe === 'terima' ? acc + t.jumlah : acc - t.jumlah;
          }, 0);
          // Save the recalculated saldo
          localStorage.setItem(SALDO_KEY, calculatedSaldo.toString());
        }
      } else {
        // Calculate saldo from all transactions if not stored
        calculatedSaldo = transaksi.reduce((acc: number, t: TransaksiKas) => {
          return t.tipe === 'terima' ? acc + t.jumlah : acc - t.jumlah;
        }, 0);
        localStorage.setItem(SALDO_KEY, calculatedSaldo.toString());
      }
      
      setSaldo(calculatedSaldo);
    } catch (error) {
      console.error('[v0] Failed to load transaksi kas:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data transaksi kas',
        variant: 'destructive',
      });
    }
  };

  const saveSaldo = (newSaldo: number) => {
    localStorage.setItem(SALDO_KEY, newSaldo.toString());
    setSaldo(newSaldo);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.jumlah <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah harus lebih dari 0',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.keterangan.trim()) {
      toast({
        title: 'Error',
        description: 'Keterangan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    // Calculate new saldo
    let newSaldo = saldo;
    if (formData.tipe === 'terima') {
      newSaldo += formData.jumlah;
    } else {
      newSaldo -= formData.jumlah;
    }

    const newTransaksi: TransaksiKas = {
      id: `KAS-${Date.now()}`,
      tanggal: formData.tanggal,
      tipe: formData.tipe,
      kategori: 'manual',
      jumlah: formData.jumlah,
      keterangan: formData.keterangan,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'system',
    };

    const updatedList = [newTransaksi, ...transaksiList];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setTransaksiList(updatedList);

    saveSaldo(newSaldo);

    toast({
      title: 'Berhasil',
      description: `Transaksi ${formData.tipe === 'terima' ? 'penerimaan' : 'pengeluaran'} berhasil ditambahkan`,
    });

    setIsDialogOpen(false);
    setFormData({
      tipe: 'terima',
      jumlah: 0,
      keterangan: '',
      tanggal: new Date().toISOString().split('T')[0],
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransaksi = transaksiList.filter(t => {
    if (!filterDate) return true;
    return t.tanggal === filterDate;
  });

  const totalTerima = filteredTransaksi
    .filter(t => t.tipe === 'terima')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalKeluar = filteredTransaksi
    .filter(t => t.tipe === 'keluar')
    .reduce((sum, t) => sum + t.jumlah, 0);

  // Calculate saldo up to filtered date
  useEffect(() => {
    if (filterDate) {
      const transUntilDate = transaksiList.filter(t => t.tanggal <= filterDate);
      const saldoUntilDate = transUntilDate.reduce((acc, t) => {
        return t.tipe === 'terima' ? acc + t.jumlah : acc - t.jumlah;
      }, 0);
      setSaldoFiltered(saldoUntilDate);
    }
  }, [filterDate, transaksiList]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Kas</h1>
          <p className="text-muted-foreground mt-1">Input dan monitoring transaksi keuangan</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Input Transaksi
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Saldo Kas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(saldo)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Saldo per Tanggal (Filter)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoFiltered >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoFiltered)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Terima (Filter)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalTerima)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total Keluar (Filter)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalKeluar)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Tanggal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="filterDate">Tanggal</Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setFilterDate('')}>
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaksi Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransaksi.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Belum ada transaksi</p>
              <p className="text-sm mt-1">
                {filterDate ? 'Tidak ada transaksi pada tanggal ini' : 'Klik tombol Input Transaksi untuk mulai'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransaksi.map((transaksi) => (
                    <TableRow key={transaksi.id}>
                      <TableCell className="font-medium">{transaksi.id}</TableCell>
                      <TableCell>{formatDate(transaksi.tanggal)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaksi.tipe === 'terima' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            transaksi.tipe === 'terima' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaksi.tipe === 'terima' ? 'Terima' : 'Keluar'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{transaksi.keterangan}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {transaksi.kategori === 'uang_jalan' ? 'Uang Jalan' : 'Manual'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        transaksi.tipe === 'terima' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaksi.tipe === 'terima' ? '+' : '-'} {formatCurrency(transaksi.jumlah)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Input Transaksi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Transaksi Kas</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe Transaksi *</Label>
              <Select
                value={formData.tipe}
                onValueChange={(value: TipeTransaksi) => setFormData({ ...formData, tipe: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terima">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Terima (Menambah Saldo)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="keluar">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Keluar (Mengurangi Saldo)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal *</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah (Rp) *</Label>
              <Input
                id="jumlah"
                type="number"
                min="0"
                step="1000"
                placeholder="50000"
                value={formData.jumlah || ''}
                onChange={(e) => setFormData({ ...formData, jumlah: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan *</Label>
              <Textarea
                id="keterangan"
                placeholder="Contoh: Pembayaran dari PT ABC, Pembelian solar, dll"
                rows={3}
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                required
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Saldo saat ini: <span className="font-bold text-slate-900">{formatCurrency(saldo)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Saldo setelah transaksi: {' '}
                <span className={`font-bold ${
                  formData.tipe === 'terima' 
                    ? 'text-green-600' 
                    : saldo - formData.jumlah < 0 
                      ? 'text-red-600' 
                      : 'text-slate-900'
                }`}>
                  {formatCurrency(
                    formData.tipe === 'terima' 
                      ? saldo + formData.jumlah 
                      : saldo - formData.jumlah
                  )}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Simpan Transaksi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
