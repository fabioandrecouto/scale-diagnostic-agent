exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
 
  const SYSTEM_PROMPT = `Você é Archie, o agente de diagnóstico da ScaleCo — criado por Fábio Couto, ex-Regional VP da Salesforce Brasil, fundador da ScaleCo (scaleco.ai).
 
Sua missão: conduzir um diagnóstico conversacional para identificar gargalos na arquitetura de receita do lead, qualificá-lo e preparar o terreno para uma conversa com Fábio.
 
FLUXO DO DIAGNÓSTICO
 
Fase 1 — Contexto (sempre faça estas 2 perguntas primeiro):
1. "Qual é o nome da sua empresa e o que ela vende?"
2. "Qual é o faturamento mensal aproximado?"
 
Com base nas respostas, decida a profundidade:
- Faturamento < R$100k/mês → diagnóstico curto (mais 3 perguntas)
- Faturamento R$100k–R$500k/mês → diagnóstico médio (mais 5 perguntas)
- Faturamento > R$500k/mês → diagnóstico completo (mais 7 perguntas)
 
Fase 2 — Diagnóstico SCALE:
 
S — Strategic Architecture:
- "Você tem clareza de quem é seu cliente ideal (ICP)?"
- "Sua proposta de valor está documentada e usada de forma consistente?"
 
C — Commercial Engine:
- "Como chegam os novos clientes hoje?"
- "Você tem um processo de vendas definido com taxas de conversão conhecidas?"
- "Quantos dias leva do primeiro contato ao fechamento?"
 
A — Analytics & Governance:
- "Quais são os 3 indicadores que você acompanha toda semana no comercial?"
- "Você consegue prever quanto vai faturar no próximo mês?"
 
L — Leadership Institutionalization:
- "Se você sair de férias por 30 dias, o comercial continua funcionando?"
- "Você tem alguém que lidera o comercial sem precisar de você?"
 
E — Execution Cadence:
- "Existe uma cadência de reuniões de vendas?"
- "Quando um resultado não acontece, você tem processo para identificar onde quebrou?"
 
REGRAS:
- Faça UMA pergunta por vez.
- Nunca revele o score durante o diagnóstico.
- Quando tiver informação suficiente (mínimo 5 respostas), encerre com: "Tenho o suficiente para gerar seu diagnóstico. Pode me passar seu nome e email para eu enviar o relatório completo?"
 
GERAÇÃO DO RELATÓRIO:
Quando o lead fornecer nome e email, responda APENAS com este JSON puro (sem markdown, sem texto antes ou depois):
 
{"tipo":"relatorio","nome":"[nome]","empresa":"[empresa]","email":"[email]","score_geral":[0-100],"nivel":"[Crítico|Em Desenvolvimento|Estruturado|Escalável]","dimensoes":{"S":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"C":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"A":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"L":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"E":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"}},"gargalo_critico":"[maior problema em 1 frase]","prioridades":["ação 1","ação 2","ação 3"],"parecer":"[2-3 frases diretas]"}
 
TOM: Direto, frases curtas, sem elogios. Nunca use "mentoria" ou "consultoria".`;
 
  try {
    const { messages } = JSON.parse(event.body);
 
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
 
    const data = await response.json();
    const reply = data.content?.map((b) => b.text || "").join("") || "Erro ao processar resposta.";
 
    // Try to send email if it's a report
    try {
      const trimmed = reply.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      if (trimmed.startsWith("{")) {
        const report = JSON.parse(trimmed);
        if (report.tipo === "relatorio" && report.email) {
          await sendEmails(report);
        }
      }
    } catch (e) {}
 
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Erro interno. Tente novamente." }),
    };
  }
};
 
async function sendEmails(report) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;
 
  const nivelColor = {"Crítico":"#EF4444","Em Desenvolvimento":"#F59E0B","Estruturado":"#2D5BE3","Escalável":"#22C55E"}[report.nivel] || "#2D5BE3";
  const dimNames = {S:"Strategic Architecture",C:"Commercial Engine",A:"Analytics & Governance",L:"Leadership Institutionalization",E:"Execution Cadence"};
 
  const dimsHTML = Object.entries(report.dimensoes).map(([k,d]) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#2D5BE3;">${k}</td><td style="padding:8px 12px;color:#555;font-size:13px;">${dimNames[k]}</td><td style="padding:8px 12px;font-weight:700;text-align:right;">${d.score}</td></tr>${d.gargalo?`<tr><td colspan="3" style="padding:2px 12px 10px;font-size:12px;color:#EF4444;">↳ ${d.gargalo}</td></tr>`:""}`
  ).join("");
 
  const priosHTML = report.prioridades.map((p,i) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#2D5BE3;font-size:18px;">${String(i+1).padStart(2,"0")}</td><td style="padding:8px 12px;color:#333;font-size:14px;">${p}</td></tr>`
  ).join("");
 
  const makeHTML = (isAdmin) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;">
  <div style="background:#0A0A0A;padding:32px;text-align:center;">
    <div style="font-size:11px;letter-spacing:4px;color:#888;">SCALECO · SCALE DIAGNOSTIC™</div>
    <div style="font-size:24px;font-weight:700;color:#fff;margin-top:8px;">DIAGNÓSTICO DE ARQUITETURA</div>
    <div style="font-size:13px;color:#888;margin-top:6px;">${report.empresa} · ${report.nome}</div>
  </div>
  <div style="padding:32px;">
    <div style="text-align:center;background:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:24px;border-top:4px solid #2D5BE3;">
      <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;">SCORE GERAL</div>
      <div style="font-size:64px;font-weight:700;color:${nivelColor};line-height:1;margin:8px 0;">${report.score_geral}</div>
      <span style="padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;background:${nivelColor}22;color:${nivelColor};border:1px solid ${nivelColor}44;">${report.nivel}</span>
      <div style="font-size:14px;color:#555;line-height:1.7;margin-top:12px;">${report.parecer}</div>
    </div>
    <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:10px;">DIMENSÕES SCALE</div>
    <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;margin-bottom:20px;">${dimsHTML}</table>
    <div style="background:#fff0f0;border:1px solid #fcc;border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:10px;letter-spacing:2px;color:#EF4444;text-transform:uppercase;margin-bottom:6px;">⚠ GARGALO CRÍTICO</div>
      <div style="font-size:14px;color:#333;font-weight:500;">${report.gargalo_critico}</div>
    </div>
    <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:10px;">PRIORIDADES DE AÇÃO</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">${priosHTML}</table>
    ${!isAdmin
      ? `<div style="text-align:center;background:#0A0A0A;border-radius:12px;padding:24px;"><div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;">PRÓXIMO PASSO</div><div style="font-size:13px;color:#888;margin-bottom:16px;line-height:1.6;">O diagnóstico identifica o gargalo. A arquitetura define como resolver.</div><a href="https://diagnostic.scaleco.ai" style="display:inline-block;background:#2D5BE3;color:#fff;text-decoration:none;border-radius:8px;padding:12px 32px;font-weight:700;font-size:14px;">AGENDAR CALL COM FÁBIO</a></div>`
      : `<div style="background:#f0f4ff;border-radius:8px;padding:16px;font-size:13px;color:#333;"><strong>Lead:</strong> ${report.nome} · ${report.email}<br><strong>Empresa:</strong> ${report.empresa}<br><strong>Score:</strong> ${report.score_geral} · ${report.nivel}</div>`
    }
  </div>
  <div style="padding:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa;">ScaleCo · diagnostic.scaleco.ai · Powered by Archie</div>
</div></body></html>`;
 
  const send = (to, subject, html) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {"Content-Type":"application/json","Authorization":`Bearer ${RESEND_KEY}`},
    body: JSON.stringify({from:"Archie · ScaleCo <onboarding@resend.dev>", to:[to], subject, html}),
  });
 
  await send(report.email, `Seu diagnóstico Scale Diagnostic™ — ${report.empresa}`, makeHTML(false));
  await send("fabio@scaleco.ai", `[Novo Lead] ${report.nome} · ${report.empresa} · Score ${report.score_geral}`, makeHTML(true));
}
 
