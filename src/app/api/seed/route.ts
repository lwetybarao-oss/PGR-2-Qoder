import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Create admin user
    const existingAdmin = await db.user.findUnique({ where: { username: 'admin' } });
    if (!existingAdmin) {
      await db.user.create({
        data: {
          username: 'admin',
          password: 'admin123',
          name: 'Administrador do Sistema'
        }
      });
    }

    // Seed arguidos com datas actualizadas para 2026
    // (hoje ≈ Abril 2026, para que haja variedade de estados)
    const arguidosData = [
      // --- VENCIDOS (1º prazo já passou) ---
      {
        numeroProcesso: 'PP-2025/001',
        nomeArguido: 'João Maria Tembe',
        filiacaoPai: 'Maria José Tembe',
        filiacaoMae: 'Ana Paula Tembe',
        dataDetencao: new Date('2025-06-15'),
        dataRemessaJg: new Date('2025-06-18'),
        crime: 'Roubo qualificado',
        medidasAplicadas: 'Prisão preventiva domiciliar',
        magistradoResponsavel: 'Dr. João Silva',
        dataProrrogacao: new Date('2025-09-15'),
        observacao1: 'Arguido confesso, aguarda julgamento',
      },
      {
        numeroProcesso: 'PP-2025/002',
        nomeArguido: 'Francisco Alberto Sitoe',
        filiacaoPai: 'Alberto Sitoe',
        filiacaoMae: 'Teresa Sitoe',
        dataDetencao: new Date('2025-08-10'),
        dataRemessaJg: new Date('2025-08-13'),
        crime: 'Homicídio doloso',
        medidasAplicadas: 'Prisão preventiva no estabelecimento prisional',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2025-09-10'),
        observacao1: 'Caso em fase de investigação complementar',
        observacao2: 'Necessária oitiva de testemunhas',
      },
      {
        numeroProcesso: 'PP-2025/003',
        nomeArguido: 'Manuel José Cossa',
        filiacaoPai: 'José Cossa',
        filiacaoMae: 'Maria Cossa',
        dataDetencao: new Date('2025-10-05'),
        dataRemessaJg: new Date('2025-10-08'),
        crime: 'Corrupção',
        medidasAplicadas: 'Prisão preventiva com medida cautelar',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataProrrogacao: new Date('2026-01-05'),
        observacao1: 'Arguido funcionário público',
      },

      // --- CRÍTICO (0-3 dias para o prazo) ---
      {
        numeroProcesso: 'PP-2025/004',
        nomeArguido: 'Pedro Simão Mondlane',
        filiacaoPai: 'Simão Mondlane',
        filiacaoMae: 'Helena Mondlane',
        dataDetencao: new Date('2026-01-18'),  // prazo: 2026-04-18 → 1 dia
        dataRemessaJg: new Date('2026-01-21'),
        crime: 'Tráfico de Drogas',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. João Silva',
        dataRemessaSic: new Date('2026-02-18'),
        observacao1: 'Quantidade: 5kg de substância ilícita',
      },
      {
        numeroProcesso: 'PP-2025/005',
        nomeArguido: 'José Carlos Macamo',
        filiacaoPai: 'Carlos Macamo',
        filiacaoMae: 'Rosa Macamo',
        dataDetencao: new Date('2026-01-20'),  // prazo: 2026-04-20 → 3 dias
        dataRemessaJg: new Date('2026-01-23'),
        crime: 'Fraude',
        medidasAplicadas: 'Prisão preventiva e apreensão de bens',
        magistradoResponsavel: 'Dra. Maria Santos',
        observacao1: 'Valor da fraude: 2.500.000 MT',
        observacao2: 'Arguido reincidente',
      },

      // --- ALERTA (4-7 dias para o prazo) ---
      {
        numeroProcesso: 'PP-2026/006',
        nomeArguido: 'Tomás Armando Chissano',
        filiacaoPai: 'Armando Chissano',
        filiacaoMae: 'Joana Chissano',
        dataDetencao: new Date('2026-01-21'),  // prazo: 2026-04-21 → 4 dias
        dataRemessaJg: new Date('2026-01-24'),
        crime: 'Abuso de Poder',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataRemessaSic: new Date('2026-02-14'),
        observacao1: 'Arguido ex-autarca',
      },
      {
        numeroProcesso: 'PP-2026/007',
        nomeArguido: 'Rafael João Mafumo',
        filiacaoPai: 'João Mafumo',
        filiacaoMae: 'Catarina Mafumo',
        dataDetencao: new Date('2026-01-22'),  // prazo: 2026-04-22 → 5 dias
        dataRemessaJg: new Date('2026-01-25'),
        crime: 'Falsificação de documentos',
        medidasAplicadas: 'Prisão preventiva cautelar',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataProrrogacao: new Date('2026-04-22'),
        observacao1: 'Documentos falsificados: BI e Passaporte',
      },

      // --- NORMAL (> 7 dias) ---
      {
        numeroProcesso: 'PP-2026/008',
        nomeArguido: 'Sérgio Manuel Nhabanga',
        filiacaoPai: 'Manuel Nhabanga',
        filiacaoMae: 'Alda Nhabanga',
        dataDetencao: new Date('2026-02-01'),
        dataRemessaJg: new Date('2026-02-04'),
        crime: 'Branqueamento de Capitais',
        medidasAplicadas: 'Prisão preventiva e bloqueio de contas',
        magistradoResponsavel: 'Dr. João Silva',
        dataRemessaSic: new Date('2026-03-01'),
        observacao1: 'Valor envolvido: 15.000.000 MT',
        observacao2: 'Conexão com caso PP-2025/005',
        // 1º prazo: 2026-05-02 → normal (>30 dias)
      },
      {
        numeroProcesso: 'PP-2026/009',
        nomeArguido: 'Agostinho Mário Vilanculos',
        filiacaoPai: 'Mário Vilanculos',
        filiacaoMae: 'Esperança Vilanculos',
        dataDetencao: new Date('2026-02-15'),
        dataRemessaJg: new Date('2026-02-18'),
        crime: 'Associação Criminosa',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataProrrogacao: new Date('2026-05-15'),
        observacao1: '3 armas de calibre 9 apreendidas',
        // 1º prazo: 2026-05-16 → normal; 2º prazo: 2026-08-13
      },
      {
        numeroProcesso: 'PP-2026/010',
        nomeArguido: 'Carlos Alberto Nguenha',
        filiacaoPai: 'Alberto Nguenha',
        filiacaoMae: 'Olívia Nguenha',
        dataDetencao: new Date('2026-03-01'),
        dataRemessaJg: new Date('2026-03-04'),
        crime: 'Sequestro',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2026-04-01'),
        observacao1: 'Tentativa de coagir testemunha do caso PP-2025/002',
        // 1º prazo: 2026-05-30 → normal
      },
      {
        numeroProcesso: 'PP-2026/011',
        nomeArguido: 'Daniel Paulo Sitoe',
        filiacaoPai: 'Paulo Sitoe',
        filiacaoMae: 'Mariana Sitoe',
        dataDetencao: new Date('2026-03-10'),
        dataRemessaJg: new Date('2026-03-13'),
        crime: 'Roubo',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. João Silva',
        dataProrrogacao: new Date('2026-04-08'),
        observacao1: 'Arguido menor de idade na data do crime',
        // 1º prazo: 2026-06-08 → normal; 2º prazo: 2026-07-07 → normal
      },
      {
        numeroProcesso: 'PP-2026/012',
        nomeArguido: 'Ernesto Lucas Mabote',
        filiacaoPai: 'Lucas Mabote',
        filiacaoMae: 'Tereza Mabote',
        dataDetencao: new Date('2026-03-20'),
        dataRemessaJg: new Date('2026-03-23'),
        crime: 'Peculato',
        medidasAplicadas: 'Prisão preventiva e suspensão de funções',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2026-04-20'),
        observacao1: 'Valor: 5.000.000 MT',
        observacao2: 'Arguido ex-director provincial',
        // 1º prazo: 2026-06-18 → normal
      },
      {
        numeroProcesso: 'PP-2026/013',
        nomeArguido: 'Felipe Domingos Munguambe',
        filiacaoPai: 'Domingos Munguambe',
        filiacaoMae: 'Aurora Munguambe',
        dataDetencao: new Date('2026-04-01'),
        dataRemessaJg: new Date('2026-04-04'),
        crime: 'Fraude',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        observacao1: 'Fraude em concurso de provimento',
        // 1º prazo: 2026-06-30 → normal
      },
      {
        numeroProcesso: 'PP-2026/014',
        nomeArguido: 'Gilberto Filipe Mondlane',
        filiacaoPai: 'Filipe Mondlane',
        filiacaoMae: 'Beatriz Mondlane',
        dataDetencao: new Date('2026-04-08'),
        dataRemessaJg: new Date('2026-04-11'),
        crime: 'Corrupção',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2026-05-08'),
        observacao1: 'Valor total: 850.000 MT',
        // 1º prazo: 2026-07-07 → normal
      },
      {
        numeroProcesso: 'PP-2026/015',
        nomeArguido: 'Hélder Nelson Macamo',
        filiacaoPai: 'Nelson Macamo',
        filiacaoMae: 'Glória Macamo',
        dataDetencao: new Date('2026-04-10'),
        dataRemessaJg: new Date('2026-04-13'),
        crime: 'Violência Doméstica',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. João Silva',
        dataProrrogacao: new Date('2026-04-14'),
        observacao1: 'Vítima: esposa do arguido',
        observacao2: 'Medida de protecção emitida',
        // 1º prazo: 2026-07-09 → normal; 2º prazo: 2026-07-13 → normal
      },
    ];

    let created = 0;
    let updated = 0;

    for (const data of arguidosData) {
      const existing = await db.arguido.findUnique({ where: { numeroProcesso: data.numeroProcesso } });
      if (!existing) {
        await db.arguido.create({ data });
        created++;
      } else {
        await db.arguido.update({ where: { numeroProcesso: data.numeroProcesso }, data });
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Dados criados com sucesso. ${created} novos, ${updated} atualizados.`,
      stats: { created, updated }
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Erro ao criar dados de exemplo' }, { status: 500 });
  }
}
