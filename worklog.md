---
Task ID: 1
Agent: Main Agent
Task: Migrar sistema PGR de SQLite/Prisma para Supabase + Email + PWA + Notificações

Work Log:
- Analisou estado actual do projecto (Next.js 16, Prisma SQLite, 2374 linhas page.tsx)
- Criou schema SQL completo para Supabase (7 tabelas, índices, triggers, funções)
- Instalou dependências: @supabase/supabase-js, nodemailer, bcryptjs
- Actualizou .env com credenciais Supabase e Gmail SMTP
- Criou src/lib/supabase.ts (cliente Supabase service_role + helpers camelCase)
- Criou src/lib/email.ts (SMTP Gmail, templates: alerta prazo, resumo diário, reset senha)
- Migradas todas as API routes: auth/login, arguidos, alertas, dashboard, seed, CSV, push
- Criadas novas rotas: auth/forgot-password, auth/reset-password, auth/change-password
- Push subscriptions agora persistidas no Supabase (não mais in-memory)
- Adicionadas views ForgotPasswordView e ResetPasswordView no page.tsx
- Adicionado link "Esqueceu a sua palavra-passe?" na tela de login
- Verificação de prazos agora envia email automático + resumo diário
- Senhas agora guardadas com hash bcrypt
- Build bem-sucedido (19 rotas API + 1 página principal)
- SQL completo salvo em /home/z/my-project/download/supabase-schema.sql

Stage Summary:
- Sistema migrado para Supabase PostgreSQL
- Notificações Gmail SMTP implementadas
- Funcionalidade de redefinição de senha adicionada
- PWA com service worker e push notifications
- SQL completo pronto para Supabase Dashboard
