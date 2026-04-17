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

    // Seed arguidos with realistic Mozambican data
    const arguidosData = [
      {
        numeroProcesso: 'PP-2024/001',
        nomeArguido: 'João Maria Tembe',
        filiacaoPai: 'Maria José Tembe',
        filiacaoMae: 'Ana Paula Tembe',
        dataDetencao: new Date('2024-01-15'),
        dataRemessaJg: new Date('2024-01-18'),
        crime: 'Roubo qualificado',
        medidasAplicadas: 'Prisão preventiva domiciliar',
        magistradoResponsavel: 'Dr. João Silva',
        dataProrrogacao: new Date('2024-04-15'),
        observacao1: 'Arguido confesso, aguarda julgamento',
      },
      {
        numeroProcesso: 'PP-2024/002',
        nomeArguido: 'Francisco Alberto Sitoe',
        filiacaoPai: 'Alberto Sitoe',
        filiacaoMae: 'Teresa Sitoe',
        dataDetencao: new Date('2024-02-10'),
        dataRemessaJg: new Date('2024-02-13'),
        crime: 'Homicídio doloso',
        medidasAplicadas: 'Prisão preventiva no estabelecimento prisional',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2024-03-10'),
        observacao1: 'Caso em fase de investigação complementar',
        observacao2: 'Necessária oitiva de testemunhas',
      },
      {
        numeroProcesso: 'PP-2024/003',
        nomeArguido: 'Manuel José Cossa',
        filiacaoPai: 'José Cossa',
        filiacaoMae: 'Maria Cossa',
        dataDetencao: new Date('2024-03-05'),
        dataRemessaJg: new Date('2024-03-08'),
        crime: 'Corrupção',
        medidasAplicadas: 'Prisão preventiva com medida cautelar',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataProrrogacao: new Date('2024-06-05'),
        remessaJgAlteracao: new Date('2024-07-01'),
        observacao1: 'Arguido funcionário público',
      },
      {
        numeroProcesso: 'PP-2024/004',
        nomeArguido: 'Pedro Simão Mondlane',
        filiacaoPai: 'Simão Mondlane',
        filiacaoMae: 'Helena Mondlane',
        dataDetencao: new Date('2024-04-20'),
        dataRemessaJg: new Date('2024-04-23'),
        crime: 'Tráfico de Drogas',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. João Silva',
        dataRemessaSic: new Date('2024-05-20'),
        observacao1: 'Quantidade: 5kg de substância ilícita',
      },
      {
        numeroProcesso: 'PP-2024/005',
        nomeArguido: 'José Carlos Macamo',
        filiacaoPai: 'Carlos Macamo',
        filiacaoMae: 'Rosa Macamo',
        dataDetencao: new Date('2024-05-12'),
        dataRemessaJg: new Date('2024-05-15'),
        crime: 'Fraude',
        medidasAplicadas: 'Prisão preventiva e apreensão de bens',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataProrrogacao: new Date('2024-08-12'),
        observacao1: 'Valor da fraude: 2.500.000 MT',
        observacao2: 'Arguido reincidente',
      },
      {
        numeroProcesso: 'PP-2024/006',
        nomeArguido: 'Tomás Armando Chissano',
        filiacaoPai: 'Armando Chissano',
        filiacaoMae: 'Joana Chissano',
        dataDetencao: new Date('2024-06-08'),
        dataRemessaJg: new Date('2024-06-11'),
        crime: 'Abuso de Poder',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataRemessaSic: new Date('2024-07-08'),
        observacao1: 'Arguido ex-autarca',
      },
      {
        numeroProcesso: 'PP-2024/007',
        nomeArguido: 'Rafael João Mafumo',
        filiacaoPai: 'João Mafumo',
        filiacaoMae: 'Catarina Mafumo',
        dataDetencao: new Date('2024-07-03'),
        dataRemessaJg: new Date('2024-07-06'),
        crime: 'Falsificação de documentos',
        medidasAplicadas: 'Prisão preventiva cautelar',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataProrrogacao: new Date('2024-10-03'),
        observacao1: 'Documentos falsificados: BI e Passaporte',
      },
      {
        numeroProcesso: 'PP-2024/008',
        nomeArguido: 'Sérgio Manuel Nhabanga',
        filiacaoPai: 'Manuel Nhabanga',
        filiacaoMae: 'Alda Nhabanga',
        dataDetencao: new Date('2024-08-17'),
        dataRemessaJg: new Date('2024-08-20'),
        crime: 'Branqueamento de Capitais',
        medidasAplicadas: 'Prisão preventiva e bloqueio de contas',
        magistradoResponsavel: 'Dr. João Silva',
        dataRemessaSic: new Date('2024-09-17'),
        observacao1: 'Valor envolvido: 15.000.000 MT',
        observacao2: 'Conexão com caso PP-2024/005',
      },
      {
        numeroProcesso: 'PP-2024/009',
        nomeArguido: 'Agostinho Mário Vilanculos',
        filiacaoPai: 'Mário Vilanculos',
        filiacaoMae: 'Esperança Vilanculos',
        dataDetencao: new Date('2024-09-25'),
        dataRemessaJg: new Date('2024-09-28'),
        crime: 'Associação Criminosa',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataProrrogacao: new Date('2024-12-25'),
        observacao1: '3 armas de calibre 9 apreendidas',
      },
      {
        numeroProcesso: 'PP-2024/010',
        nomeArguido: 'Carlos Alberto Nguenha',
        filiacaoPai: 'Alberto Nguenha',
        filiacaoMae: 'Olívia Nguenha',
        dataDetencao: new Date('2024-10-05'),
        dataRemessaJg: new Date('2024-10-08'),
        crime: 'Sequestro',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2024-11-05'),
        observacao1: 'Tentativa de coagir testemunha do caso PP-2024/002',
      },
      {
        numeroProcesso: 'PP-2025/011',
        nomeArguido: 'Daniel Paulo Sitoe',
        filiacaoPai: 'Paulo Sitoe',
        filiacaoMae: 'Mariana Sitoe',
        dataDetencao: new Date('2025-01-10'),
        dataRemessaJg: new Date('2025-01-13'),
        crime: 'Roubo',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. João Silva',
        dataProrrogacao: new Date('2025-04-10'),
        observacao1: 'Arguido menor de idade na data do crime',
      },
      {
        numeroProcesso: 'PP-2025/012',
        nomeArguido: 'Ernesto Lucas Mabote',
        filiacaoPai: 'Lucas Mabote',
        filiacaoMae: 'Tereza Mabote',
        dataDetencao: new Date('2025-02-14'),
        dataRemessaJg: new Date('2025-02-17'),
        crime: 'Peculato',
        medidasAplicadas: 'Prisão preventiva e suspensão de funções',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2025-03-14'),
        observacao1: 'Valor: 5.000.000 MT',
        observacao2: 'Arguido ex-director provincial',
      },
      {
        numeroProcesso: 'PP-2025/013',
        nomeArguido: 'Felipe Domingos Munguambe',
        filiacaoPai: 'Domingos Munguambe',
        filiacaoMae: 'Aurora Munguambe',
        dataDetencao: new Date('2025-03-20'),
        dataRemessaJg: new Date('2025-03-23'),
        crime: 'Fraude',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. Carlos Ferreira',
        dataProrrogacao: new Date('2025-06-20'),
        observacao1: 'Fraude em concurso de provimento',
      },
      {
        numeroProcesso: 'PP-2025/014',
        nomeArguido: 'Gilberto Filipe Mondlane',
        filiacaoPai: 'Filipe Mondlane',
        filiacaoMae: 'Beatriz Mondlane',
        dataDetencao: new Date('2025-04-08'),
        dataRemessaJg: new Date('2025-04-11'),
        crime: 'Corrupção',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dra. Maria Santos',
        dataRemessaSic: new Date('2025-05-08'),
        observacao1: 'Valor total: 850.000 MT',
      },
      {
        numeroProcesso: 'PP-2025/015',
        nomeArguido: 'Hélder Nelson Macamo',
        filiacaoPai: 'Nelson Macamo',
        filiacaoMae: 'Glória Macamo',
        dataDetencao: new Date('2025-05-02'),
        dataRemessaJg: new Date('2025-05-05'),
        crime: 'Violência Doméstica',
        medidasAplicadas: 'Prisão preventiva',
        magistradoResponsavel: 'Dr. João Silva',
        dataProrrogacao: new Date('2025-08-02'),
        observacao1: 'Vítima: esposa do arguido',
        observacao2: 'Medida de protecção emitida',
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
