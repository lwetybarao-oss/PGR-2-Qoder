import { NextRequest, NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { calcPrazos } from '@/lib/prazos';

// Insignia PGR embutida como base64 (sem leitura de filesystem)
const INSIGNIA_B64 = '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';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 10) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    // Buscar arguido no Supabase
    const { data: arguido, error } = await supabase
      .from('arguidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !arguido) {
      return NextResponse.json({ error: 'Arguido nao encontrado' }, { status: 404 });
    }

    const a = calcPrazos(toCamelCase(arguido));

    // Gerar PDF com jspdf
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;

    // --- CABECALHO (sem cor de fundo) ---
    let y = 15;

    // Insignia PGR (base64 embutido) - imagem 367x415, aspect ratio 0.884
    const insigniaW = 30;
    const insigniaH = 34;
    doc.addImage(INSIGNIA_B64, 'PNG', pageW / 2 - insigniaW / 2, y, insigniaW, insigniaH);
    y += insigniaH + 4;

    doc.setTextColor(30, 58, 95); // #1e3a5f
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PGR - Procuradoria-Geral da Republica', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Republica de Angola', pageW / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Ficha do Arguido em Prisao Preventiva', pageW / 2, y, { align: 'center' });
    y += 10;

    // --- DADOS PESSOAIS ---
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS PESSOAIS', margin, y);
    y += 2;
    doc.setDrawColor(249, 166, 1);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 7;

    const fields1 = [
      ['Processo N.', a.numeroProcesso || '-'],
      ['Nome do Arguido', a.nomeArguido || '-'],
      ['Filiacao (Pai)', a.filiacaoPai || '-'],
      ['Filiacao (Mae)', a.filiacaoMae || '-'],
    ];

    const fields2 = [
      ['Data de Detencao', formatDatePT(a.dataDetencao)],
      ['Data Remessa JG', formatDatePT(a.dataRemessaJg)],
      ['Data Regresso', formatDatePT(a.dataRegresso)],
      ['Crime', a.crime || '-'],
    ];

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);

    for (const [label, value] of fields1) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 45, y);
      y += 6;
    }

    y += 3;
    for (const [label, value] of fields2) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 45, y);
      y += 6;
    }

    y += 5;

    // --- PROCESSO ---
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACOES DO PROCESSO', margin, y);
    y += 2;
    doc.setDrawColor(249, 166, 1);
    doc.line(margin, y, margin + contentW, y);
    y += 7;

    const fields3 = [
      ['Magistrado Responsavel', a.magistradoResponsavel || '-'],
      ['Medidas Aplicadas', a.medidasAplicadas || '-'],
      ['Data Remessa SIC', formatDatePT(a.dataRemessaSic)],
      ['Data Prorrogacao', formatDatePT(a.dataProrrogacao)],
      ['Remessa JG Alteracao', formatDatePT(a.remessaJgAlteracao)],
    ];

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);

    for (const [label, value] of fields3) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      const valStr = String(value);
      // Se o texto for muito longo, quebrar em multiplas linhas
      const maxWidth = contentW - 50;
      const lines = doc.splitTextToSize(valStr, maxWidth);
      doc.text(lines, margin + 50, y);
      y += lines.length * 5 + 1;
    }

    y += 5;

    // --- PRAZOS ---
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTROLO DE PRAZOS', margin, y);
    y += 2;
    doc.setDrawColor(249, 166, 1);
    doc.line(margin, y, margin + contentW, y);
    y += 7;

    // Status badge color
    const statusColors: Record<string, [number, number, number]> = {
      vencido: [220, 38, 38],
      critico: [249, 115, 22],
      alerta: [245, 158, 11],
      normal: [34, 197, 94],
    };
    const statusLabels: Record<string, string> = {
      vencido: 'VENCIDO',
      critico: 'CRITICO',
      alerta: 'ALERTA',
      normal: 'NORMAL',
    };

    const [sr, sg, sb] = statusColors[a.statusPrazo] || [100, 100, 100];
    doc.setFillColor(sr, sg, sb);
    doc.roundedRect(margin, y - 4, 40, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(statusLabels[a.statusPrazo] || a.statusPrazo.toUpperCase(), margin + 20, y + 1, { align: 'center' });
    y += 10;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);

    const prazoFields = [
      ['1o Prazo (Fim)', formatDatePT(a.fim1Prazo)],
      ['Dias Restantes (1o)', a.diasRestantes1 !== null ? String(a.diasRestantes1) : '-'],
      ['2o Prazo (Fim)', formatDatePT(a.fim2Prazo)],
      ['Dias Restantes (2o)', a.diasRestantes2 !== null ? String(a.diasRestantes2) : '-'],
      ['Status do Prazo', statusLabels[a.statusPrazo] || a.statusPrazo],
    ];

    for (const [label, value] of prazoFields) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), margin + 50, y);
      y += 6;
    }

    y += 5;

    // --- OBSERVACOES ---
    if (a.observacao1 || a.observacao2) {
      // Verificar se precisa nova pagina
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(30, 58, 95);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACOES', margin, y);
      y += 2;
      doc.setDrawColor(249, 166, 1);
      doc.line(margin, y, margin + contentW, y);
      y += 7;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);

      if (a.observacao1) {
        doc.setFont('helvetica', 'bold');
        doc.text('Observacao 1:', margin, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(a.observacao1), contentW - 10);
        doc.text(lines, margin + 5, y + 5);
        y += lines.length * 5 + 8;
      }

      if (a.observacao2) {
        doc.setFont('helvetica', 'bold');
        doc.text('Observacao 2:', margin, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(String(a.observacao2), contentW - 10);
        doc.text(lines, margin + 5, y + 5);
        y += lines.length * 5 + 8;
      }
    }

    // --- RODAPE ---
    const footerY = 285;
    doc.setFillColor(30, 58, 95);
    doc.rect(0, footerY - 5, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('PGR - Procuradoria-Geral da Republica de Angola | Sistema de Gestao de Arguidos', pageW / 2, footerY, { align: 'center' });
    doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-AO')} as ${new Date().toLocaleTimeString('pt-AO')}`, pageW / 2, footerY + 5, { align: 'center' });
    doc.text('Documento confidencial - Uso restrito a pessoal autorizado', pageW / 2, footerY + 10, { align: 'center' });

    // Nome do ficheiro
    const nomeFicheiro = (a.nomeArguido || 'arguido')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ficha_${nomeFicheiro}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Ficha PDF error:', error);
    return NextResponse.json({ error: 'Erro ao gerar ficha PDF', details: error.message }, { status: 500 });
  }
}

function formatDatePT(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
}
