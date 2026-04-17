import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialização preguiçosa (lazy) para evitar crash se env vars não existem
let _supabase: SupabaseClient | null = null;
let _supabaseClient: SupabaseClient | null = null;

function getEnvOrThrow(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Variável de ambiente ${key} não configurada. Verifique as Environment Variables na Vercel.`);
  }
  return val;
}

// Client para uso no servidor (service_role) - bypass RLS
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      getEnvOrThrow('NEXT_PUBLIC_SUPABASE_URL'),
      getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabase;
}

// Alias para compatibilidade com código existente
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

// Client para uso no cliente (anon key) - sujeito a RLS
export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(
      getEnvOrThrow('NEXT_PUBLIC_SUPABASE_URL'),
      getEnvOrThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    );
  }
  return _supabaseClient;
}

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

// Helper: Converter nome de coluna camelCase → snake_case para Supabase
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// Helper: Converter nome de coluna snake_case → camelCase do Supabase
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Converter array de snake_case para camelCase
export function toCamelCaseArray(arr: Record<string, any>[]): Record<string, any>[] {
  return arr.map(toCamelCase);
}

// Mapeamento de nomes de colunas: Prisma (camelCase) → Supabase (snake_case)
export const COLUMN_MAP: Record<string, string> = {
  numeroProcesso: 'numero_processo',
  nomeArguido: 'nome_arguido',
  filiacaoPai: 'filiacao_pai',
  filiacaoMae: 'filiacao_mae',
  dataDetencao: 'data_detencao',
  dataRemessaJg: 'data_remessa_jg',
  dataRegresso: 'data_regresso',
  medidasAplicadas: 'medidas_aplicadas',
  magistradoResponsavel: 'magistrado_responsavel',
  dataRemessaSic: 'data_remessa_sic',
  dataProrrogacao: 'data_prorrogacao',
  remessaJgAlteracao: 'remessa_jg_alteracao',
  arguidoId: 'arguido_id',
  criadoEm: 'criado_em',
  atualizadoEm: 'atualizado_em',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  emailNotificacoes: 'email_notificacoes',
  userId: 'user_id',
};
