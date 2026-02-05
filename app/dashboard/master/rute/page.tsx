'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ruteService } from '@/lib/supabase-storage';
import { Rute } from '@/types';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function RutePage() {
  const [rutes, setRutes] = useState<Rute[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRute, setEditingRute] = useState<Rute | null>(null);
  const [formData, setFormData] = useState({ namaRute: '', uangJalan: 0 });
  const [importData, setImportData] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportData(text);
      
      const lines = text.trim().split('\n');
      const preview = lines.slice(0, 5);
      setPreviewLines(preview);
      setIsImportDialogOpen(true);
    };
    reader.readAsText(file);
  };

  const processImport = async () => {
    try {
      const lines = importData.trim().split('\n').filter(line => line.trim());
      
      const firstLine = lines[0] || '';
      const delimiter = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
      
      const startIndex = lines[0]?.toLowerCase().includes('rute') || lines[0]?.toLowerCase().includes('uang') ? 1 : 0;
      
      const dataToImport = lines.slice(startIndex).map(line => {
        const parts = line.split(delimiter);
        const namaRute = parts[0]?.trim() || '';
        const uangJalanStr = parts[1]?.trim() || '0';
        const uangJalan = parseFloat(uangJalanStr);
        return { namaRute, uangJalan };
      }).filter(item => item.namaRute && !isNaN(item.uangJalan));

      if (dataToImport.length === 0) {
        toast({ 
          title: 'Error', 
          description: 'Format data tidak valid. Pastikan format: Nama Rute; Uang Jalan atau Nama Rute, Uang Jalan',
          variant: 'destructive'
        });
        return;
      }

      await ruteService.bulkCreate(dataToImport);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
      setImportData('');
      setPreviewLines([]);
      toast({ 
        title: 'Berhasil', 
        description: `${dataToImport.length} data rute berhasil diimport` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengimport data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await ruteService.getAll();
      setRutes(data);
    } catch (error) {
      console.error('Failed to load rute data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data rute',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRute) {
        await ruteService.update(editingRute.id, formData);
        toast({ title: 'Berhasil', description: 'Data rute berhasil diperbarui' });
      } else {
        await ruteService.create(formData);
        toast({ title: 'Berhasil', description: 'Data rute berhasil ditambahkan' });
      }
      
      await loadData();
      setIsDialogOpen(false);
      setFormData({ namaRute: '', uangJalan: 0 });
      setEditingRute(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal menyimpan data rute',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (rute: Rute) => {
    setEditingRute(rute);
    setFormData({ namaRute: rute.namaRute, uangJalan: rute.uangJalan });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await ruteService.delete(id);
        await loadData();
        toast({ title: 'Berhasil', description: 'Data rute berhasil dihapus' });
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'Gagal menghapus data rute',
          variant: 'destructive'
        });
      }
    }
  };

  const handleExport = () => {
    const csv = [
      'Nama Rute,Uang Jalan',
      ...rutes.map(r => `${r.namaRute},${r.uangJalan}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-rute-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Berhasil', description: 'Data berhasil diexport' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Rute</h1>
          <p className="text-muted-foreground mt-1">Kelola data rute</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Preview Import Data Rute</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preview (maksimal 5 baris)</Label>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    {previewLines.map((line, idx) => (
                      <div key={idx} className="whitespace-pre-wrap break-all">
                        {line}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Format: Nama Rute, Uang Jalan
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={processImport} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportData('');
                      setPreviewLines([]);
                      setIsImportDialogOpen(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingRute(null); setFormData({ namaRute: '', uangJalan: 0 }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Rute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRute ? 'Edit Rute' : 'Tambah Rute'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namaRute">Nama Rute</Label>
                  <Input
                    id="namaRute"
                    value={formData.namaRute}
                    onChange={(e) => setFormData({ ...formData, namaRute: e.target.value })}
                    placeholder="Jakarta - Surabaya"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uangJalan">Uang Jalan (IDR)</Label>
                  <Input
                    id="uangJalan"
                    type="number"
                    value={formData.uangJalan}
                    onChange={(e) => setFormData({ ...formData, uangJalan: parseFloat(e.target.value) || 0 })}
                    placeholder="500000"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingRute ? 'Update' : 'Simpan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Rute ({rutes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Rute</TableHead>
                  <TableHead>Nama Rute</TableHead>
                  <TableHead className="text-right">Uang Jalan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada data rute
                    </TableCell>
                  </TableRow>
                ) : (
                  rutes.map((rute) => (
                    <TableRow key={rute.id}>
                      <TableCell className="font-medium">{rute.id}</TableCell>
                      <TableCell>{rute.namaRute}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(rute.uangJalan)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rute)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rute.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
