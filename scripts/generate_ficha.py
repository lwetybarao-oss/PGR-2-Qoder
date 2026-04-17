#!/usr/bin/env python3
"""
Gerador de Ficha PDF do Arguido - PGR Lunda-Sul
Cria uma ficha profissional em PDF com dados completos do arguido,
cabecalho institucional com brasao de Angola, prazos e alertas.
"""

import sys
import os
import json
import re
import subprocess
from datetime import datetime, date, timedelta

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ============================================================
# Register fonts
# ============================================================
FONT_DIR = '/usr/share/fonts/truetype'
pdfmetrics.registerFont(TTFont('Calibri', os.path.join(FONT_DIR, 'english', 'calibri-regular.ttf')))
pdfmetrics.registerFont(TTFont('CalibriB', os.path.join(FONT_DIR, 'english', 'calibri-bold.ttf')))
pdfmetrics.registerFont(TTFont('CalibriI', os.path.join(FONT_DIR, 'english', 'calibri-italic.ttf')))
pdfmetrics.registerFont(TTFont('CalibriBI', os.path.join(FONT_DIR, 'english', 'calibri-bold-italic.ttf')))

pdfmetrics.registerFontFamily(
    'Calibri',
    normal='Calibri',
    bold='CalibriB',
    italic='CalibriI',
    boldItalic='CalibriBI'
)

# ============================================================
# Colors
# ============================================================
DARK_BLUE = HexColor('#1a2e44')
MEDIUM_BLUE = HexColor('#1e3a5f')
GOLD = HexColor('#c9a227')
LIGHT_GRAY = HexColor('#f5f5f5')
MEDIUM_GRAY = HexColor('#e0e0e0')
DARK_GRAY = HexColor('#333333')
TEXT_COLOR = HexColor('#222222')
RED_BG = HexColor('#fee2e2')
RED_TEXT = HexColor('#b91c1c')
ORANGE_BG = HexColor('#fff7ed')
ORANGE_TEXT = HexColor('#c2410c')
AMBER_BG = HexColor('#fffbeb')
AMBER_TEXT = HexColor('#92400e')
GREEN_BG = HexColor('#f0fdf4')
GREEN_TEXT = HexColor('#15803d')
BLUE_BG = HexColor('#eff6ff')
BLUE_TEXT = HexColor('#1d4ed8')

PAGE_W, PAGE_H = A4
LEFT_MARGIN = 20 * mm
RIGHT_MARGIN = 20 * mm
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ============================================================
# Styles
# ============================================================
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    'HeaderRepublic',
    fontName='CalibriB', fontSize=13, textColor=DARK_BLUE,
    alignment=TA_CENTER, spaceAfter=0, spaceBefore=0, leading=16,
))
styles.add(ParagraphStyle(
    'HeaderPGR',
    fontName='CalibriB', fontSize=15, textColor=DARK_BLUE,
    alignment=TA_CENTER, spaceAfter=0, spaceBefore=0, leading=20,
))
styles.add(ParagraphStyle(
    'HeaderProvince',
    fontName='CalibriB', fontSize=12, textColor=GOLD,
    alignment=TA_CENTER, spaceAfter=0, spaceBefore=0, leading=16,
))
styles.add(ParagraphStyle(
    'SectionTitle',
    fontName='CalibriB', fontSize=11, textColor=white,
    alignment=TA_LEFT, spaceAfter=0, spaceBefore=6, leading=14,
))
styles.add(ParagraphStyle(
    'FieldLabel',
    fontName='CalibriB', fontSize=9, textColor=DARK_GRAY,
    alignment=TA_LEFT, spaceAfter=1, spaceBefore=0, leading=12,
))
styles.add(ParagraphStyle(
    'FieldValue',
    fontName='Calibri', fontSize=9.5, textColor=TEXT_COLOR,
    alignment=TA_LEFT, spaceAfter=0, spaceBefore=0, leading=13,
))
styles.add(ParagraphStyle(
    'FieldLarge',
    fontName='Calibri', fontSize=10, textColor=TEXT_COLOR,
    alignment=TA_LEFT, spaceAfter=0, spaceBefore=0, leading=14,
))
styles.add(ParagraphStyle(
    'AlertText',
    fontName='Calibri', fontSize=8.5, textColor=TEXT_COLOR,
    alignment=TA_LEFT, spaceAfter=0, spaceBefore=0, leading=12,
))
styles.add(ParagraphStyle(
    'FooterStyle',
    fontName='CalibriI', fontSize=7, textColor=HexColor('#999999'),
    alignment=TA_CENTER, spaceAfter=0, spaceBefore=0, leading=10,
))
styles.add(ParagraphStyle(
    'DocTitle',
    fontName='CalibriB', fontSize=14, textColor=DARK_BLUE,
    alignment=TA_CENTER, spaceAfter=2, spaceBefore=4, leading=18,
))
styles.add(ParagraphStyle(
    'StatusLabel',
    fontName='CalibriB', fontSize=9, alignment=TA_CENTER,
    spaceAfter=0, spaceBefore=0, leading=12,
))


def fmt_date(d):
    if not d:
        return '-'
    try:
        if isinstance(d, str):
            if 'T' in d:
                dt = datetime.fromisoformat(d.replace('Z', '+00:00'))
            else:
                dt = datetime.strptime(d[:10], '%Y-%m-%d')
        elif isinstance(d, (date, datetime)):
            dt = d
        else:
            return str(d)
        return dt.strftime('%d/%m/%Y')
    except Exception:
        return str(d)[:10] if d else '-'


def status_colors(status):
    mapping = {
        'vencido': (RED_BG, RED_TEXT, 'VENCIDO'),
        'critico': (ORANGE_BG, ORANGE_TEXT, 'CRITICO'),
        'alerta': (AMBER_BG, AMBER_TEXT, 'ALERTA'),
        'normal': (GREEN_BG, GREEN_TEXT, 'NORMAL'),
    }
    return mapping.get(status, (LIGHT_GRAY, DARK_GRAY, status.upper() if status else '-'))


def build_section_header(title):
    t = Table(
        [[Paragraph(title, styles['SectionTitle'])]],
        colWidths=[CONTENT_W], rowHeights=[7 * mm]
    )
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK_BLUE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROUNDEDCORNERS', [3, 3, 0, 0]),
    ]))
    return t


def build_field_row(label, value, value_style='FieldValue'):
    lbl = Paragraph(f'{label}:', styles['FieldLabel'])
    if isinstance(value, str):
        val = Paragraph(value if value else '-', styles[value_style])
    else:
        val = value
    t = Table([[lbl, val]], colWidths=[42 * mm, CONTENT_W - 42 * mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    return t


def build_two_fields(label1, value1, label2, value2):
    col_w = (CONTENT_W - 6 * mm) / 2
    row_labels = [
        Paragraph(f'{label1}:', styles['FieldLabel']),
        Paragraph(f'{label2}:', styles['FieldLabel']),
    ]
    row_values = [
        Paragraph(str(value1) if value1 else '-', styles['FieldValue']),
        Paragraph(str(value2) if value2 else '-', styles['FieldValue']),
    ]
    t = Table([row_labels, row_values], colWidths=[col_w, col_w])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, MEDIUM_GRAY),
        ('LEFTPADDING', (1, 0), (1, -1), 6),
    ]))
    return t


def build_three_fields(label1, value1, label2, value2, label3, value3):
    col_w = (CONTENT_W - 8 * mm) / 3
    row_labels = []
    row_values = []
    for lbl, val in [(label1, value1), (label2, value2), (label3, value3)]:
        row_labels.append(Paragraph(f'{lbl}:', styles['FieldLabel']))
        row_values.append(Paragraph(str(val) if val else '-', styles['FieldValue']))
    t = Table([row_labels, row_values], colWidths=[col_w, col_w, col_w])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, MEDIUM_GRAY),
        ('LINEBEFORE', (2, 0), (2, -1), 0.5, MEDIUM_GRAY),
        ('LEFTPADDING', (1, 0), (1, -1), 4),
        ('LEFTPADDING', (2, 0), (2, -1), 4),
    ]))
    return t


def build_status_badge(status):
    bg, txt, label = status_colors(status)
    s = ParagraphStyle('badge', parent=styles['StatusLabel'], textColor=txt, fontSize=8)
    cell = Paragraph(f'  {label}  ', s)
    t = Table([[cell]], colWidths=[28 * mm], rowHeights=[6 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
    ]))
    return t


def build_prazo_card(prazo_num, data_inicio_str, dias, status, fim_prazo_str):
    if dias is None:
        dias = 0
    num_label = f'{prazo_num} Prazo'

    if dias < 0:
        dias_display = f'{dias} (vencido)'
    elif dias == 0:
        dias_display = '0 (vence hoje)'
    else:
        dias_display = str(dias)

    hdr_style = ParagraphStyle('prazo_hdr', parent=styles['FieldLabel'], fontSize=10, textColor=DARK_BLUE)
    header_cell = Paragraph(f'<b>{num_label}</b> (90 dias)', hdr_style)
    badge = build_status_badge(status)

    header_t = Table([[header_cell, badge]], colWidths=[CONTENT_W - 32 * mm, 30 * mm])
    header_t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    inicio_label = 'Data de Detencao' if prazo_num == '1' else 'Data de Prorrogacao'
    info_t = Table([
        [
            Paragraph(f'{inicio_label}:', styles['FieldLabel']),
            Paragraph(fmt_date(data_inicio_str), styles['FieldValue']),
            Paragraph('Fim do Prazo:', styles['FieldLabel']),
            Paragraph(fmt_date(fim_prazo_str), styles['FieldValue']),
        ],
        [
            Paragraph('Dias Restantes:', styles['FieldLabel']),
            Paragraph(f'<b>{dias_display}</b>', styles['FieldValue']),
            Paragraph('', styles['FieldLabel']),
            Paragraph('', styles['FieldValue']),
        ],
    ], colWidths=[32 * mm, 40 * mm, 28 * mm, CONTENT_W - 100 * mm])
    info_t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))

    card_t = Table([[header_t], [info_t]], colWidths=[CONTENT_W - 4 * mm])
    card_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (0, 0), 6),
        ('BOTTOMPADDING', (-1, -1), (-1, -1), 6),
        ('TOPPADDING', (1, 0), (1, 0), 4),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('BOX', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
    ]))
    return card_t


def generate_ficha_pdf(arguido_data, output_path):
    a = arguido_data

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
        topMargin=12 * mm, bottomMargin=15 * mm,
    )

    elements = []

    # ========== HEADER ==========
    emblem_path = '/home/z/my-project/public/angola-emblem.png'
    if os.path.exists(emblem_path):
        emblem = Image(emblem_path, width=30 * mm, height=34 * mm)
    else:
        emblem = Paragraph('', styles['FieldValue'])

    # Emblem centered above text
    emblem_row = Table([[emblem]], colWidths=[CONTENT_W], rowHeights=[36 * mm])
    emblem_row.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(emblem_row)

    # Text centered below emblem
    header_texts = [
        Paragraph('REPUBLICA DE ANGOLA', styles['HeaderRepublic']),
        Paragraph('PROCURADORIA-GERAL DA REPUBLICA', styles['HeaderPGR']),
        Paragraph('PGR-Lunda-Sul', styles['HeaderProvince']),
    ]
    text_block = Table([[h] for h in header_texts], colWidths=[CONTENT_W])
    text_block.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (0, 0), 0),
        ('BOTTOMPADDING', (-1, -1), (-1, -1), 0),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(text_block)
    elements.append(Spacer(1, 2 * mm))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=GOLD, spaceAfter=2 * mm, spaceBefore=0))
    elements.append(Spacer(1, 2 * mm))

    # ========== DOCUMENT TITLE ==========
    elements.append(Paragraph('FICHA DO ARGUIDO', styles['DocTitle']))
    elements.append(Paragraph(
        'Sistema de Controlo de Arguidos em Prisao Preventiva',
        ParagraphStyle('subtitle', parent=styles['FieldValue'], alignment=TA_CENTER, textColor=HexColor('#666666'), fontSize=8.5)
    ))
    elements.append(Spacer(1, 4 * mm))

    # ========== DADOS PESSOAIS ==========
    elements.append(build_section_header('DADOS PESSOAIS'))
    name_val = Paragraph(f'<b>{a.get("nomeArguido", "-")}</b>', ParagraphStyle(
        'bigname', parent=styles['FieldLarge'], fontSize=12, textColor=DARK_BLUE
    ))
    elements.append(build_field_row('Nome Completo', name_val, 'FieldLarge'))
    elements.append(build_two_fields('Filiacao (Pai)', a.get('filiacaoPai'), 'Filiacao (Mae)', a.get('filiacaoMae')))
    elements.append(Spacer(1, 3 * mm))

    # ========== DADOS PROCESSUAIS ==========
    elements.append(build_section_header('DADOS PROCESSUAIS'))
    proc_val = Paragraph(f'<b>{a.get("numeroProcesso", "-")}</b>', ParagraphStyle(
        'proc', parent=styles['FieldLarge'], fontSize=11, textColor=DARK_BLUE
    ))
    elements.append(build_field_row('N. do Processo', proc_val, 'FieldLarge'))
    elements.append(build_field_row('Crime', a.get('crime', '-')))
    elements.append(build_field_row('Magistrado Responsavel', a.get('magistradoResponsavel', '-')))
    elements.append(Spacer(1, 3 * mm))

    # ========== CRONOLOGIA ==========
    elements.append(build_section_header('CRONOLOGIA'))
    elements.append(build_three_fields(
        'Data de Detencao', fmt_date(a.get('dataDetencao')),
        'Remessa ao JG', fmt_date(a.get('dataRemessaJg')),
        'Data de Regresso', fmt_date(a.get('dataRegresso')),
    ))
    elements.append(Spacer(1, 3 * mm))

    # ========== GESTAO DE PRAZOS E ALERTAS ==========
    elements.append(build_section_header('GESTAO DE PRAZOS E ALERTAS'))
    elements.append(Spacer(1, 2 * mm))

    elements.append(build_prazo_card(
        prazo_num='1',
        data_inicio_str=a.get('dataDetencao'),
        dias=a.get('diasRestantes1', 0),
        status=a.get('status1', a.get('statusPrazo', 'normal')),
        fim_prazo_str=a.get('fim1Prazo'),
    ))
    elements.append(Spacer(1, 3 * mm))

    if a.get('dataProrrogacao'):
        elements.append(build_prazo_card(
            prazo_num='2',
            data_inicio_str=a.get('dataProrrogacao'),
            dias=a.get('diasRestantes2', 0) if a.get('diasRestantes2') is not None else 0,
            status=a.get('status2', 'normal'),
            fim_prazo_str=a.get('fim2Prazo'),
        ))
    else:
        no_pror = Paragraph('Nao ha prorrogacao registada - 2.o prazo nao aplicavel.', ParagraphStyle(
            'no_p', parent=styles['FieldValue'], textColor=HexColor('#888888'), fontName='CalibriI', fontSize=9
        ))
        t = Table([[no_pror]], colWidths=[CONTENT_W - 4 * mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('ROUNDEDCORNERS', [3, 3, 3, 3]),
            ('BOX', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
        ]))
        elements.append(t)
    elements.append(Spacer(1, 3 * mm))

    # Overall status
    overall_status = a.get('statusPrazo', 'normal')
    overall_bg, overall_txt, overall_label = status_colors(overall_status)
    status_desc = {
        'vencido': 'Prazo(s) VENCIDO(S) - Medidas urgentes necessarias',
        'critico': 'Prazo CRITICO - Restam 3 dias ou menos',
        'alerta': 'Prazo em ALERTA - Restam 7 dias ou menos',
        'normal': 'Prazo dentro do normal - Sem accao imediata necessaria',
    }
    desc_text = status_desc.get(overall_status, '')
    desc_style = ParagraphStyle('sd', parent=styles['FieldValue'], textColor=overall_txt, fontSize=9.5)

    status_row = Table([[
        Paragraph(f'<b>Estado Geral:</b>', ParagraphStyle('sl', parent=styles['FieldLabel'], fontSize=10, textColor=DARK_BLUE)),
        build_status_badge(overall_status),
    ]], colWidths=[32 * mm, CONTENT_W - 32 * mm])
    status_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(status_row)
    elements.append(Paragraph(desc_text, desc_style))
    elements.append(Spacer(1, 3 * mm))

    # ========== PROCEDIMENTOS ==========
    elements.append(build_section_header('PROCEDIMENTOS'))
    elements.append(build_three_fields(
        'Remessa ao SIC', fmt_date(a.get('dataRemessaSic')),
        'Data de Prorrogacao', fmt_date(a.get('dataProrrogacao')),
        'Remessa JG / Alteracao', fmt_date(a.get('remessaJgAlteracao')),
    ))
    elements.append(Spacer(1, 3 * mm))

    # ========== MEDIDAS APLICADAS ==========
    medidas = a.get('medidasAplicadas', '') or ''
    elements.append(build_section_header('MEDIDAS APLICADAS'))
    if medidas:
        med_val = Paragraph(medidas, styles['FieldValue'])
    else:
        med_val = Paragraph('Nenhuma medida registada.', ParagraphStyle(
            'nm', parent=styles['FieldValue'], textColor=HexColor('#888888'), fontName='CalibriI'
        ))
    med_t = Table([[med_val]], colWidths=[CONTENT_W - 4 * mm])
    med_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROUNDEDCORNERS', [0, 0, 3, 3]),
        ('BOX', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
    ]))
    elements.append(med_t)
    elements.append(Spacer(1, 3 * mm))

    # ========== OBSERVACOES ==========
    obs1 = a.get('observacao1', '') or ''
    obs2 = a.get('observacao2', '') or ''
    if obs1 or obs2:
        elements.append(build_section_header('OBSERVACOES'))
        for obs in [obs1, obs2]:
            if obs:
                o = Paragraph(obs, styles['FieldValue'])
                ot = Table([[o]], colWidths=[CONTENT_W - 4 * mm])
                ot.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('ROUNDEDCORNERS', [0, 0, 3, 3]),
                    ('BOX', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
                ]))
                elements.append(ot)
                elements.append(Spacer(1, 2 * mm))
        elements.append(Spacer(1, 1 * mm))

    # ========== HISTORICO DE ALERTAS ==========
    alertas = a.get('alertas', [])
    if alertas and len(alertas) > 0:
        elements.append(build_section_header('HISTORICO DE ALERTAS'))
        elements.append(Spacer(1, 1 * mm))

        th_style = ParagraphStyle('th', parent=styles['FieldLabel'], fontSize=8, textColor=white)
        header_cells = [
            Paragraph('Tipo', th_style),
            Paragraph('Alerta', th_style),
            Paragraph('Urgencia', th_style),
            Paragraph('Data', th_style),
        ]
        header_row = Table([header_cells], colWidths=[18 * mm, CONTENT_W - 76 * mm, 20 * mm, 36 * mm])
        header_row.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), MEDIUM_BLUE),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('ROUNDEDCORNERS', [3, 3, 0, 0]),
        ]))
        elements.append(header_row)

        for idx, alerta in enumerate(alertas[:10]):
            tipo = '1.o Prazo' if alerta.get('tipo') == '1_prazo' else '2.o Prazo'
            msg = alerta.get('mensagem', '')
            urgencia = alerta.get('urgencia', 'normal')
            bg_c, txt_c, u_label = status_colors(urgencia)

            tipo_cell = Paragraph(tipo, styles['AlertText'])
            msg_cell = Paragraph(msg, styles['AlertText'])

            urg_s = ParagraphStyle('ub', parent=styles['StatusLabel'], fontSize=7.5, textColor=txt_c)
            urg_cell = Paragraph(f'{u_label}', urg_s)
            urg_t = Table([[urg_cell]], colWidths=[18 * mm], rowHeights=[5 * mm])
            urg_t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), bg_c),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
                ('ROUNDEDCORNERS', [2, 2, 2, 2]),
            ]))

            data_cell = Paragraph(fmt_date(alerta.get('criadoEm')), styles['AlertText'])

            row = Table(
                [[tipo_cell, msg_cell, urg_t, data_cell]],
                colWidths=[18 * mm, CONTENT_W - 76 * mm, 20 * mm, 36 * mm],
            )
            row.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY if idx % 2 == 0 else white),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('BOX', (0, 0), (-1, -1), 0.3, MEDIUM_GRAY),
            ]))
            elements.append(row)

        if len(alertas) > 10:
            elements.append(Paragraph(f'... e mais {len(alertas) - 10} alerta(s)', ParagraphStyle(
                'more', parent=styles['AlertText'], textColor=HexColor('#999999'), alignment=TA_CENTER
            )))
        elements.append(Spacer(1, 3 * mm))

    # ========== FOOTER ==========
    elements.append(Spacer(1, 6 * mm))
    elements.append(HRFlowable(width='60%', thickness=0.5, color=MEDIUM_GRAY, spaceAfter=2 * mm))
    elements.append(Paragraph(
        f'Documento gerado em {datetime.now().strftime("%d/%m/%Y as %H:%M")} pelo Sistema de Controlo de Arguidos - PGR Lunda-Sul',
        styles['FooterStyle']
    ))
    elements.append(Paragraph(
        'PROCURADORIA-GERAL DA REPUBLICA | Lunda-Sul, Angola',
        styles['FooterStyle']
    ))

    doc.build(elements)
    return output_path


# ============================================================
# CLI entry point
# ============================================================
if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: generate_ficha.py <arguido_id> <output_path>')
        sys.exit(1)

    arguido_id = sys.argv[1]
    output_path = sys.argv[2]

    import sqlite3

    db_path = '/home/z/my-project/db/custom.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM Arguido WHERE id = ? AND ativo = 1', (arguido_id,))
    row = cursor.fetchone()
    if not row:
        print(f'ERROR: Arguido {arguido_id} not found', file=sys.stderr)
        sys.exit(1)

    a = dict(row)
    for key in a:
        if isinstance(a[key], str) and 'T' in a[key] and len(a[key]) > 18:
            try:
                a[key] = a[key].split('T')[0]
            except Exception:
                pass

    # Calculate prazos
    def parse_date(d):
        if not d:
            return None
        try:
            return datetime.strptime(str(d)[:10], '%Y-%m-%d').date()
        except Exception:
            return None

    today = date.today()
    det_date = parse_date(a.get('dataDetencao'))
    if det_date:
        fim1 = det_date + timedelta(days=90)
        a['fim1Prazo'] = str(fim1)
        a['diasRestantes1'] = (fim1 - today).days
        if a['diasRestantes1'] < 0:
            a['status1'] = 'vencido'
        elif a['diasRestantes1'] <= 3:
            a['status1'] = 'critico'
        elif a['diasRestantes1'] <= 7:
            a['status1'] = 'alerta'
        else:
            a['status1'] = 'normal'
    else:
        a['fim1Prazo'] = None
        a['diasRestantes1'] = 0
        a['status1'] = 'normal'

    pror_date = parse_date(a.get('dataProrrogacao'))
    if pror_date:
        fim2 = pror_date + timedelta(days=90)
        a['fim2Prazo'] = str(fim2)
        a['diasRestantes2'] = (fim2 - today).days
        if a['diasRestantes2'] < 0:
            a['status2'] = 'vencido'
        elif a['diasRestantes2'] <= 3:
            a['status2'] = 'critico'
        elif a['diasRestantes2'] <= 7:
            a['status2'] = 'alerta'
        else:
            a['status2'] = 'normal'
    else:
        a['fim2Prazo'] = None
        a['diasRestantes2'] = None
        a['status2'] = None

    priority = {'normal': 0, 'alerta': 1, 'critico': 2, 'vencido': 3}
    s1 = priority.get(a['status1'], 0)
    s2 = priority.get(a['status2'], -1) if a['status2'] else -1
    worst = max(s1, s2)
    for k, v in priority.items():
        if v == worst:
            a['statusPrazo'] = k
            break

    # Fetch alertas with arguido data for urgency calculation
    cursor.execute('''
        SELECT ap.id, ap.tipo, ap.mensagem, ap.lido, ap.criadoEm,
               a.dataDetencao, a.dataProrrogacao
        FROM AlertaPrazo ap
        JOIN Arguido a ON ap.arguidoId = a.id
        WHERE ap.arguidoId = ?
        ORDER BY ap.criadoEm DESC
    ''', (arguido_id,))
    alerta_rows = cursor.fetchall()
    alertas = []
    for ar in alerta_rows:
        alerta = dict(ar)
        for key in alerta:
            if isinstance(alerta[key], str) and 'T' in str(alerta[key]) and len(str(alerta[key])) > 18:
                try:
                    alerta[key] = alerta[key].split('T')[0]
                except Exception:
                    pass

        tipo = alerta.get('tipo', '1_prazo')
        det_d = parse_date(alerta.get('dataDetencao'))
        pror_d = parse_date(alerta.get('dataProrrogacao'))

        dias = None
        if tipo == '1_prazo' and det_d:
            dias = (det_d + timedelta(days=90) - today).days
        elif tipo == '2_prazo' and pror_d:
            dias = (pror_d + timedelta(days=90) - today).days

        if dias is not None:
            if dias < 0:
                alerta['urgencia'] = 'vencido'
            elif dias <= 3:
                alerta['urgencia'] = 'critico'
            elif dias <= 7:
                alerta['urgencia'] = 'alerta'
            else:
                alerta['urgencia'] = 'normal'
        else:
            msg = alerta.get('mensagem', '')
            if 'VENCIDO' in msg:
                alerta['urgencia'] = 'vencido'
            elif 'HOJE' in msg:
                alerta['urgencia'] = 'critico'
            elif 'Faltam' in msg:
                m = re.search(r'Faltam\s+(\d+)', msg)
                d = int(m.group(1)) if m else 5
                alerta['urgencia'] = 'critico' if d <= 3 else ('alerta' if d <= 7 else 'normal')
            else:
                alerta['urgencia'] = 'normal'

        alerta.pop('dataDetencao', None)
        alerta.pop('dataProrrogacao', None)
        alertas.append(alerta)

    a['alertas'] = alertas
    conn.close()

    generate_ficha_pdf(a, output_path)
    print(f'PDF generated: {output_path}')
