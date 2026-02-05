'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { suratJalanService, supirService, truckService, materialService, ruteService } from '@/lib/supabase-storage';
import { Supir, Truck, Material, Rute } from '@/types';
import { Save, Plus, Upload, Download, X } from 'lucide-react';
import { formatDate, formatDateToInput } from '@/lib/date-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function InputSuratJalanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [supirs, setSupirs] = useState<Supir[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [rutes, setRutes] = useState<Rute[]>([]);
  
  const [formData, setFormData] = useState({
    nomorSuratJalan: '',
    tanggalSuratJalan: formatDateToInput(new Date()),
    truckId: '',
    supirId: '',
    ruteId: '',
    materialId: '',
    kuantitasPengisian: 0,
  });

  const [selectedSupir, setSelectedSupir] = useState<Supir | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedRute, setSelectedRute] = useState<Rute | null>(null);

  // Import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [supirsData, trucksData, materialsData, rutesData] = await Promise.all([
        supirService.getActive(),
        truckService.getActive(),
        materialService.getAll(),
        ruteService.getAll(),
      ]);
      setSupirs(supirsData);
      setTrucks(trucksData);
      setMaterials(materialsData);
      setRutes(rutesData);
    } catch (error) {
      console.error('Failed to load master data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data master',
        variant: 'destructive',
      });
    }
  };

  const handleSupirChange = (supirId: string) => {
    const supir = supirs.find(s => s.id === supirId);
    setSelectedSupir(supir || null);
    setFormData({ ...formData, supirId });
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    setSelectedMaterial(material || null);
    setFormData({ ...formData, materialId });
  };

  const handleRuteChange = (ruteId: string) => {
    const rute = rutes.find(r => r.id === ruteId);
    setSelectedRute(rute || null);
    setFormData({ ...formData, ruteId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.nomorSuratJalan || !formData.truckId || !formData.supirId || 
        !formData.ruteId || !formData.materialId || formData.kuantitasPengisian <= 0) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi dengan benar',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSupir || !selectedMaterial || !selectedRute) {
      toast({
        title: 'Error',
        description: 'Data master tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }

    const truck = trucks.find(t => t.id === formData.truckId);
    if (!truck) {
      toast({
        title: 'Error',
        description: 'Data truck tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }

    try {
      await suratJalanService.create({
        nomorSuratJalan: formData.nomorSuratJalan,
        tanggalSuratJalan: formData.tanggalSuratJalan,
        nomorPolisi: truck.nomorPolisi,
        truckId: formData.truckId,
        namaSupir: selectedSupir.nama,
        supirId: formData.supirId,
        namaPT: selectedSupir.namaPT,
        namaRute: selectedRute.namaRute,
        ruteId: formData.ruteId,
        uangJalan: selectedRute.uangJalan,
        namaMaterial: selectedMaterial.namaMaterial,
        materialId: formData.materialId,
        kuantitasPengisian: formData.kuantitasPengisian,
        satuan: selectedMaterial.satuan,
        status: 'pending',
        createdBy: user?.id || '',
      });

      toast({
        title: 'Berhasil',
        description: `Surat jalan ${formData.nomorSuratJalan} berhasil dibuat dengan status Pending`,
      });

      // Reset form
      setFormData({
        nomorSuratJalan: '',
        tanggalSuratJalan: formatDateToInput(new Date()),
        truckId: '',
        supirId: '',
        ruteId: '',
        materialId: '',
        kuantitasPengisian: 0,
      });
      setSelectedSupir(null);
      setSelectedMaterial(null);
      setSelectedRute(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan surat jalan',
        variant: 'destructive',
      });
    }
  };

  const checkMasterData = () => {
    const issues = [];
    if (supirs.length === 0) issues.push('Supir');
    if (trucks.length === 0) issues.push('Truck');
    if (materials.length === 0) issues.push('Material');
    if (rutes.length === 0) issues.push('Rute');
    return issues;
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
    const template = `Nomor Surat Jalan;Tanggal Surat Jalan;Nomor Polisi;Username Supir;Nama Rute;Nama Material;Kuantitas Pengisian
SJ/2024/001;2024-01-15;B1234XYZ;supir001;Jakarta-Bandung;Pasir;25.5
SJ/2024/002;2024-01-16;B5678ABC;supir002;Surabaya-Malang;Semen;30.0`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_import_surat_jalan.csv';
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

      const dataLines = lines.slice(1); // Skip header
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const line of dataLines) {
        const parts = line.split(';').map(p => p.trim());
        
        if (parts.length < 7) {
          errors.push(`Baris tidak lengkap: ${line.substring(0, 30)}...`);
          errorCount++;
          continue;
        }

        const [nomorSJ, tanggalSJ, nopolTruck, usernameSupir, namaRute, namaMaterial, kuantitasStr] = parts;
        
        // Find master data
        const truck = trucks.find(t => t.nomorPolisi.toLowerCase() === nopolTruck.toLowerCase());
        const supir = supirs.find(s => s.username?.toLowerCase() === usernameSupir.toLowerCase());
        const rute = rutes.find(r => r.namaRute.toLowerCase() === namaRute.toLowerCase());
        const material = materials.find(m => m.namaMaterial.toLowerCase() === namaMaterial.toLowerCase());
        
        if (!truck || !supir || !rute || !material) {
          errors.push(`Data tidak ditemukan di master untuk: ${nomorSJ}`);
          errorCount++;
          continue;
        }

        const kuantitas = parseFloat(kuantitasStr);
        if (isNaN(kuantitas) || kuantitas <= 0) {
          errors.push(`Kuantitas tidak valid untuk: ${nomorSJ}`);
          errorCount++;
          continue;
        }

        try {
          await suratJalanService.create({
            nomorSuratJalan: nomorSJ,
            tanggalSuratJalan: tanggalSJ,
            nomorPolisi: truck.nomorPolisi,
            truckId: truck.id,
            namaSupir: supir.nama,
            supirId: supir.id,
            namaPT: supir.namaPT,
            namaRute: rute.namaRute,
            ruteId: rute.id,
            uangJalan: rute.uangJalan,
            namaMaterial: material.namaMaterial,
            materialId: material.id,
            kuantitasPengisian: kuantitas,
            satuan: material.satuan,
            status: 'pending',
            createdBy: user?.id || '',
          });
          successCount++;
        } catch (error) {
          errors.push(`Gagal menyimpan: ${nomorSJ}`);
          errorCount++;
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
      setImportData('');

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

  const masterDataIssues = checkMasterData();

  if (masterDataIssues.length > 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Input Surat Jalan</h1>
          <p className="text-muted-foreground mt-1">Buat surat jalan baru</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mb-4">
                <Plus className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Master Data Belum Lengkap</h3>
              <p className="text-muted-foreground mb-4">
                Silakan lengkapi master data berikut terlebih dahulu:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {masterDataIssues.map(issue => (
                  <span key={issue} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Input Surat Jalan</h1>
          <p className="text-muted-foreground mt-1">Buat surat jalan baru</p>
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
          <CardTitle>Form Input Surat Jalan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomorSuratJalan">Nomor Surat Jalan *</Label>
                <Input
                  id="nomorSuratJalan"
                  placeholder="SJ/2024/001"
                  value={formData.nomorSuratJalan}
                  onChange={(e) => setFormData({ ...formData, nomorSuratJalan: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggalSuratJalan">Tanggal Surat Jalan *</Label>
                <Input
                  id="tanggalSuratJalan"
                  type="date"
                  value={formData.tanggalSuratJalan}
                  onChange={(e) => setFormData({ ...formData, tanggalSuratJalan: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="truck">Nomor Polisi *</Label>
                <Select value={formData.truckId} onValueChange={(value) => setFormData({ ...formData, truckId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Nomor Polisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.nomorPolisi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supir">Nama Supir *</Label>
                <Select value={formData.supirId} onValueChange={handleSupirChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Supir" />
                  </SelectTrigger>
                  <SelectContent>
                    {supirs.map((supir) => (
                      <SelectItem key={supir.id} value={supir.id}>
                        {supir.nama} - {supir.namaPT}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rute">Nama Rute *</Label>
                <Select value={formData.ruteId} onValueChange={handleRuteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Rute" />
                  </SelectTrigger>
                  <SelectContent>
                    {rutes.map((rute) => (
                      <SelectItem key={rute.id} value={rute.id}>
                        {rute.namaRute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Nama Material *</Label>
                <Select value={formData.materialId} onValueChange={handleMaterialChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.namaMaterial} ({material.satuan})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kuantitasPengisian">Kuantitas Pengisian *</Label>
                <div className="flex gap-2">
                  <Input
                    id="kuantitasPengisian"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.kuantitasPengisian || ''}
                    onChange={(e) => setFormData({ ...formData, kuantitasPengisian: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <Input
                    value={selectedMaterial?.satuan || ''}
                    disabled
                    className="w-24 bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="submit" size="lg">
                <Save className="mr-2 h-4 w-4" />
                Simpan Surat Jalan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Data Surat Jalan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold text-blue-900">Format File CSV:</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Gunakan delimiter titik koma (;)</li>
                <li>Baris pertama adalah header (akan diskip)</li>
                <li>Pastikan semua data master sudah ada (Supir, Truck, Material, Rute)</li>
                <li>Format tanggal: YYYY-MM-DD (contoh: 2024-01-15)</li>
                <li>Username Supir harus sesuai dengan data di master</li>
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
