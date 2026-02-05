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
import { materialService } from '@/lib/supabase-storage';
import { Material } from '@/types';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function MaterialPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({ namaMaterial: '', satuan: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [previewLines, setPreviewLines] = useState<string[]>([]);
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
      
      const startIndex = lines[0]?.toLowerCase().includes('material') || lines[0]?.toLowerCase().includes('satuan') ? 1 : 0;
      
      const dataToImport = lines.slice(startIndex).map(line => {
        const parts = line.split(delimiter);
        const namaMaterial = parts[0]?.trim() || '';
        const satuan = parts[1]?.trim() || '';
        return { namaMaterial, satuan };
      }).filter(item => item.namaMaterial && item.satuan);

      if (dataToImport.length === 0) {
        toast({ 
          title: 'Error', 
          description: 'Format data tidak valid. Pastikan format: Nama Material; Satuan atau Nama Material, Satuan',
          variant: 'destructive'
        });
        return;
      }

      await materialService.bulkCreate(dataToImport);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
      setImportData('');
      setPreviewLines([]);
      toast({ 
        title: 'Berhasil', 
        description: `${dataToImport.length} data material berhasil diimport` 
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
      const data = await materialService.getAll();
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load material data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data material',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMaterial) {
        await materialService.update(editingMaterial.id, formData);
        toast({ title: 'Berhasil', description: 'Data material berhasil diperbarui' });
      } else {
        await materialService.create(formData);
        toast({ title: 'Berhasil', description: 'Data material berhasil ditambahkan' });
      }
      
      await loadData();
      setIsDialogOpen(false);
      setFormData({ namaMaterial: '', satuan: '' });
      setEditingMaterial(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal menyimpan data material',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({ namaMaterial: material.namaMaterial, satuan: material.satuan });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await materialService.delete(id);
        await loadData();
        toast({ title: 'Berhasil', description: 'Data material berhasil dihapus' });
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'Gagal menghapus data material',
          variant: 'destructive'
        });
      }
    }
  };

  const handleExport = () => {
    const csv = [
      'Nama Material,Satuan',
      ...materials.map(m => `${m.namaMaterial},${m.satuan}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-material-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Berhasil', description: 'Data berhasil diexport' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Material</h1>
          <p className="text-muted-foreground mt-1">Kelola data material</p>
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
                <DialogTitle>Preview Import Data Material</DialogTitle>
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
                    Format: Nama Material, Satuan
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
              <Button onClick={() => { setEditingMaterial(null); setFormData({ namaMaterial: '', satuan: '' }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Edit Material' : 'Tambah Material'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namaMaterial">Nama Material</Label>
                  <Input
                    id="namaMaterial"
                    value={formData.namaMaterial}
                    onChange={(e) => setFormData({ ...formData, namaMaterial: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    placeholder="Ton, M3, Kg, dll"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingMaterial ? 'Update' : 'Simpan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Material ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Material</TableHead>
                  <TableHead>Nama Material</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada data material
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.id}</TableCell>
                      <TableCell>{material.namaMaterial}</TableCell>
                      <TableCell>{material.satuan}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(material)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id)}
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
