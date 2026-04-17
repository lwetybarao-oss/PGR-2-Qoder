-- ============================================================
-- PGR - Sistema de Controlo de Arguidos
-- Schema completo para Supabase (PostgreSQL)
-- Procuradoria-Geral da República de Angola
-- ============================================================

-- 1. TABELA: users
-- Utilizadores do sistema com suporte a autenticação e reset de senha
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      TEXT NOT NULL,  -- hash bcrypt
  name          VARCHAR(255),
  role          VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'magistrado')),
  ativo         BOOLEAN DEFAULT true,
  email_notificacoes BOOLEAN DEFAULT true, -- receber alertas por email
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: password_reset_tokens
-- Tokens para redefinição de senha
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: arguidos
-- Dados dos arguidos em prisão preventiva
-- ============================================================
CREATE TABLE IF NOT EXISTS arguidos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo        VARCHAR(100) UNIQUE NOT NULL,
  nome_arguido           VARCHAR(255) NOT NULL,
  filiacao_pai           VARCHAR(255),
  filiacao_mae           VARCHAR(255),
  data_detencao          DATE NOT NULL,
  data_remessa_jg        DATE,
  data_regresso          DATE,
  crime                  VARCHAR(255) NOT NULL,
  medidas_aplicadas      TEXT,
  magistrado_responsavel VARCHAR(255) NOT NULL,
  data_remessa_sic       DATE,
  data_prorrogacao       DATE,
  remessa_jg_alteracao   DATE,
  observacao1            TEXT,
  observacao2            TEXT,
  ativo                  BOOLEAN DEFAULT true,
  criado_em              TIMESTAMPTZ DEFAULT now(),
  atualizado_em          TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: alerta_prazos
-- Alertas gerados automaticamente baseados nos prazos
-- ============================================================
CREATE TABLE IF NOT EXISTS alerta_prazos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arguido_id  UUID NOT NULL REFERENCES arguidos(id) ON DELETE CASCADE,
  tipo        VARCHAR(50) NOT NULL CHECK (tipo IN ('1_prazo', '2_prazo', 'sistema', 'manual')),
  mensagem    TEXT NOT NULL,
  lido        BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT now(),
  criado_data DATE DEFAULT CURRENT_DATE
);

-- 5. TABELA: push_subscriptions
-- Subscrições push notification (persistidas na BD)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint  TEXT UNIQUE NOT NULL,
  p256dh    TEXT NOT NULL,
  auth      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABELA: notificacao_log
-- Log de notificações enviadas (email + push)
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacao_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arguido_id   UUID REFERENCES arguidos(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  tipo         VARCHAR(50) NOT NULL CHECK (tipo IN ('email', 'push', 'sistema')),
  titulo       VARCHAR(255) NOT NULL,
  mensagem     TEXT NOT NULL,
  status       VARCHAR(50) DEFAULT 'enviada' CHECK (status IN ('enviada', 'falhou', 'pendente')),
  destinatario VARCHAR(255),
  criado_em    TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA: configuracoes_sistema
-- Configurações gerais do sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_arguidos_numero_processo ON arguidos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_arguidos_nome ON arguidos(nome_arguido);
CREATE INDEX IF NOT EXISTS idx_arguidos_crime ON arguidos(crime);
CREATE INDEX IF NOT EXISTS idx_arguidos_magistrado ON arguidos(magistrado_responsavel);
CREATE INDEX IF NOT EXISTS idx_arguidos_ativo ON arguidos(ativo);
CREATE INDEX IF NOT EXISTS idx_arguidos_data_detencao ON arguidos(data_detencao);
CREATE INDEX IF NOT EXISTS idx_arguidos_criado_em ON arguidos(criado_em);

CREATE INDEX IF NOT EXISTS idx_alerta_prazos_arguido ON alerta_prazos(arguido_id);
CREATE INDEX IF NOT EXISTS idx_alerta_prazos_tipo ON alerta_prazos(tipo);
CREATE INDEX IF NOT EXISTS idx_alerta_prazos_lido ON alerta_prazos(lido);
CREATE INDEX IF NOT EXISTS idx_alerta_prazos_criado_em ON alerta_prazos(criado_em);
-- Nota: Não usamos date(criado_em) em índice porque date() é STABLE, não IMMUTABLE
-- A verificação de duplicados por dia é feita via range de timestamp nas queries

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_notificacao_log_arguido ON notificacao_log(arguido_id);
CREATE INDEX IF NOT EXISTS idx_notificacao_log_tipo ON notificacao_log(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacao_log_criado_em ON notificacao_log(criado_em);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_arguidos_updated_at BEFORE UPDATE ON arguidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_configuracoes_updated_at BEFORE UPDATE ON configuracoes_sistema
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNÇÕES ÚTEIS
-- ============================================================

-- Função para verificar prazos e gerar alertas automaticamente
-- Pode ser chamada via pg_cron ou manualmente
CREATE OR REPLACE FUNCTION verificar_prazos_e_gerar_alertas()
RETURNS TABLE(
  arguido_id UUID,
  tipo VARCHAR(50),
  mensagem TEXT,
  dias INTEGER,
  urgencia VARCHAR(20)
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_fim DATE;
  v_dias INTEGER;
  v_mensagem TEXT;
  v_urgencia VARCHAR(20);
  v_existe BIGINT;
BEGIN
  -- Verificar 1º prazo de todos os arguidos activos
  FOR arg_rec IN SELECT id, numero_processo, data_detencao FROM arguidos WHERE ativo = true
  LOOP
    v_fim := arg_rec.data_detencao + 90;
    v_dias := v_fim - v_today;

    IF v_dias <= 7 THEN
      -- Classificar urgência
      IF v_dias < 0 THEN
        v_urgencia := 'vencido';
        v_mensagem := 'PRAZO VENCIDO! Prisão preventiva do processo Nº ' || arg_rec.numero_processo ||
                     ' venceu há ' || ABS(v_dias) || ' dia(s) em ' || to_char(v_fim, 'DD/MM/YYYY');
      ELSIF v_dias = 0 THEN
        v_urgencia := 'critico';
        v_mensagem := 'URGENTE! Prisão preventiva do processo Nº ' || arg_rec.numero_processo || ' vence HOJE!';
      ELSIF v_dias <= 3 THEN
        v_urgencia := 'critico';
        v_mensagem := 'Prisão preventiva do processo Nº ' || arg_rec.numero_processo ||
                     ' quase a terminar: Faltam ' || v_dias || ' dia(s)';
      ELSE
        v_urgencia := 'alerta';
        v_mensagem := 'Prisão preventiva do processo Nº ' || arg_rec.numero_processo ||
                     ' prazo a terminar: Faltam ' || v_dias || ' dia(s)';
      END IF;

      -- Evitar duplicados no mesmo dia (usa coluna criado_data que é IMMUTABLE)
      SELECT COUNT(*) INTO v_existe FROM alerta_prazos
        WHERE arguido_id = arg_rec.id AND tipo = '1_prazo'
        AND criado_data = v_today;

      IF v_existe = 0 THEN
        INSERT INTO alerta_prazos (arguido_id, tipo, mensagem)
        VALUES (arg_rec.id, '1_prazo', v_mensagem);

        arguido_id := arg_rec.id;
        tipo := '1_prazo';
        mensagem := v_mensagem;
        dias := v_dias;
        urgencia := v_urgencia;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;

  -- Verificar 2º prazo (prorrogação)
  FOR arg_rec IN SELECT id, numero_processo, data_prorrogacao FROM arguidos
    WHERE ativo = true AND data_prorrogacao IS NOT NULL
  LOOP
    v_fim := arg_rec.data_prorrogacao + 90;
    v_dias := v_fim - v_today;

    IF v_dias <= 7 THEN
      IF v_dias < 0 THEN
        v_urgencia := 'vencido';
        v_mensagem := 'PRAZO VENCIDO! 2º prazo do processo Nº ' || arg_rec.numero_processo ||
                     ' venceu há ' || ABS(v_dias) || ' dia(s) em ' || to_char(v_fim, 'DD/MM/YYYY');
      ELSIF v_dias = 0 THEN
        v_urgencia := 'critico';
        v_mensagem := 'URGENTE! 2º prazo do processo Nº ' || arg_rec.numero_processo || ' vence HOJE!';
      ELSIF v_dias <= 3 THEN
        v_urgencia := 'critico';
        v_mensagem := '2º prazo do processo Nº ' || arg_rec.numero_processo ||
                     ' quase a terminar: Faltam ' || v_dias || ' dia(s)';
      ELSE
        v_urgencia := 'alerta';
        v_mensagem := '2º prazo do processo Nº ' || arg_rec.numero_processo ||
                     ' prazo a terminar: Faltam ' || v_dias || ' dia(s)';
      END IF;

      SELECT COUNT(*) INTO v_existe FROM alerta_prazos
        WHERE arguido_id = arg_rec.id AND tipo = '2_prazo'
        AND criado_data = v_today;

      IF v_existe = 0 THEN
        INSERT INTO alerta_prazos (arguido_id, tipo, mensagem)
        VALUES (arg_rec.id, '2_prazo', v_mensagem);

        arguido_id := arg_rec.id;
        tipo := '2_prazo';
        mensagem := v_mensagem;
        dias := v_dias;
        urgencia := v_urgencia;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA: Utilizador admin + dados de exemplo
-- NOTA: Password default = admin123 (hash bcrypt)
-- ============================================================

-- Inserir admin (password: admin123)
INSERT INTO users (username, email, password, name, role, email_notificacoes)
VALUES (
  'admin',
  'feliciofernando567@gmail.com',
  '$2b$10$8cDVtXOjnto5IVOd2OcSDumliPi2DHk0ZwlwtwlkZvG0clkWhDLVO',
  'Administrador do Sistema',
  'admin',
  true
) ON CONFLICT (username) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO configuracoes_sistema (chave, valor) VALUES
  ('alerta_email_ativo', 'true'),
  ('alerta_push_ativo', 'true'),
  ('prazo_alerta_dias', '7'),
  ('prazo_critico_dias', '3'),
  ('email_remetente', 'feliciofernando567@gmail.com'),
  ('nome_sistema', 'PGR - Sistema de Gestão de Arguidos'),
  ('provincia', 'Lunda-Sul')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- RLS (Row Level Security) - OPCIONAL
-- Activar se precisar de segurança por linha
-- Por padrão, desactivado para uso interno
-- ============================================================

-- Para activar RLS, descomente as linhas abaixo:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE arguidos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerta_prazos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notificacao_log ENABLE ROW LEVEL SECURITY;

-- Políticas para service_role key (bypass RLS via Supabase)
-- CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.role() = 'service_role');
-- CREATE POLICY "Service role full access" ON arguidos FOR ALL USING (auth.role() = 'service_role');
-- CREATE POLICY "Service role full access" ON alerta_prazos FOR ALL USING (auth.role() = 'service_role');
-- CREATE POLICY "Service role full access" ON push_subscriptions FOR ALL USING (auth.role() = 'service_role');
-- CREATE POLICY "Service role full access" ON notificacao_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- PERMISSÕES (Grant para anon e authenticated)
-- Ajuste conforme necessário
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
