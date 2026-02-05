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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/lib/supabase-storage';
import { User, UserRole } from '@/types';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'reader' as UserRole,
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data user',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // For editing, only update if password is provided
        const updateData: Partial<User> = {
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await userService.update(editingUser.id, updateData);
        toast({ title: 'Berhasil', description: 'Data user berhasil diperbarui' });
      } else {
        // Check if username already exists
        const existingUser = await userService.getByUsername(formData.username);
        if (existingUser) {
          toast({
            title: 'Error',
            description: 'Username sudah digunakan',
            variant: 'destructive',
          });
          return;
        }

        await userService.create(formData);
        toast({ title: 'Berhasil', description: 'User baru berhasil ditambahkan' });
      }
      
      await loadData();
      setIsDialogOpen(false);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'reader',
        isActive: true,
      });
      setEditingUser(null);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Gagal menyimpan data user',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'diaktifkan' : 'dinonaktifkan';
    
    if (confirm(`Apakah Anda yakin ingin ${action === 'diaktifkan' ? 'mengaktifkan' : 'menonaktifkan'} user ini?`)) {
      try {
        await userService.update(user.id, { isActive: newStatus });
        await loadData();
        toast({ 
          title: 'Berhasil', 
          description: `User berhasil ${action}` 
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal mengubah status user',
          variant: 'destructive',
        });
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-purple-100 text-purple-800',
      input_surat_jalan: 'bg-blue-100 text-blue-800',
      input_kas: 'bg-yellow-100 text-yellow-800',
      input_invoice: 'bg-orange-100 text-orange-800',
      reader: 'bg-green-100 text-green-800',
    };
    
    const labels: Record<UserRole, string> = {
      admin: 'Admin',
      input_surat_jalan: 'Input Surat Jalan',
      input_kas: 'Input Kas',
      input_invoice: 'Input Invoice',
      reader: 'Reader',
    };
    
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'} variant="secondary">
        {labels[role] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen User</h1>
          <p className="text-muted-foreground mt-1">Kelola user dan role</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setEditingUser(null); 
              setFormData({ 
                username: '', 
                password: '', 
                name: '', 
                role: 'reader', 
                isActive: true 
              }); 
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  required={!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Semua Akses)</SelectItem>
                    <SelectItem value="input_surat_jalan">Input Surat Jalan</SelectItem>
                    <SelectItem value="input_kas">Input Kas</SelectItem>
                    <SelectItem value="input_invoice">Input Invoice</SelectItem>
                    <SelectItem value="reader">Reader (Hanya Baca)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="font-normal">User Aktif</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingUser ? 'Update User' : 'Tambah User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada data user
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
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
