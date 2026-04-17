import { NextRequest, NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { calcPrazos } from '@/lib/prazos';
import fs from 'fs';
import path from 'path';

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

    // Insignia PGR
    const insigniaPath = path.join(process.cwd(), 'public', 'insignia-pgr.png');
    if (fs.existsSync(insigniaPath)) {
      doc.addImage(insigniaPath, 'PNG', pageW / 2 - 12, y, 24, 24);
      y += 28;
    }

    // Linha decorativa dourada
    doc.setDrawColor(201, 162, 39); // #c9a227
    doc.setLineWidth(1);
    doc.line(margin, y, margin + contentW, y);
    y += 6;

    doc.setTextColor(30, 58, 95); // #1e3a5f
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PGR - Procuradoria-Geral da Republica', pageW / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Republica de Angola', pageW / 2, y, { align: 'center' });
    y += 6;

    // Linha decorativa
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
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
