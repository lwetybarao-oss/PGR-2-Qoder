import nodemailer from 'nodemailer';

// Configuração SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar conexão SMTP (debug)
transporter.verify().then(() => {
  console.log('[Email] SMTP conectado com sucesso');
}).catch((err) => {
  console.error('[Email] Erro na conexão SMTP:', err.message);
});

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || '';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'PGR - Sistema de Arguidos';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Enviar email via Gmail SMTP
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    console.log(`[Email] Enviado para ${to}: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] Erro ao enviar para ${to}:`, error.message);
    return false;
  }
}

/**
 * Template HTML base (PGR institutional style)
 */
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1e3a5f; color: #fff; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 18px; }
    .header .sub { font-size: 12px; opacity: 0.8; margin-top: 5px; }
    .body { padding: 25px; }
    .body h2 { color: #1e3a5f; border-bottom: 2px solid #F9A601; padding-bottom: 8px; }
    .alert-box { background: #fff3cd; border-left: 4px solid #F9A601; padding: 12px; margin: 12px 0; }
    .danger-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 12px 0; }
    .info-box { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 12px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; font-size: 13px; }
    td { border: 1px solid #ddd; padding: 8px 12px; font-size: 13px; }
    .btn { display: inline-block; background: #F9A601; color: #1e3a5f; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 12px 0; }
    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #eee; }
    .urgencia-vencido { color: #dc3545; font-weight: bold; }
    .urgencia-critico { color: #e67e22; font-weight: bold; }
    .urgencia-alerta { color: #F9A601; font-weight: bold; }
    .urgencia-normal { color: #28a745; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>REPÚBLICA DE ANGOLA</h1>
      <div class="sub">PROCURADORIA-GERAL DA REPÚBLICA</div>
      <div class="sub">Sistema de Gestão de Arguidos</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>PGR - Procuradoria-Geral da República de Angola</p>
      <p>Lunda-Sul | Sistema de Controlo de Arguidos em Prisão Preventiva</p>
      <p>Este email foi enviado automaticamente pelo sistema. Não responda.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Enviar email de alerta de prazo
 */
export async function sendAlertaPrazoEmail(opts: {
  to: string;
  arguido: { nome: string; processo: string; crime: string; magistrado: string };
  prazo: { tipo: string; dataFim: string; diasRestantes: number; urgencia: string };
}): Promise<boolean> {
  const { to, arguido, prazo } = opts;

  const urgenciaLabel: Record<string, string> = {
    vencido: 'VENCIDO',
    critico: 'CRÍTICO',
    alerta: 'ALERTA',
    normal: 'Normal',
  };

  const urgenciaClass = `urgencia-${prazo.urgencia}`;
  const alertClass = prazo.urgencia === 'vencido' ? 'danger-box' : prazo.urgencia === 'critico' ? 'danger-box' : 'alert-box';

  const content = `
    <h2>Alerta de Prazo - ${prazo.tipo}</h2>
    <div class="${alertClass}">
      <p><strong>Nível de Urgência:</strong> <span class="${urgenciaClass}">${urgenciaLabel[prazo.urgencia] || prazo.urgencia}</span></p>
      ${prazo.diasRestantes < 0
        ? `<p>Prazo venceu há <strong>${Math.abs(prazo.diasRestantes)} dia(s)</strong></p>`
        : prazo.diasRestantes === 0
        ? `<p>O prazo vence <strong>HOJE</strong>!</p>`
        : `<p>Restam <strong>${prazo.diasRestantes} dia(s)</strong></p>`
      }
    </div>
    <table>
      <tr><th>Campo</th><th>Detalhes</th></tr>
      <tr><td>Arguido</td><td><strong>${arguido.nome}</strong></td></tr>
      <tr><td>Nº Processo</td><td>${arguido.processo}</td></tr>
      <tr><td>Crime</td><td>${arguido.crime}</td></tr>
      <tr><td>Magistrado</td><td>${arguido.magistrado}</td></tr>
      <tr><td>Data fim do prazo</td><td>${prazo.dataFim}</td></tr>
    </table>
    <p>Por favor, tome as medidas necessárias dentro do prazo legal.</p>
  `;

  return sendEmail({
    to,
    subject: `[PGR ALERTA - ${urgenciaLabel[prazo.urgencia]}] ${prazo.tipo} - ${arguido.nome} (${arguido.processo})`,
    html: emailTemplate(content),
  });
}

/**
 * Enviar email de resumo diário de alertas
 */
export async function sendResumoDiarioEmail(opts: {
  to: string;
  totalArguidos: number;
  prazosVencidos: number;
  alertasCriticos: number;
  detalhes: { processo: string; nome: string; tipo: string; dias: number; urgencia: string }[];
}): Promise<boolean> {
  const { to, totalArguidos, prazosVencidos, alertasCriticos, detalhes } = opts;

  const rowsHtml = detalhes.map(d => {
    const urgenciaLabel: Record<string, string> = { vencido: 'VENCIDO', critico: 'CRÍTICO', alerta: 'ALERTA' };
    const urgenciaClass = `urgencia-${d.urgencia}`;
    return `<tr>
      <td>${d.processo}</td>
      <td>${d.nome}</td>
      <td>${d.tipo}</td>
      <td class="${urgenciaClass}">${d.dias < 0 ? Math.abs(d.dias) + 'd vencido' : d.dias + 'd'}</td>
      <td class="${urgenciaClass}">${urgenciaLabel[d.urgencia] || d.urgencia}</td>
    </tr>`;
  }).join('');

  const content = `
    <h2>Resumo Diário de Prazos</h2>
    <p>Verificação efectuada em <strong>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</strong></p>
    <table>
      <tr><th>Métrica</th><th>Valor</th></tr>
      <tr><td>Total de arguidos activos</td><td>${totalArguidos}</td></tr>
      <tr><td>Prazos vencidos</td><td style="color:#dc3545;font-weight:bold">${prazosVencidos}</td></tr>
      <tr><td>Alertas críticos</td><td style="color:#e67e22;font-weight:bold">${alertasCriticos}</td></tr>
    </table>
    ${detalhes.length > 0 ? `
    <h2>Detalhes dos Alertas</h2>
    <table>
      <tr><th>Processo</th><th>Arguido</th><th>Prazo</th><th>Dias</th><th>Urgência</th></tr>
      ${rowsHtml}
    </table>
    ` : '<p>Nenhum alerta activo no momento.</p>'}
  `;

  return sendEmail({
    to,
    subject: `[PGR] Resumo Diário - ${prazosVencidos} vencidos, ${alertasCriticos} críticos`,
    html: emailTemplate(content),
  });
}

/**
 * Enviar email de redefinição de senha
 */
export async function sendResetPasswordEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<boolean> {
  const { to, name, token } = opts;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const resetUrl = `${appUrl}/?view=reset-password&token=${token}`;

  const content = `
    <h2>Redefinição de Senha</h2>
    <p>Olá <strong>${name}</strong>,</p>
    <p>Recebemos um pedido de redefinição de senha para a sua conta no Sistema de Gestão de Arguidos da PGR.</p>
    <div class="info-box">
      <p>Este link é válido por <strong>1 hora</strong>. Se não solicitou esta alteração, ignore este email.</p>
    </div>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="btn">Redefinir Minha Senha</a>
    </p>
    <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
    <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
  `;

  return sendEmail({
    to,
    subject: '[PGR] Redefinição de Senha - Solicitação Recebida',
    html: emailTemplate(content),
  });
}
