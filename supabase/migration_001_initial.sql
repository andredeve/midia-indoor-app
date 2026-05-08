-- =============================================
-- Migração do Banco de Dados — Mídia Indoor Player
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ORGANIZATIONS (Empresas/Clientes)
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. USERS (Usuários vinculados a auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- =============================================
-- 3. TERMINALS (Terminais de reprodução)
-- =============================================
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'syncing')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_info JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terminals_org_id ON terminals(org_id);
CREATE INDEX IF NOT EXISTS idx_terminals_status ON terminals(status);

-- =============================================
-- 4. MEDIA_FILES (Arquivos de mídia)
-- =============================================
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('video/mp4', 'image/jpeg', 'image/png', 'image/webp')),
  file_size BIGINT NOT NULL DEFAULT 0,
  duration_seconds INTEGER, -- NULL para imagens
  checksum TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_files_org_id ON media_files(org_id);

-- =============================================
-- 5. PLAYLISTS (Playlists por terminal)
-- =============================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Playlist Principal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_terminal_id ON playlists(terminal_id);
CREATE INDEX IF NOT EXISTS idx_playlists_active ON playlists(is_active);

-- =============================================
-- 6. PLAYLIST_ITEMS (Itens de cada playlist)
-- =============================================
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  duration_override INTEGER, -- Override de duração para imagens (segundos)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);

-- =============================================
-- 7. TERMINAL_LOGS (Logs de eventos)
-- =============================================
CREATE TABLE IF NOT EXISTS terminal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sync', 'playback_start', 'playback_end', 'error', 'heartbeat')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terminal_logs_terminal_id ON terminal_logs(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_logs_event_type ON terminal_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_terminal_logs_created_at ON terminal_logs(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem dados da sua organização

-- Organizations
CREATE POLICY "Users can view their org"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Users
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Terminals
CREATE POLICY "Users can view org terminals"
  ON terminals FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage org terminals"
  ON terminals FOR ALL
  USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'operator')
  ));

-- Media Files
CREATE POLICY "Users can view org media"
  ON media_files FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage org media"
  ON media_files FOR ALL
  USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'operator')
  ));

-- Playlists
CREATE POLICY "Users can view org playlists"
  ON playlists FOR SELECT
  USING (terminal_id IN (
    SELECT t.id FROM terminals t
    JOIN users u ON t.org_id = u.org_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage org playlists"
  ON playlists FOR ALL
  USING (terminal_id IN (
    SELECT t.id FROM terminals t
    JOIN users u ON t.org_id = u.org_id
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'operator')
  ));

-- Playlist Items
CREATE POLICY "Users can view org playlist items"
  ON playlist_items FOR SELECT
  USING (playlist_id IN (
    SELECT p.id FROM playlists p
    JOIN terminals t ON p.terminal_id = t.id
    JOIN users u ON t.org_id = u.org_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage org playlist items"
  ON playlist_items FOR ALL
  USING (playlist_id IN (
    SELECT p.id FROM playlists p
    JOIN terminals t ON p.terminal_id = t.id
    JOIN users u ON t.org_id = u.org_id
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'operator')
  ));

-- Terminal Logs
CREATE POLICY "Users can insert terminal logs"
  ON terminal_logs FOR INSERT
  WITH CHECK (terminal_id IN (
    SELECT t.id FROM terminals t
    JOIN users u ON t.org_id = u.org_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Users can view org terminal logs"
  ON terminal_logs FOR SELECT
  USING (terminal_id IN (
    SELECT t.id FROM terminals t
    JOIN users u ON t.org_id = u.org_id
    WHERE u.id = auth.uid()
  ));

-- =============================================
-- STORAGE BUCKET
-- =============================================

-- Criar bucket para mídias (executar no SQL Editor ou Dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false,
  524288000, -- 500MB limite por arquivo
  ARRAY['video/mp4', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can read media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- FUNCTIONS (Funções auxiliares)
-- =============================================

-- Função para incrementar versão da playlist ao modificá-la
CREATE OR REPLACE FUNCTION increment_playlist_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE playlists
  SET version = version + 1, updated_at = NOW()
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: incrementar versão quando items são adicionados/removidos
CREATE TRIGGER on_playlist_item_change
  AFTER INSERT OR UPDATE OR DELETE ON playlist_items
  FOR EACH ROW
  EXECUTE FUNCTION increment_playlist_version();

-- Função para auto-criar perfil de usuário após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, org_id, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'org_id')::UUID,
      (SELECT id FROM organizations LIMIT 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-criar perfil quando auth.users recebe novo registro
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- REALTIME (Habilitar para playlists e terminais)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE terminals;

-- =============================================
-- SEED DATA (Dados de exemplo — REMOVER EM PRODUÇÃO)
-- =============================================

-- Criar organização de exemplo
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Demo', 'demo')
ON CONFLICT (id) DO NOTHING;

-- NOTA: O primeiro usuário precisa ser criado via Supabase Auth Dashboard
-- com o meta_data: { "org_id": "00000000-0000-0000-0000-000000000001", "role": "admin" }
