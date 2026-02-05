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
import { useToast } from '@/hooks/use-toast';
import { suratJalanService, transaksiKasService } from '@/lib/supabase-storage';
import { SuratJalan } from '@/types';
import { FileCheck, FileX, Clock, Upload, Download, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateToInput } from '@/lib/date-utils';

export default function RealisasiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pendingSuratJalan, setPendingSuratJalan] = useState<SuratJalan[]>([]);
  const [selectedSJ, setSelectedSJ] = useState<SuratJalan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'terkirim' | 'gagal'>('terkirim');
  
  const [realisasiData, setRealisasiData] = useState({
    tanggalPengiriman: formatDateToInput(new Date()),
    kuantitasTerkirim: 0,
  });

  // Import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPendingSuratJalan();
  }, []);

  const loadPendingSuratJalan = async () => {
    try {
      const pending = await suratJalanService.getByStatus('pending');
      setPendingSuratJalan(pending);
    } catch (error) {
      console.error('Failed to load pending surat jalan:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data surat jalan',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (sj: SuratJalan, action: 'terkirim' | 'gagal') => {
    setSelectedSJ(sj);
    setActionType(action);
    setRealisasiData({
      tanggalPengiriman: formatDateToInput(new Date()),
      kuantitasTerkirim: action === 'terkirim' ? sj.kuantitasPengisian : 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitGagal = async () => {
    if (!selectedSJ) return;

    try {
      await suratJalanService.update(selectedSJ.id, {
        status: 'gagal',
        updatedBy: user?.id,
      });

      toast({
        title: 'Berhasil',
        description: `Surat jalan ${selectedSJ.nomorSuratJalan} ditandai sebagai Gagal`,
      });

      await loadPendingSuratJalan();
      setIsDialogOpen(false);
      setSelectedSJ(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupdate status surat jalan',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitTerkirim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSJ) return;

    // Validation
    if (realisasiData.kuantitasTerkirim <= 0) {
      toast({
        title: 'Error',
        description: 'Kuantitas terkirim harus lebih dari 0',
        variant: 'destructive',
      });
      return;
    }

    if (realisasiData.kuantitasTerkirim > selectedSJ.kuantitasPengisian) {
      toast({
        title: 'Error',
        description: `Kuantitas terkirim tidak boleh melebihi kuantitas pengisian (${selectedSJ.kuantitasPengisian} ${selectedSJ.satuan})`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await suratJalanService.update(selectedSJ.id, {
        status: 'terkirim',
        tanggalPengiriman: realisasiData.tanggalPengiriman,
        kuantitasTerkirim: realisasiData.kuantitasTerkirim,
        updatedBy: user?.id,
      });

      // Auto-create entry "Keluar" ke transaksi kas untuk uang jalan
      try {
        transaksiKasService.create({
          tanggal: realisasiData.tanggalPengiriman,
          tipe: 'keluar',
          kategori: 'uang_jalan',
          jumlah: selectedSJ.uangJalan,
          keterangan: `Uang Jalan - ${selectedSJ.nomorSuratJalan} (${selectedSJ.namaRute})`,
          suratJalanId: selectedSJ.id,
          nomorSuratJalan: selectedSJ.nomorSuratJalan,
          createdBy: user?.id || '',
        });
      } catch (kasError) {
        console.error('[v0] Failed to create kas entry:', kasError);
        // Don't block the main process if kas entry fails
      }

      toast({
        title: 'Berhasil',
        description: `Surat jalan ${selectedSJ.nomorSuratJalan} berhasil diselesaikan`,
      });

      await loadPendingSuratJalan();
      setIsDialogOpen(false);
      setSelectedSJ(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupdate surat jalan',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportData(text);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `Nomor Surat Jalan;Status;Tanggal Pengiriman;Kuantitas Terkirim
SJ/2024/001;terkirim;2024-01-16;25.5
SJ/2024/002;terkirim;2024-01-17;30.0
SJ/2024/003;gagal;;0`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_import_realisasi.csv';
    link.click();
  };

  const processImport = async () => {
    try {
      const lines = importData.trim().split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Error',
          description: 'File kosong atau tidak valid',
          variant: 'destructive',
        });
        return;
      }

      const dataLines = lines.slice(1);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const line of dataLines) {
        const parts = line.split(';').map(p => p.trim());
        
        if (parts.length < 4) {
          errors.push(`Baris tidak lengkap: ${line.substring(0, 30)}...`);
          errorCount++;
          continue;
        }

        const [nomorSJ, status, tanggalPengiriman, kuantitasStr] = parts;
        
        if (status !== 'terkirim' && status !== 'gagal') {
          errors.push(`Status tidak valid untuk: ${nomorSJ}`);
          errorCount++;
          continue;
        }

        const allSJ = await suratJalanService.getAll();
        const sj = allSJ.find(s => s.nomorSuratJalan === nomorSJ && s.status === 'pending');
        
        if (!sj) {
          errors.push(`Surat jalan tidak ditemukan atau sudah diproses: ${nomorSJ}`);
          errorCount++;
          continue;
        }

        try {
          if (status === 'gagal') {
            await suratJalanService.update(sj.id, {
              status: 'gagal',
              updatedBy: user?.id,
            });
          } else {
            const kuantitas = parseFloat(kuantitasStr);
            if (isNaN(kuantitas) || kuantitas <= 0 || kuantitas > sj.kuantitasPengisian) {
              errors.push(`Kuantitas tidak valid untuk: ${nomorSJ}`);
              errorCount++;
              continue;
            }

            await suratJalanService.update(sj.id, {
              status: 'terkirim',
              tanggalPengiriman: tanggalPengiriman,
              kuantitasTerkirim: kuantitas,
              updatedBy: user?.id,
            });

            // Auto-create kas entry
            try {
              transaksiKasService.create({
                tanggal: tanggalPengiriman,
                tipe: 'keluar',
                kategori: 'uang_jalan',
                jumlah: sj.uangJalan,
                keterangan: `Uang Jalan - ${sj.nomorSuratJalan} (${sj.namaRute})`,
                suratJalanId: sj.id,
                nomorSuratJalan: sj.nomorSuratJalan,
                createdBy: user?.id || '',
              });
            } catch (kasError) {
              console.error('[v0] Failed to create kas entry:', kasError);
            }
          }
          successCount++;
        } catch (error) {
          errors.push(`Gagal mengupdate: ${nomorSJ}`);
          errorCount++;
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
      setImportData('');
      await loadPendingSuratJalan();

      if (successCount > 0) {
        toast({
          title: 'Import Selesai',
          description: `Berhasil: ${successCount}, Gagal: ${errorCount}${errors.length > 0 ? '\n' + errors.slice(0, 3).join('\n') : ''}`,
        });
      } else {
        toast({
          title: 'Import Gagal',
          description: errors.slice(0, 3).join('\n'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses import',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Realisasi Pengiriman</h1>
          <p className="text-muted-foreground mt-1">Update status surat jalan yang pending</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daftar Surat Jalan Pending ({pendingSuratJalan.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSuratJalan.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada surat jalan pending</p>
              <p className="text-sm mt-1">Semua surat jalan sudah diproses</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Surat Jalan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nomor Polisi</TableHead>
                    <TableHead>Supir</TableHead>
                    <TableHead>Rute</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Kuantitas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSuratJalan.map((sj) => (
                <TableRow key={sj.id}>
                  <TableCell className="font-medium">{sj.nomorSuratJalan}</TableCell>
                  <TableCell>{formatDate(sj.tanggalSuratJalan)}</TableCell>
                  <TableCell>{sj.nomorPolisi}</TableCell>
                  <TableCell>{sj.namaSupir}</TableCell>
                      <TableCell>{sj.namaRute}</TableCell>
                      <TableCell>{sj.namaMaterial}</TableCell>
                      <TableCell className="text-right">
                        {sj.kuantitasPengisian} {sj.satuan}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenDialog(sj, 'terkirim')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FileCheck className="mr-1 h-4 w-4" />
                            Terkirim
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenDialog(sj, 'gagal')}
                          >
                            <FileX className="mr-1 h-4 w-4" />
                            Gagal
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Realisasi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'terkirim' ? 'Realisasi Pengiriman' : 'Konfirmasi Pengiriman Gagal'}
            </DialogTitle>
          </DialogHeader>

          {selectedSJ && (
            <div className="space-y-6">
              {/* Info Surat Jalan */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-sm text-slate-600 uppercase">Informasi Surat Jalan</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nomor Surat Jalan</p>
                    <p className="font-medium">{selectedSJ.nomorSuratJalan}</p>
                  </div>
              <div>
                <p className="text-muted-foreground">Tanggal Surat Jalan</p>
                <p className="font-medium">{formatDate(selectedSJ.tanggalSuratJalan)}</p>
              </div>
                  <div>
                    <p className="text-muted-foreground">Nomor Polisi</p>
                    <p className="font-medium">{selectedSJ.nomorPolisi}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nama Rute</p>
                    <p className="font-medium">{selectedSJ.namaRute}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nama Material</p>
                    <p className="font-medium">{selectedSJ.namaMaterial}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kuantitas Pengisian</p>
                    <p className="font-medium">{selectedSJ.kuantitasPengisian} {selectedSJ.satuan}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Satuan</p>
                    <p className="font-medium">{selectedSJ.satuan}</p>
                  </div>
                </div>
              </div>

              {actionType === 'terkirim' ? (
                <form onSubmit={handleSubmitTerkirim} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggalPengiriman">Tanggal Pengiriman *</Label>
                    <Input
                      id="tanggalPengiriman"
                      type="date"
                      value={realisasiData.tanggalPengiriman}
                      onChange={(e) => setRealisasiData({ ...realisasiData, tanggalPengiriman: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kuantitasTerkirim">
                      Kuantitas Terkirim * (Maks: {selectedSJ.kuantitasPengisian} {selectedSJ.satuan})
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="kuantitasTerkirim"
                        type="number"
                        step="0.01"
                        max={selectedSJ.kuantitasPengisian}
                        value={realisasiData.kuantitasTerkirim || ''}
                        onChange={(e) => setRealisasiData({ ...realisasiData, kuantitasTerkirim: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <Input
                        value={selectedSJ.satuan}
                        disabled
                        className="w-24 bg-muted"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      <FileCheck className="mr-2 h-4 w-4" />
                      Simpan Realisasi
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-800">
                      Apakah Anda yakin ingin menandai surat jalan ini sebagai <strong>Gagal</strong>?
                      Status ini tidak dapat diubah kembali.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button variant="destructive" onClick={handleSubmitGagal}>
                      <FileX className="mr-2 h-4 w-4" />
                      Tandai sebagai Gagal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Data Realisasi</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold text-blue-900">Format File CSV:</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Gunakan delimiter titik koma (;)</li>
                <li>Baris pertama adalah header (akan diskip)</li>
                <li>Nomor Surat Jalan harus sudah ada dengan status Pending</li>
                <li>Status: terkirim atau gagal</li>
                <li>Untuk status gagal, kosongkan tanggal pengiriman dan kuantitas</li>
                <li>Format tanggal: YYYY-MM-DD</li>
              </ul>
              <Button onClick={downloadTemplate} variant="outline" size="sm" className="mt-2 bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Upload File CSV</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-2">
              <Label>Atau Paste Data CSV</Label>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste data CSV di sini..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsImportDialogOpen(false);
                setImportData('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button onClick={processImport} disabled={!importData.trim()}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
