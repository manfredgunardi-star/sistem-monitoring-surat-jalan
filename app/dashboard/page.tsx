'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { suratJalanService } from '@/lib/supabase-storage';
import { FileText, FileCheck, FileX, TrendingUp, Receipt, AlertCircle } from 'lucide-react';
import { SuratJalan } from '@/types';
import { formatDate } from '@/lib/date-utils';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    terkirim: 0,
    gagal: 0,
    terinvoice: 0,
    belumInvoice: 0,
  });
  const [recentSuratJalan, setRecentSuratJalan] = useState<SuratJalan[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allSuratJalan = await suratJalanService.getAll();
    const terkirimList = allSuratJalan.filter(sj => sj.status === 'terkirim');
    
    setStats({
      total: allSuratJalan.length,
      pending: allSuratJalan.filter(sj => sj.status === 'pending').length,
      terkirim: terkirimList.length,
      gagal: allSuratJalan.filter(sj => sj.status === 'gagal').length,
      terinvoice: terkirimList.filter(sj => sj.nomorInvoice).length,
      belumInvoice: terkirimList.filter(sj => !sj.nomorInvoice).length,
    });

    // Get 5 most recent surat jalan
    const recent = [...allSuratJalan]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    setRecentSuratJalan(recent);
  };

  const statCards = [
    {
      title: 'Total Surat Jalan',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Terkirim',
      value: stats.terkirim,
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Gagal',
      value: stats.gagal,
      icon: FileX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Terinvoice',
      value: stats.terinvoice,
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Belum Invoice',
      value: stats.belumInvoice,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      terkirim: 'bg-green-100 text-green-800',
      gagal: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan sistem monitoring surat jalan</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Surat Jalan */}
      <Card>
        <CardHeader>
          <CardTitle>Surat Jalan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSuratJalan.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data surat jalan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSuratJalan.map((sj) => (
                <div
                  key={sj.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{sj.nomorSuratJalan}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(sj.status)}`}>
                        {sj.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span>{sj.namaRute}</span>
                      <span className="mx-2">•</span>
                <span>{sj.namaMaterial}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(sj.tanggalSuratJalan)}</span>
              </div>
            </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{sj.nomorPolisi}</p>
                    <p className="text-sm text-muted-foreground">{sj.namaSupir}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
