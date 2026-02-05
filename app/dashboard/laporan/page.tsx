'use client';

import { useEffect, useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { suratJalanService } from '@/lib/supabase-storage';
import { SuratJalan, SuratJalanStatus } from '@/types';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

export default function LaporanPage() {
  const { toast } = useToast();
  const [suratJalans, setSuratJalans] = useState<SuratJalan[]>([]);
  const [filteredData, setFilteredData] = useState<SuratJalan[]>([]);
  
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    nomorSuratJalan: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, suratJalans]);

  const loadData = async () => {
    try {
      const data = await suratJalanService.getAll();
      setSuratJalans(data);
    } catch (error) {
      console.error('Failed to load surat jalan data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data surat jalan',
        variant: 'destructive',
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...suratJalans];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(sj => sj.status === filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(sj => sj.tanggalSuratJalan >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(sj => sj.tanggalSuratJalan <= filters.endDate);
    }

    // Filter by nomor surat jalan
    if (filters.nomorSuratJalan) {
      filtered = filtered.filter(sj => 
        sj.nomorSuratJalan.toLowerCase().includes(filters.nomorSuratJalan.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Tidak ada data',
        description: 'Tidak ada data untuk diexport',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'ID',
      'Nomor Surat Jalan',
      'Tanggal Surat Jalan',
      'Status',
      'Nomor Polisi',
      'Nama Supir',
      'Nama PT',
      'Nama Rute',
      'Uang Jalan',
      'Nama Material',
      'Satuan',
      'Kuantitas Pengisian',
      'Tanggal Pengiriman',
      'Kuantitas Terkirim',
      'Nomor Invoice',
      'Tanggal Invoice',
    ];

    const rows = filteredData.map(sj => [
      sj.id,
      sj.nomorSuratJalan,
      sj.tanggalSuratJalan,
      sj.status.toUpperCase(),
      sj.nomorPolisi,
      sj.namaSupir,
      sj.namaPT,
      sj.namaRute,
      sj.uangJalan,
      sj.namaMaterial,
      sj.satuan,
      sj.kuantitasPengisian,
      sj.tanggalPengiriman || '-',
      sj.kuantitasTerkirim || '-',
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
    a.download = `laporan-surat-jalan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Berhasil',
      description: `${filteredData.length} data berhasil diexport`,
    });
  };

  const getStatusBadge = (status: SuratJalanStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      terkirim: 'bg-green-100 text-green-800',
      gagal: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
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
          <h1 className="text-3xl font-bold">Laporan Surat Jalan</h1>
          <p className="text-muted-foreground mt-1">Lihat dan export data surat jalan</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export ke CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="terkirim">Terkirim</SelectItem>
                  <SelectItem value="gagal">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomorSuratJalan">Nomor Surat Jalan</Label>
              <Input
                id="nomorSuratJalan"
                placeholder="Cari nomor..."
                value={filters.nomorSuratJalan}
                onChange={(e) => setFilters({ ...filters, nomorSuratJalan: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredData.length} dari {suratJalans.length} data
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ status: 'all', startDate: '', endDate: '', nomorSuratJalan: '' })}
            >
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Data Surat Jalan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada data</p>
              <p className="text-sm mt-1">Sesuaikan filter atau tambahkan data baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. SJ</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nopol</TableHead>
                    <TableHead>Supir</TableHead>
                    <TableHead>Rute</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Qty Pengisian</TableHead>
                    <TableHead className="text-right">Qty Terkirim</TableHead>
                    <TableHead className="text-right">Uang Jalan</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((sj) => (
                <TableRow key={sj.id}>
                  <TableCell className="font-medium">{sj.nomorSuratJalan}</TableCell>
                  <TableCell>{formatDate(sj.tanggalSuratJalan)}</TableCell>
                  <TableCell>{getStatusBadge(sj.status)}</TableCell>
                  <TableCell>{sj.nomorPolisi}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sj.namaSupir}</p>
                          <p className="text-xs text-muted-foreground">{sj.namaPT}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sj.namaRute}</TableCell>
                      <TableCell>
                        {sj.namaMaterial}
                        <span className="text-xs text-muted-foreground ml-1">({sj.satuan})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {sj.kuantitasPengisian} {sj.satuan}
                      </TableCell>
                      <TableCell className="text-right">
                        {sj.kuantitasTerkirim ? `${sj.kuantitasTerkirim} ${sj.satuan}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sj.uangJalan)}
                      </TableCell>
                      <TableCell>
                        {sj.nomorInvoice ? (
                          <div className="text-xs">
                            <p className="font-medium">{sj.nomorInvoice}</p>
                {sj.tanggalInvoice && (
                  <p className="text-muted-foreground">
                    {formatDate(sj.tanggalInvoice)}
                  </p>
                )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
