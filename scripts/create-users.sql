-- Create user accounts untuk production
-- Password hash untuk semua: 'password123' (bcrypt)

-- Admin user
INSERT INTO public.users (id, username, password_hash, nama_lengkap, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001'::UUID,
  'admin',
  '$2a$10$rVqXYFKqQnvvEXdYnBJSQ.dQw7MqF8YN9qYTlhxvxQK0M5wF0Fb/C',
  'Admin User',
  'admin',
  true
) ON CONFLICT (username) DO NOTHING;

-- Input operator user
INSERT INTO public.users (id, username, password_hash, nama_lengkap, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000002'::UUID,
  'operator1',
  '$2a$10$rVqXYFKqQnvvEXdYnBJSQ.dQw7MqF8YN9qYTlhxvxQK0M5wF0Fb/C',
  'Operator 1',
  'input',
  true
) ON CONFLICT (username) DO NOTHING;

-- Reader user
INSERT INTO public.users (id, username, password_hash, nama_lengkap, role, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000003'::UUID,
  'viewer1',
  '$2a$10$rVqXYFKqQnvvEXdYnBJSQ.dQw7MqF8YN9qYTlhxvxQK0M5wF0Fb/C',
  'Viewer 1',
  'reader',
  true
) ON CONFLICT (username) DO NOTHING;

-- Verify users created
SELECT id, username, nama_lengkap, role, is_active FROM public.users ORDER BY created_at;
