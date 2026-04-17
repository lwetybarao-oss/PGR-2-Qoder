-- ============================================================
-- PGR - Limpar dados falsos e inserir dados reais de teste
-- Procuradoria-Geral da República de Angola - Província da Lunda-Sul
-- ============================================================

-- 1. LIMPAR DADOS EXISTENTES
DELETE FROM alerta_prazos;
DELETE FROM notificacao_log;
DELETE FROM push_subscriptions;
DELETE FROM arguidos;

-- ============================================================
-- 2. INSERIR ARGUIDOS REAIS
-- Data actual: 2026-04-17
-- 1º prazo: 90 dias a partir da detenção
-- 2º prazo: 90 dias a partir da prorrogação
-- ============================================================

-- ARGUIDO 1: Prazo crítico (vence em 1 dia)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/001/2026', 'João Manuel dos Santos', 'António dos Santos', 'Maria da Conceição Manuel', '2026-01-19', '2026-01-22', 'Corrupção Passiva', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Fernando José da Silva', '2026-01-21', true);

-- ARGUIDO 2: Prazo crítico (vence em 2 dias)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/002/2026', 'Manuel António Pinto', 'José António Pinto', 'Catarina Mendes Pinto', '2026-01-18', '2026-01-20', 'Fraude Qualificada', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Fernando José da Silva', '2026-01-20', true);

-- ARGUIDO 3: Prazo crítico (vence em 3 dias)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/003/2026', 'José Carlos Neto', 'Carlos Augusto Neto', 'Albertina Francisco Neto', '2026-01-17', '2026-01-19', 'Corrupção Passiva', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dra. Ana Maria Tavares', '2026-01-19', true);

-- ARGUIDO 4: Prazo vencido há 2 dias (1º prazo)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/004/2026', 'Fernando Luvumbu Sebastião', 'Sebastião Luvumbu', 'Luísa Fernandes Sebastião', '2026-01-14', '2026-01-16', 'Violência Doméstica', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dra. Ana Maria Tavares', '2026-01-16', true);

-- ARGUIDO 5: Prazo vencido há 5 dias (1º prazo)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/005/2026', 'António Domingos Kiala', 'Domingos Kiala', 'Teresa Joaquina Domingos', '2026-01-11', '2026-01-13', 'Peculato', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Fernando José da Silva', '2026-01-13', true);

-- ARGUIDO 6: Prazo vencido há 8 dias (1º prazo) - VENCIDO
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/006/2026', 'Pedro Camilo Francisco', 'Camilo Francisco', 'Rosa Domingos Camilo', '2026-01-08', '2026-01-10', 'Roubo Qualificado', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Paulo Roberto Mendes', '2026-01-10', true);

-- ARGUIDO 7: Prorrogado - 2º prazo vence em 2 dias
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, data_prorrogacao, ativo) VALUES
('PGR/LS/007/2025', 'Alberto João Chissano', 'João Chissano', 'Mariana da Costa Chissano', '2025-07-15', '2025-07-18', 'Sequestro', 'Prisão Preventiva - Prorrogação concedida por despacho de 15/10/2025', 'Dr. Paulo Roberto Mendes', '2025-07-17', '2025-10-18', true);

-- ARGUIDO 8: Prorrogado - 2º prazo vence em 4 dias
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, data_prorrogacao, ativo) VALUES
('PGR/LS/008/2025', 'Luís Miguel Ngola', 'Miguel Ngola', 'Helena António Ngola', '2025-07-20', '2025-07-22', 'Associação Criminosa', 'Prisão Preventiva - Prorrogação concedida por despacho de 18/10/2025', 'Dra. Ana Maria Tavares', '2025-07-21', '2025-10-19', true);

-- ARGUIDO 9: Prorrogado - 2º prazo vence em 5 dias
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, data_prorrogacao, ativo) VALUES
('PGR/LS/009/2025', 'Ricardo Domingos Pacheco', 'Domingos Pacheco', 'Francisca Lopes Pacheco', '2025-08-01', '2025-08-04', 'Branqueamento de Capitais', 'Prisão Preventiva - Prorrogação concedida por despacho de 30/10/2025', 'Dr. Fernando José da Silva', '2025-08-03', '2025-10-29', true);

-- ARGUIDO 10: Prorrogado - 2º prazo vence em 6 dias
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, data_prorrogacao, ativo) VALUES
('PGR/LS/010/2025', 'Mário Alberto Sebastião', 'Alberto Sebastião', 'Julieta Francisco Alberto', '2025-08-05', '2025-08-07', 'Falsificação de Documentos', 'Prisão Preventiva - Prorrogação concedida por despacho de 02/11/2025', 'Dr. Paulo Roberto Mendes', '2025-08-06', '2025-11-02', true);

-- ARGUIDO 11: Prorrogado - 2º prazo vence em 7 dias (último dia do alerta)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, data_prorrogacao, ativo) VALUES
('PGR/LS/011/2025', 'Jorge Manuel Cassule', 'Manuel Cassule', 'Beatriz Domingos Cassule', '2025-08-10', '2025-08-12', 'Abuso de Poder', 'Prisão Preventiva - Prorrogação concedida por despacho de 08/11/2025', 'Dra. Ana Maria Tavares', '2025-08-11', '2025-11-08', true);

-- ARGUIDO 12: Prazo normal - ainda tem 20 dias
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/012/2026', 'Carlos Eduardo Tembo', 'Eduardo Tembo', 'Sofia Manuel Tembo', '2026-01-28', '2026-01-30', 'Tráfico de Influência', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Fernando José da Silva', '2026-01-30', true);

-- ARGUIDO 13: Prazo normal - ainda tem 45 dias
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/013/2026', 'Augusto José Kalandula', 'José Kalandula', 'Margarida Francisco Augusto', '2026-02-03', '2026-02-05', 'Homicídio Privilegiado', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Paulo Roberto Mendes', '2026-02-05', true);

-- ARGUIDO 14: Prorrogado - 2º prazo ainda tem 30 dias (sem alerta)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, data_prorrogacao, ativo) VALUES
('PGR/LS/014/2025', 'Nelson António Gomes', 'António Gomes', 'Conceição Mateus Gomes', '2025-09-01', '2025-09-03', 'Crime Económico', 'Prisão Preventiva - Prorrogação concedida por despacho de 28/11/2025', 'Dra. Ana Maria Tavares', '2025-09-02', '2025-11-28', true);

-- ARGUIDO 15: Caso recente - detido ontem (prazo: 90 dias a partir de 16/04/2026)
INSERT INTO arguidos (numero_processo, nome_arguido, filiacao_pai, filiacao_mae, data_detencao, data_remessa_jg, crime, medidas_aplicadas, magistrado_responsavel, data_remessa_sic, ativo) VALUES
('PGR/LS/015/2026', 'Valter Tomás Ndala', 'Tomás Ndala', 'Ana Cristina Tomás', '2026-04-16', '2026-04-16', 'Detenção Ilegal de Armas de Fogo', 'Prisão Preventiva - Medida de Coacção nos termos do Art. 202 CPP', 'Dr. Fernando José da Silva', '2026-04-16', true);

-- ============================================================
-- 3. GERAR ALERTAS AUTOMATICAMENTE (simular verificação de prazos)
-- ============================================================

-- Alertas para arguidos com prazo vencido (1º prazo)
INSERT INTO alerta_prazos (arguido_id, tipo, mensagem, criado_data) 
SELECT id, '1_prazo', 
  'PRAZO VENCIDO! Prisão preventiva do processo Nº ' || numero_processo || ' venceu em ' || to_char(data_detencao + 90, 'DD/MM/YYYY'),
  CURRENT_DATE
FROM arguidos 
WHERE ativo = true AND data_detencao IS NOT NULL AND data_prorrogacao IS NULL
  AND (data_detencao + 90) < CURRENT_DATE;

-- Alertas para arguidos com 1º prazo a vencer em <=7 dias
INSERT INTO alerta_prazos (arguido_id, tipo, mensagem, criado_data) 
SELECT id, '1_prazo', 
  'Prisão preventiva do processo Nº ' || numero_processo || ' prazo a terminar: Faltam ' || ((data_detencao + 90) - CURRENT_DATE) || ' dia(s)',
  CURRENT_DATE
FROM arguidos 
WHERE ativo = true AND data_detencao IS NOT NULL AND data_prorrogacao IS NULL
  AND (data_detencao + 90) >= CURRENT_DATE AND (data_detencao + 90) - CURRENT_DATE <= 7;

-- Alertas para arguidos com 2º prazo vencido
INSERT INTO alerta_prazos (arguido_id, tipo, mensagem, criado_data) 
SELECT id, '2_prazo', 
  'PRAZO VENCIDO! 2º prazo do processo Nº ' || numero_processo || ' venceu em ' || to_char(data_prorrogacao + 90, 'DD/MM/YYYY'),
  CURRENT_DATE
FROM arguidos 
WHERE ativo = true AND data_prorrogacao IS NOT NULL
  AND (data_prorrogacao + 90) < CURRENT_DATE;

-- Alertas para arguidos com 2º prazo a vencer em <=7 dias
INSERT INTO alerta_prazos (arguido_id, tipo, mensagem, criado_data) 
SELECT id, '2_prazo', 
  '2º prazo do processo Nº ' || numero_processo || ' prazo a terminar: Faltam ' || ((data_prorrogacao + 90) - CURRENT_DATE) || ' dia(s)',
  CURRENT_DATE
FROM arguidos 
WHERE ativo = true AND data_prorrogacao IS NOT NULL
  AND (data_prorrogacao + 90) >= CURRENT_DATE AND (data_prorrogacao + 90) - CURRENT_DATE <= 7;

-- ============================================================
-- CONFIRMAÇÃO
-- ============================================================
SELECT 'Dados inseridos com sucesso!' AS status;
SELECT 
  (SELECT COUNT(*) FROM arguidos WHERE ativo = true) AS total_arguidos,
  (SELECT COUNT(*) FROM arguidos WHERE ativo = true AND data_prorrogacao IS NOT NULL) AS prorrogados,
  (SELECT COUNT(*) FROM alerta_prazos WHERE tipo IN ('1_prazo', '2_prazo') AND lido = false) AS alertas_activos,
  (SELECT COUNT(*) FROM alerta_prazos WHERE mensagem LIKE '%VENCIDO%') AS prazos_vencidos;
