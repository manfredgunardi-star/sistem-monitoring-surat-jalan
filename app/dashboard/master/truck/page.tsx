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
import { truckService } from '@/lib/supabase-storage';
import { Truck } from '@/types';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function TruckPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState({ nomorPolisi: '', isActive: true });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
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
      
      const startIndex = lines[0]?.toLowerCase().includes('nomor') || lines[0]?.toLowerCase().includes('polisi') ? 1 : 0;
      
      const dataToImport = lines.slice(startIndex).map(line => {
        const nomorPolisi = line.trim();
        return { nomorPolisi };
      }).filter(item => item.nomorPolisi);

      if (dataToImport.length === 0) {
        toast({ 
          title: 'Error', 
          description: 'Format data tidak valid. Pastikan setiap baris berisi nomor polisi',
          variant: 'destructive'
        });
        return;
      }

      await truckService.bulkCreate(dataToImport);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
      setImportData('');
      setPreviewLines([]);
      toast({ 
        title: 'Berhasil', 
        description: `${dataToImport.length} data truck berhasil diimport` 
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
      const data = await truckService.getAll();
      setTrucks(data);
    } catch (error) {
      console.error('Failed to load truck data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data truck',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTruck) {
        await truckService.update(editingTruck.id, formData);
        toast({ title: 'Berhasil', description: 'Data truck berhasil diperbarui' });
      } else {
        await truckService.create(formData);
        toast({ title: 'Berhasil', description: 'Data truck berhasil ditambahkan' });
      }
      
      await loadData();
      setIsDialogOpen(false);
      setFormData({ nomorPolisi: '', isActive: true });
      setEditingTruck(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal menyimpan data truck',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({ nomorPolisi: truck.nomorPolisi, isActive: truck.isActive });
    setIsDialogOpen(true);
  };
  
  const handleToggleStatus = async (truck: Truck) => {
    try {
      await truckService.update(truck.id, { isActive: !truck.isActive });
      await loadData();
      toast({ 
        title: 'Berhasil', 
        description: `Truck ${truck.isActive ? 'dinonaktifkan' : 'diaktifkan'}` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengubah status truck',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await truckService.delete(id);
        await loadData();
        toast({ title: 'Berhasil', description: 'Data truck berhasil dihapus' });
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'Gagal menghapus data truck',
          variant: 'destructive'
        });
      }
    }
  };

  const handleExport = () => {
    const csv = [
      'Nomor Polisi',
      ...trucks.map(t => t.nomorPolisi)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-truck-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Berhasil', description: 'Data berhasil diexport' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Truck</h1>
          <p className="text-muted-foreground mt-1">Kelola data truck</p>
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
                <DialogTitle>Preview Import Data Truck</DialogTitle>
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
                    Format: Nomor Polisi
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
              <Button onClick={() => { setEditingTruck(null); setFormData({ nomorPolisi: '', isActive: true }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Truck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTruck ? 'Edit Truck' : 'Tambah Truck'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorPolisi">Nomor Polisi</Label>
                  <Input
                    id="nomorPolisi"
                    value={formData.nomorPolisi}
                    onChange={(e) => setFormData({ ...formData, nomorPolisi: e.target.value })}
                    placeholder="B 1234 ABC"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTruck ? 'Update' : 'Simpan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Truck ({trucks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Truck</TableHead>
                  <TableHead>Nomor Polisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trucks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada data truck
                    </TableCell>
                  </TableRow>
                ) : (
                  trucks.map((truck) => (
                    <TableRow key={truck.id}>
                      <TableCell className="font-medium">{truck.id}</TableCell>
                      <TableCell>{truck.nomorPolisi}</TableCell>
                      <TableCell>
                        <Button
                          variant={truck.isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleStatus(truck)}
                        >
                          {truck.isActive ? 'Aktif' : 'Non Aktif'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(truck)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(truck.id)}
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
