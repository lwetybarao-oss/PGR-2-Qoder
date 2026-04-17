// ============================================================
// Utilitário Partilhado: Cálculo de Prazos e Urgência
// Baseado na lógica original do Django (models.py + services.py)
//
// NÍVEIS DE URGÊNCIA (iguais ao Django):
//   - vencido:  dias < 0
//   - critico:  0 <= dias <= 3
//   - alerta:   4 <= dias <= 7
//   - normal:   dias > 7
//
// PRAZOS:
//   - 1º prazo: dataDetencao + 90 dias
//   - 2º prazo: dataProrrogacao + 90 dias (se existir)
// ============================================================

const ALERT_THRESHOLD_DAYS = 7;
const CRITICAL_THRESHOLD_DAYS = 3;

export interface PrazosCalculados {
  fim1Prazo: Date;
  fim2Prazo: Date | null;
  diasRestantes1: number;
  diasRestantes2: number | null;
  statusPrazo: 'vencido' | 'critico' | 'alerta' | 'normal';
}

/**
 * Adiciona dias a uma data (cópia, não muta a original)
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calcula a diferença em dias entre duas datas (normalizadas à meia-noite).
 * Retorna número inteiro: positivo se date2 é futuro, negativo se é passado.
 * Usa Math.round para evitar problemas de DST/horas fracionadas.
 */
export function diffDays(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Retorna a data de hoje normalizada à meia-noite (horário local).
 */
export function todayNormalized(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Classifica a urgência de um prazo baseado nos dias restantes.
 * 4 níveis conforme o Django original:
 *   - vencido:  dias < 0
 *   - critico:  0..3 dias
 *   - alerta:   4..7 dias
 *   - normal:   > 7 dias
 */
export function classificarUrgencia(dias: number): 'vencido' | 'critico' | 'alerta' | 'normal' {
  if (dias < 0) return 'vencido';
  if (dias <= CRITICAL_THRESHOLD_DAYS) return 'critico';
  if (dias <= ALERT_THRESHOLD_DAYS) return 'alerta';
  return 'normal';
}

/**
 * Determina o status de pior nível entre dois prazos.
 * Ordem de prioridade: vencido > critico > alerta > normal
 */
function piorStatus(s1: string, s2: string | null): 'vencido' | 'critico' | 'alerta' | 'normal' {
  const prioridade: Record<string, number> = { normal: 0, alerta: 1, critico: 2, vencido: 3 };
  const p1 = prioridade[s1] || 0;
  const p2 = s2 ? (prioridade[s2] || 0) : -1;
  const pior = Math.max(p1, p2);
  if (pior >= 3) return 'vencido';
  if (pior >= 2) return 'critico';
  if (pior >= 1) return 'alerta';
  return 'normal';
}

/**
 * Calcula todos os prazos para um arguido.
 * Usa a mesma lógica do Django models.py (dataDetencao + 90, dataProrrogacao + 90)
 */
export function calcPrazos(arguido: any): any {
  const today = todayNormalized();

  const detDate = new Date(arguido.dataDetencao);
  const fim1Prazo = addDays(detDate, 90);
  const diasRestantes1 = diffDays(today, fim1Prazo);
  const status1 = classificarUrgencia(diasRestantes1);

  let fim2Prazo: Date | null = null;
  let diasRestantes2: number | null = null;
  let status2: string | null = null;

  if (arguido.dataProrrogacao) {
    const prorDate = new Date(arguido.dataProrrogacao);
    fim2Prazo = addDays(prorDate, 90);
    diasRestantes2 = diffDays(today, fim2Prazo);
    status2 = classificarUrgencia(diasRestantes2);
  }

  const statusPrazo = piorStatus(status1, status2);

  return {
    ...arguido,
    fim1Prazo,
    fim2Prazo,
    diasRestantes1,
    diasRestantes2,
    statusPrazo,
  };
}

/**
 * Verifica se algum prazo de um arguido está vencido
 */
export function temPrazoVencido(arguido: any): boolean {
  const today = todayNormalized();
  const detDate = new Date(arguido.dataDetencao);
  const dias1 = diffDays(today, addDays(detDate, 90));
  if (dias1 < 0) return true;
  if (arguido.dataProrrogacao) {
    const dias2 = diffDays(today, addDays(new Date(arguido.dataProrrogacao), 90));
    if (dias2 < 0) return true;
  }
  return false;
}

/**
 * Verifica se algum prazo de um arguido está em alerta ou critico (<= 7 dias, não vencido)
 */
export function temPrazoEmAlerta(arguido: any): boolean {
  const today = todayNormalized();
  const detDate = new Date(arguido.dataDetencao);
  const dias1 = diffDays(today, addDays(detDate, 90));
  if (dias1 >= 0 && dias1 <= ALERT_THRESHOLD_DAYS) return true;
  if (arguido.dataProrrogacao) {
    const dias2 = diffDays(today, addDays(new Date(arguido.dataProrrogacao), 90));
    if (dias2 >= 0 && dias2 <= ALERT_THRESHOLD_DAYS) return true;
  }
  return false;
}
