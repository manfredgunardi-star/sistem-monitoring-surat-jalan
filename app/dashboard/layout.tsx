'use client';

import React from "react"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Truck, Users, Box, MapPin, FileText, FileCheck, DollarSign, FileSpreadsheet, UserCog } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    { 
      href: '/dashboard', 
      label: 'Dashboard', 
      icon: FileText, 
      roles: ['admin', 'input_surat_jalan', 'input_kas', 'input_invoice', 'reader'] 
    },
    { 
      href: '/dashboard/input-surat-jalan', 
      label: 'Input Surat Jalan', 
      icon: FileText, 
      roles: ['admin', 'input_surat_jalan'] 
    },
    { 
      href: '/dashboard/realisasi', 
      label: 'Realisasi Pengiriman', 
      icon: FileCheck, 
      roles: ['admin', 'input_surat_jalan'] 
    },
    { 
      href: '/dashboard/laporan', 
      label: 'Laporan', 
      icon: FileSpreadsheet, 
      roles: ['admin', 'reader'] 
    },
    { 
      href: '/dashboard/uang-jalan', 
      label: 'Uang Jalan', 
      icon: DollarSign, 
      roles: ['admin', 'input_kas'] 
    },
    { 
      href: '/dashboard/invoice', 
      label: 'Invoice', 
      icon: FileSpreadsheet, 
      roles: ['admin', 'input_invoice'] 
    },
    {
      label: 'Master Data',
      roles: ['admin'],
      isGroup: true,
    },
    { 
      href: '/dashboard/master/supir', 
      label: 'Data Supir', 
      icon: Users, 
      roles: ['admin'] 
    },
    { 
      href: '/dashboard/master/truck', 
      label: 'Data Truck', 
      icon: Truck, 
      roles: ['admin'] 
    },
    { 
      href: '/dashboard/master/material', 
      label: 'Data Material', 
      icon: Box, 
      roles: ['admin'] 
    },
    { 
      href: '/dashboard/master/rute', 
      label: 'Data Rute', 
      icon: MapPin, 
      roles: ['admin'] 
    },
    { 
      href: '/dashboard/users', 
      label: 'Manajemen User', 
      icon: UserCog, 
      roles: ['admin'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 w-full">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="rounded-lg bg-primary p-2 flex-shrink-0">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg truncate">Sistem Monitoring Surat Jalan</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden top-14"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 w-full overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:relative left-0 top-14 h-screen lg:h-auto w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:top-0 overflow-y-auto z-30',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="py-4 px-4">
            <nav className="space-y-1">
              {filteredMenuItems.map((item, index) => {
                if (item.isGroup) {
                  return (
                    <div key={index} className="pt-4 pb-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                        {item.label}
                      </h3>
                    </div>
                  );
                }
                
                const Icon = item.icon!;
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors text-sm font-medium"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 lg:p-6 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
