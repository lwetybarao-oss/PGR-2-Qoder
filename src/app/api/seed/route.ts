import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Create admin user with bcrypt hash
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      await supabase.from('users').insert({
        username: 'admin',
        email: 'feliciofernando567@gmail.com',
        password: hashedPassword,
        name: 'Administrador do Sistema',
        role: 'admin',
        email_notificacoes: true,
      });
    }

    // Seed arguidos com datas actualizadas para 2026
    const arguidosData = [
      // --- VENCIDOS ---
      {
        numero_processo: 'PP-2025/001', nome_arguido: 'João Maria Tembe',
        filiacao_pai: 'Maria José Tembe', filiacao_mae: 'Ana Paula Tembe',
        data_detencao: '2025-06-15', data_remessa_jg: '2025-06-18',
        crime: 'Roubo qualificado', medidas_aplicadas: 'Prisão preventiva domiciliar',
        magistrado_responsavel: 'Dr. João Silva', data_prorrogacao: '2025-09-15',
        observacao1: 'Arguido confesso, aguarda julgamento',
      },
      {
        numero_processo: 'PP-2025/002', nome_arguido: 'Francisco Alberto Sitoe',
        filiacao_pai: 'Alberto Sitoe', filiacao_mae: 'Teresa Sitoe',
        data_detencao: '2025-08-10', data_remessa_jg: '2025-08-13',
        crime: 'Homicídio doloso', medidas_aplicadas: 'Prisão preventiva no estabelecimento prisional',
        magistrado_responsavel: 'Dra. Maria Santos', data_remessa_sic: '2025-09-10',
        observacao1: 'Caso em fase de investigação complementar',
        observacao2: 'Necessária oitiva de testemunhas',
      },
      {
        numero_processo: 'PP-2025/003', nome_arguido: 'Manuel José Cossa',
        filiacao_pai: 'José Cossa', filiacao_mae: 'Maria Cossa',
        data_detencao: '2025-10-05', data_remessa_jg: '2025-10-08',
        crime: 'Corrupção', medidas_aplicadas: 'Prisão preventiva com medida cautelar',
        magistrado_responsavel: 'Dr. Carlos Ferreira', data_prorrogacao: '2026-01-05',
        observacao1: 'Arguido funcionário público',
      },
      // --- CRÍTICO ---
      {
        numero_processo: 'PP-2025/004', nome_arguido: 'Pedro Simão Mondlane',
        filiacao_pai: 'Simão Mondlane', filiacao_mae: 'Helena Mondlane',
        data_detencao: '2026-01-18', data_remessa_jg: '2026-01-21',
        crime: 'Tráfico de Drogas', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dr. João Silva', data_remessa_sic: '2026-02-18',
        observacao1: 'Quantidade: 5kg de substância ilícita',
      },
      {
        numero_processo: 'PP-2025/005', nome_arguido: 'José Carlos Macamo',
        filiacao_pai: 'Carlos Macamo', filiacao_mae: 'Rosa Macamo',
        data_detencao: '2026-01-20', data_remessa_jg: '2026-01-23',
        crime: 'Fraude', medidas_aplicadas: 'Prisão preventiva e apreensão de bens',
        magistrado_responsavel: 'Dra. Maria Santos',
        observacao1: 'Valor da fraude: 2.500.000 MT', observacao2: 'Arguido reincidente',
      },
      // --- ALERTA ---
      {
        numero_processo: 'PP-2026/006', nome_arguido: 'Tomás Armando Chissano',
        filiacao_pai: 'Armando Chissano', filiacao_mae: 'Joana Chissano',
        data_detencao: '2026-01-21', data_remessa_jg: '2026-01-24',
        crime: 'Abuso de Poder', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dr. Carlos Ferreira', data_remessa_sic: '2026-02-14',
        observacao1: 'Arguido ex-autarca',
      },
      {
        numero_processo: 'PP-2026/007', nome_arguido: 'Rafael João Mafumo',
        filiacao_pai: 'João Mafumo', filiacao_mae: 'Catarina Mafumo',
        data_detencao: '2026-01-22', data_remessa_jg: '2026-01-25',
        crime: 'Falsificação de documentos', medidas_aplicadas: 'Prisão preventiva cautelar',
        magistrado_responsavel: 'Dra. Maria Santos', data_prorrogacao: '2026-04-22',
        observacao1: 'Documentos falsificados: BI e Passaporte',
      },
      // --- NORMAL ---
      {
        numero_processo: 'PP-2026/008', nome_arguido: 'Sérgio Manuel Nhabanga',
        filiacao_pai: 'Manuel Nhabanga', filiacao_mae: 'Alda Nhabanga',
        data_detencao: '2026-02-01', data_remessa_jg: '2026-02-04',
        crime: 'Branqueamento de Capitais', medidas_aplicadas: 'Prisão preventiva e bloqueio de contas',
        magistrado_responsavel: 'Dr. João Silva', data_remessa_sic: '2026-03-01',
        observacao1: 'Valor envolvido: 15.000.000 MT', observacao2: 'Conexão com caso PP-2025/005',
      },
      {
        numero_processo: 'PP-2026/009', nome_arguido: 'Agostinho Mário Vilanculos',
        filiacao_pai: 'Mário Vilanculos', filiacao_mae: 'Esperança Vilanculos',
        data_detencao: '2026-02-15', data_remessa_jg: '2026-02-18',
        crime: 'Associação Criminosa', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dr. Carlos Ferreira', data_prorrogacao: '2026-05-15',
        observacao1: '3 armas de calibre 9 apreendidas',
      },
      {
        numero_processo: 'PP-2026/010', nome_arguido: 'Carlos Alberto Nguenha',
        filiacao_pai: 'Alberto Nguenha', filiacao_mae: 'Olívia Nguenha',
        data_detencao: '2026-03-01', data_remessa_jg: '2026-03-04',
        crime: 'Sequestro', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dra. Maria Santos', data_remessa_sic: '2026-04-01',
        observacao1: 'Tentativa de coagir testemunha do caso PP-2025/002',
      },
      {
        numero_processo: 'PP-2026/011', nome_arguido: 'Daniel Paulo Sitoe',
        filiacao_pai: 'Paulo Sitoe', filiacao_mae: 'Mariana Sitoe',
        data_detencao: '2026-03-10', data_remessa_jg: '2026-03-13',
        crime: 'Roubo', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dr. João Silva', data_prorrogacao: '2026-04-08',
        observacao1: 'Arguido menor de idade na data do crime',
      },
      {
        numero_processo: 'PP-2026/012', nome_arguido: 'Ernesto Lucas Mabote',
        filiacao_pai: 'Lucas Mabote', filiacao_mae: 'Tereza Mabote',
        data_detencao: '2026-03-20', data_remessa_jg: '2026-03-23',
        crime: 'Peculato', medidas_aplicadas: 'Prisão preventiva e suspensão de funções',
        magistrado_responsavel: 'Dra. Maria Santos', data_remessa_sic: '2026-04-20',
        observacao1: 'Valor: 5.000.000 MT', observacao2: 'Arguido ex-director provincial',
      },
      {
        numero_processo: 'PP-2026/013', nome_arguido: 'Felipe Domingos Munguambe',
        filiacao_pai: 'Domingos Munguambe', filiacao_mae: 'Aurora Munguambe',
        data_detencao: '2026-04-01', data_remessa_jg: '2026-04-04',
        crime: 'Fraude', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dr. Carlos Ferreira',
        observacao1: 'Fraude em concurso de provimento',
      },
      {
        numero_processo: 'PP-2026/014', nome_arguido: 'Gilberto Filipe Mondlane',
        filiacao_pai: 'Filipe Mondlane', filiacao_mae: 'Beatriz Mondlane',
        data_detencao: '2026-04-08', data_remessa_jg: '2026-04-11',
        crime: 'Corrupção', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dra. Maria Santos', data_remessa_sic: '2026-05-08',
        observacao1: 'Valor total: 850.000 MT',
      },
      {
        numero_processo: 'PP-2026/015', nome_arguido: 'Hélder Nelson Macamo',
        filiacao_pai: 'Nelson Macamo', filiacao_mae: 'Glória Macamo',
        data_detencao: '2026-04-10', data_remessa_jg: '2026-04-13',
        crime: 'Violência Doméstica', medidas_aplicadas: 'Prisão preventiva',
        magistrado_responsavel: 'Dr. João Silva', data_prorrogacao: '2026-04-14',
        observacao1: 'Vítima: esposa do arguido', observacao2: 'Medida de protecção emitida',
      },
    ];

    let created = 0;
    let updated = 0;

    for (const data of arguidosData) {
      const { data: existing } = await supabase
        .from('arguidos')
        .select('id')
        .eq('numero_processo', data.numero_processo)
        .single();

      if (!existing) {
        await supabase.from('arguidos').insert(data);
        created++;
      } else {
        await supabase.from('arguidos').update(data).eq('numero_processo', data.numero_processo);
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Dados criados com sucesso (Supabase). ${created} novos, ${updated} atualizados.`,
      stats: { created, updated }
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Erro ao criar dados de exemplo', details: error.message }, { status: 500 });
  }
}
