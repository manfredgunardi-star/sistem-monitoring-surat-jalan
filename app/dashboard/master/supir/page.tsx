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
import { supirService } from '@/lib/supabase-storage';
import { Supir } from '@/types';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function SupirPage() {
  const [supirs, setSupirs] = useState<Supir[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupir, setEditingSupir] = useState<Supir | null>(null);
  const [formData, setFormData] = useState({ nama: '', namaPT: '', isActive: true });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await supirService.getAll();
      setSupirs(data);
    } catch (error) {
      console.error('Failed to load supir data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data supir',
        variant: 'destructive'
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
      
      const startIndex = lines[0]?.toLowerCase().includes('nama') ? 1 : 0;
      
      const dataToImport = lines.slice(startIndex).map(line => {
        const parts = line.split(delimiter);
        const nama = parts[0]?.trim() || '';
        const namaPT = parts[1]?.trim() || '';
        return { nama, namaPT };
      }).filter(item => item.nama && item.namaPT);

      if (dataToImport.length === 0) {
        toast({ 
          title: 'Error', 
          description: 'Format data tidak valid. Pastikan format: Nama Supir; Nama PT atau Nama Supir, Nama PT',
          variant: 'destructive'
        });
        return;
      }

      await supirService.bulkCreate(dataToImport);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
      setImportData('');
      setPreviewLines([]);
      toast({ 
        title: 'Berhasil', 
        description: `${dataToImport.length} data supir berhasil diimport` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengimport data',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupir) {
        await supirService.update(editingSupir.id, formData);
        toast({ title: 'Berhasil', description: 'Data supir berhasil diperbarui' });
      } else {
        await supirService.create(formData);
        toast({ title: 'Berhasil', description: 'Data supir berhasil ditambahkan' });
      }
      
      await loadData();
      setIsDialogOpen(false);
      setFormData({ nama: '', namaPT: '', isActive: true });
      setEditingSupir(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal menyimpan data supir',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (supir: Supir) => {
    setEditingSupir(supir);
    setFormData({ nama: supir.nama, namaPT: supir.namaPT, isActive: supir.isActive });
    setIsDialogOpen(true);
  };
  
  const handleToggleStatus = async (supir: Supir) => {
    try {
      await supirService.update(supir.id, { isActive: !supir.isActive });
      await loadData();
      toast({ 
        title: 'Berhasil', 
        description: `Supir ${supir.isActive ? 'dinonaktifkan' : 'diaktifkan'}` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengubah status supir',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await supirService.delete(id);
        await loadData();
        toast({ title: 'Berhasil', description: 'Data supir berhasil dihapus' });
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'Gagal menghapus data supir',
          variant: 'destructive'
        });
      }
    }
  };

  const handleExport = () => {
    const csv = [
      'Nama Supir,Nama PT',
      ...supirs.map(s => `${s.nama},${s.namaPT}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-supir-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Berhasil', description: 'Data berhasil diexport' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Supir</h1>
          <p className="text-muted-foreground mt-1">Kelola data supir</p>
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
                <DialogTitle>Preview Import Data Supir</DialogTitle>
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
                    Format: Nama Supir, Nama PT
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
              <Button onClick={() => { setEditingSupir(null); setFormData({ nama: '', namaPT: '', isActive: true }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Supir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupir ? 'Edit Supir' : 'Tambah Supir'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Supir</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaPT">Nama PT</Label>
                  <Input
                    id="namaPT"
                    value={formData.namaPT}
                    onChange={(e) => setFormData({ ...formData, namaPT: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingSupir ? 'Update' : 'Simpan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Supir ({supirs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Supir</TableHead>
                  <TableHead>Nama Supir</TableHead>
                  <TableHead>Nama PT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supirs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada data supir
                    </TableCell>
                  </TableRow>
                ) : (
                  supirs.map((supir) => (
                    <TableRow key={supir.id}>
                      <TableCell className="font-medium">{supir.id}</TableCell>
                      <TableCell>{supir.nama}</TableCell>
                      <TableCell>{supir.namaPT}</TableCell>
                      <TableCell>
                        <Button
                          variant={supir.isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleStatus(supir)}
                        >
                          {supir.isActive ? 'Aktif' : 'Non Aktif'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supir)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supir.id)}
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
