# 🎬 Mídia Indoor Player

Aplicação React Native para reprodução de mídias em terminais de digital signage, com funcionamento **offline-first**, sincronização automática e controle via painel web.

## 🏗️ Arquitetura

```
App React Native (Player) ←→ Supabase (Backend) ←→ Painel Web (Admin)
```

- **Player (este app):** Reproduz vídeos e imagens em loop contínuo em TV Box Android
- **Supabase:** Auth, PostgreSQL, Storage de vídeos, Realtime push
- **Painel Admin:** Interface web para gerenciar terminais, mídias e playlists

## 📱 Funcionalidades

- ✅ Login com email/senha
- ✅ Listagem de terminais cadastrados
- ✅ Reprodução em loop contínuo (sem controles de usuário)
- ✅ Suporte a vídeo (MP4) e imagens estáticas com timer
- ✅ Download e cache local de mídias (offline-first)
- ✅ Sincronização automática a cada 5 minutos
- ✅ Heartbeat para monitoramento de terminais
- ✅ Modo fullscreen imersivo

## 🚀 Setup

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (para emulador) ou TV Box Android

### Instalação

```bash
# Clonar e instalar
cd midia-indoor-player
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais Supabase
```

### Supabase Setup

1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar a URL e a Anon Key para o `.env`
3. Executar o SQL em `supabase/migration_001_initial.sql` no SQL Editor
4. Criar o primeiro usuário no Auth Dashboard com meta_data:
   ```json
   { "org_id": "00000000-0000-0000-0000-000000000001", "role": "admin" }
   ```

### Executar

```bash
# Dev mode
npx expo start

# Android (emulador ou dispositivo)
npx expo start --android

# Build APK para testes
eas build --platform android --profile preview
```

## 📁 Estrutura do Projeto

```
├── app/                    # Telas (expo-router)
│   ├── _layout.tsx         # Layout raiz
│   ├── index.tsx           # Redirect auth
│   ├── login.tsx           # Tela de login
│   ├── terminals.tsx       # Lista de terminais
│   └── player/[id].tsx     # Player fullscreen
├── src/
│   ├── components/         # Componentes reutilizáveis
│   ├── hooks/              # Custom hooks
│   ├── services/           # Lógica de negócio
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript types
│   └── utils/              # Utilitários
├── supabase/               # Migrations SQL
└── assets/                 # Ícones e splash
```

## 🔄 Fluxo de Sincronização

1. App inicia → Carrega playlist do cache local (MMKV)
2. Se online → Verifica versão da playlist no Supabase
3. Se versão diferente → Baixa novas mídias e remove obsoletas
4. Reproduz em loop contínuo do cache local
5. Repete a cada 5 minutos em background

## 📝 Licença

Proprietário — Todos os direitos reservados.
