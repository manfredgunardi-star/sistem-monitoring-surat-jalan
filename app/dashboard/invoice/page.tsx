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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { suratJalanService } from '@/lib/supabase-storage';
import { SuratJalan } from '@/types';
import { FileText, CheckCircle, Download } from 'lucide-react';
import { formatDate, formatDateToInput } from '@/lib/date-utils';

export default function InvoicePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [suratJalanTerkirim, setSuratJalanTerkirim] = useState<SuratJalan[]>([]);
  const [selectedSJ, setSelectedSJ] = useState<SuratJalan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [invoiceData, setInvoiceData] = useState({
    nomorInvoice: '',
    tanggalInvoice: formatDateToInput(new Date()),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const terkirim = await suratJalanService.getByStatus('terkirim');
      setSuratJalanTerkirim(terkirim);
    } catch (error) {
      console.error('Failed to load terkirim data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data surat jalan terkirim',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (sj: SuratJalan) => {
    setSelectedSJ(sj);
    setInvoiceData({
      nomorInvoice: sj.nomorInvoice || '',
      tanggalInvoice: sj.tanggalInvoice || formatDateToInput(new Date()),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSJ) return;

    if (!invoiceData.nomorInvoice.trim()) {
      toast({
        title: 'Error',
        description: 'Nomor invoice harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      await suratJalanService.update(selectedSJ.id, {
        nomorInvoice: invoiceData.nomorInvoice,
        tanggalInvoice: invoiceData.tanggalInvoice,
        updatedBy: user?.id,
      });

      toast({
        title: 'Berhasil',
        description: `Invoice berhasil ${selectedSJ.nomorInvoice ? 'diperbarui' : 'ditambahkan'}`,
      });

      await loadData();
      setIsDialogOpen(false);
      setSelectedSJ(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan nomor invoice',
        variant: 'destructive',
      });
    }
  };

  const handleExport = (withInvoice: boolean) => {
    const dataToExport = withInvoice
      ? suratJalanTerkirim.filter(sj => sj.nomorInvoice)
      : suratJalanTerkirim.filter(sj => !sj.nomorInvoice);

    if (dataToExport.length === 0) {
      toast({
        title: 'Tidak ada data',
        description: 'Tidak ada data untuk diexport',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Nomor Surat Jalan',
      'Tanggal Surat Jalan',
      'Tanggal Pengiriman',
      'Nomor Polisi',
      'Nama Supir',
      'Nama PT',
      'Nama Rute',
      'Material',
      'Kuantitas Terkirim',
      'Satuan',
      'Uang Jalan',
      'Nomor Invoice',
      'Tanggal Invoice',
    ];

    const rows = dataToExport.map(sj => [
      sj.nomorSuratJalan,
      sj.tanggalSuratJalan,
      sj.tanggalPengiriman || '-',
      sj.nomorPolisi,
      sj.namaSupir,
      sj.namaPT,
      sj.namaRute,
      sj.namaMaterial,
      sj.kuantitasTerkirim || 0,
      sj.satuan,
      sj.uangJalan,
      sj.nomorInvoice || '-',
      sj.tanggalInvoice || '-',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = withInvoice ? 'surat-jalan-terinvoice' : 'surat-jalan-belum-invoice';
    a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Berhasil',
      description: `${dataToExport.length} data berhasil diexport`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const sudahInvoice = suratJalanTerkirim.filter(sj => sj.nomorInvoice);
  const belumInvoice = suratJalanTerkirim.filter(sj => !sj.nomorInvoice);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Invoice</h1>
        <p className="text-muted-foreground mt-1">Input dan kelola nomor invoice surat jalan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Terkirim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suratJalanTerkirim.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sudah Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sudahInvoice.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Belum Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{belumInvoice.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="belum" className="space-y-4">
        <TabsList>
          <TabsTrigger value="belum">
            Belum Invoice ({belumInvoice.length})
          </TabsTrigger>
          <TabsTrigger value="sudah">
            Sudah Invoice ({sudahInvoice.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="belum" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Surat Jalan Belum Invoice
                </CardTitle>
                <Button variant="outline" onClick={() => handleExport(false)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {belumInvoice.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Semua sudah diinvoice</p>
                  <p className="text-sm mt-1">Tidak ada surat jalan yang belum memiliki nomor invoice</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Surat Jalan</TableHead>
                        <TableHead>Tgl Pengiriman</TableHead>
                        <TableHead>Nopol</TableHead>
                        <TableHead>Supir</TableHead>
                        <TableHead>Rute</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Uang Jalan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {belumInvoice.map((sj) => (
                        <TableRow key={sj.id}>
                          <TableCell className="font-medium">{sj.nomorSuratJalan}</TableCell>
                          <TableCell>
                            {sj.tanggalPengiriman 
                              ? new Date(sj.tanggalPengiriman).toLocaleDateString('id-ID')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{sj.nomorPolisi}</TableCell>
                          <TableCell>{sj.namaSupir}</TableCell>
                          <TableCell>{sj.namaRute}</TableCell>
                          <TableCell className="text-right">
                            {sj.kuantitasTerkirim} {sj.satuan}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(sj.uangJalan)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleOpenDialog(sj)}
                            >
                              <FileText className="mr-1 h-4 w-4" />
                              Input Invoice
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sudah" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Surat Jalan Sudah Invoice
                </CardTitle>
                <Button variant="outline" onClick={() => handleExport(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sudahInvoice.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Belum ada invoice</p>
                  <p className="text-sm mt-1">Belum ada surat jalan yang diinvoice</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Surat Jalan</TableHead>
                        <TableHead>Tgl Pengiriman</TableHead>
                        <TableHead>Nopol</TableHead>
                        <TableHead>Supir</TableHead>
                        <TableHead>Rute</TableHead>
                        <TableHead>No. Invoice</TableHead>
                        <TableHead>Tgl Invoice</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sudahInvoice.map((sj) => (
                        <TableRow key={sj.id}>
                          <TableCell className="font-medium">{sj.nomorSuratJalan}</TableCell>
                          <TableCell>
                            {sj.tanggalPengiriman 
                              ? new Date(sj.tanggalPengiriman).toLocaleDateString('id-ID')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{sj.nomorPolisi}</TableCell>
                          <TableCell>{sj.namaSupir}</TableCell>
                          <TableCell>{sj.namaRute}</TableCell>
                          <TableCell className="font-medium">{sj.nomorInvoice}</TableCell>
                <TableCell>
                  {sj.tanggalPengiriman ? formatDate(sj.tanggalPengiriman) : '-'}
                </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(sj)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Input Invoice */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSJ?.nomorInvoice ? 'Edit' : 'Input'} Nomor Invoice
            </DialogTitle>
          </DialogHeader>

          {selectedSJ && (
            <div className="space-y-6">
              {/* Info Surat Jalan */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm text-slate-600 uppercase">Informasi Surat Jalan</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nomor SJ</p>
                    <p className="font-medium">{selectedSJ.nomorSuratJalan}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tanggal Pengiriman</p>
                <p className="font-medium">
                  {selectedSJ.tanggalPengiriman ? formatDate(selectedSJ.tanggalPengiriman) : '-'}
                </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rute</p>
                    <p className="font-medium">{selectedSJ.namaRute}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uang Jalan</p>
                    <p className="font-medium">{formatCurrency(selectedSJ.uangJalan)}</p>
                  </div>
                </div>
              </div>

              {/* Form Invoice */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorInvoice">Nomor Invoice *</Label>
                  <Input
                    id="nomorInvoice"
                    placeholder="INV/2024/001"
                    value={invoiceData.nomorInvoice}
                    onChange={(e) => setInvoiceData({ ...invoiceData, nomorInvoice: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalInvoice">Tanggal Invoice *</Label>
                  <Input
                    id="tanggalInvoice"
                    type="date"
                    value={invoiceData.tanggalInvoice}
                    onChange={(e) => setInvoiceData({ ...invoiceData, tanggalInvoice: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    <FileText className="mr-2 h-4 w-4" />
                    Simpan Invoice
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
