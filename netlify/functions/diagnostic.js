exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const SYSTEM_PROMPT = `Você é Archie, o agente de diagnóstico da ScaleCo — criado por Fábio Couto, ex-Regional VP da Salesforce Brasil, fundador da ScaleCo (scaleco.ai).

Sua missão: conduzir um diagnóstico conversacional para identificar gargalos na arquitetura de receita do lead, qualificá-lo e preparar o terreno para uma conversa com Fábio.

CONTEXTO PRÉ-PREENCHIDO:
O formulário já capturou: nome, email (se fornecido), WhatsApp e faixa de faturamento anual.
Não pergunte novamente nenhum desses dados.
Se o email não vier no formulário, peça apenas no encerramento.

FLUXO DO DIAGNÓSTICO

Fase 1 — Contexto (2 perguntas):
1. "Qual é o nome da sua empresa e o que ela vende?"
2. "Em qual mercado vocês atuam e para que tipo de cliente vendem?"

Com base na faixa de faturamento já recebida, ajuste a profundidade:
- Até R$1M/ano → diagnóstico curto (mínimo 5 perguntas úteis)
- R$1M–R$5M/ano → diagnóstico médio (mínimo 7 perguntas úteis)
- R$5M–R$20M/ano ou Acima de R$20M/ano → diagnóstico completo (mínimo 9 perguntas úteis)

Fase 2 — Diagnóstico SCALE (UMA pergunta por vez, sempre):

S — Strategic Architecture:
- "Você tem clareza de quem é seu cliente ideal — o perfil que fecha mais rápido e retém melhor?"
- "Sua proposta de valor está documentada e usada de forma consistente pelo time?"

C — Commercial Engine:
- "Como chegam os novos clientes hoje — indicação, prospecção ativa, inbound?"
- "Você tem um processo de vendas definido, com etapas claras e taxas de conversão conhecidas?"
- "Você usa CRM hoje? Se usa, como ele entra na rotina comercial? Se não usa, como acompanha o funil?"

A — Analytics & Governance:
- "Hoje você consegue prever, com confiança, quanto vai faturar no próximo mês?"
- "A receita varia muito de um mês para o outro ou ela já tem algum nível de previsibilidade?"

L — Leadership Institutionalization:
- "Se você sair por 30 dias, o comercial continua funcionando sem você?"
- "Quantas pessoas estão hoje no time comercial, entre pré-vendas, vendedores e liderança?"

E — Execution Cadence:
- "Existe uma cadência de reuniões de vendas — semanal, quinzenal?"
- "Quando um resultado não acontece, você consegue identificar onde no processo quebrou?"

CRITÉRIO DE ENCERRAMENTO:
Só encerre o diagnóstico quando:
- Mínimo 1 resposta válida por dimensão (S, C, A, L, E)
- Mínimo 7 respostas úteis no total
- Pelo menos 2 evidências concretas de operação comercial real

Se o email já foi capturado no formulário, encerre com:
"Tenho o suficiente para gerar seu diagnóstico. Vou consolidar o relatório com os principais gargalos e prioridades."

Se o email NÃO foi capturado, encerre com:
"Tenho o suficiente para gerar seu diagnóstico. Pode me confirmar seu email para enviar o relatório completo?"

REGRAS ABSOLUTAS:
- Uma pergunta por vez — sempre, sem exceção.
- Nunca explique a metodologia SCALE.
- Nunca use linguagem de coach, mentor ou consultor.
- Nunca elogie o lead.
- Nunca sugira solução completa antes do relatório.
- Nunca repita pergunta já respondida.
- Nunca avance sem registrar a resposta anterior.
- Se a resposta for vaga, peça um exemplo concreto antes de avançar.
- Se a resposta indicar problema crítico evidente, explore com 1 pergunta adicional curta antes de seguir.
- Se o lead recusar informar faturamento, use pergunta substituta: "Quantas pessoas trabalham na empresa hoje?"
- Faturamento sempre normalizado em faixa, nunca valor exato.
- Respostas curtas, diretas, profissionais.
- Não encerre sem cobertura das 5 dimensões.

GERAÇÃO DO RELATÓRIO:
Quando os critérios de encerramento forem atendidos e o email estiver confirmado, responda APENAS com este JSON puro (sem markdown, sem texto antes ou depois):

{"tipo":"relatorio","nome":"[nome]","empresa":"[empresa]","email":"[email]","whatsapp":"[whatsapp ou null]","faturamento":"[faixa ou null]","score_geral":[0-100],"nivel":"[Crítico|Em Desenvolvimento|Estruturado|Escalável]","dimensoes":{"S":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"C":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"A":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"L":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"},"E":{"score":[0-100],"status":"[frase curta]","gargalo":"[gargalo ou null]"}},"gargalo_critico":"[maior problema em 1 frase]","prioridades":["ação 1","ação 2","ação 3"],"parecer":"[2-3 frases diretas]"}

TOM: Direto, frases curtas, sem elogios. Nunca use "mentoria" ou "consultoria".`;

  try {
    const body = JSON.parse(event.body);
    const { messages, formData } = body;

    // Build context message from form data if present
    let messagesWithContext = [...messages];
    if (formData && messages.length === 1 && messages[0].content === 'olá') {
      const contextParts = [];
      if (formData.nome) contextParts.push(`Nome: ${formData.nome}`);
      if (formData.email) contextParts.push(`Email: ${formData.email}`);
      if (formData.whatsapp) contextParts.push(`WhatsApp: ${formData.whatsapp}`);
      if (formData.faturamento) contextParts.push(`Faturamento anual: ${formData.faturamento}`);

      if (contextParts.length > 0) {
        messagesWithContext = [
          {
            role: 'user',
            content: `[DADOS DO FORMULÁRIO — não perguntar novamente]\n${contextParts.join('\n')}\n\n[INÍCIO DA CONVERSA]`
          },
          ...messages.slice(1)
        ];
      }
    }

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
        messages: messagesWithContext,
      }),
    });

    const data = await response.json();
    // Handle lead capture (form submitted, chat not started)
    if (messages.length === 1 && messages[0].content === '__lead_capture__') {
      if (formData && formData.email) {
        await sendLeadCapture(formData);
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: 'ok' }),
      };
    }

    const reply = data.content?.map((b) => b.text || "").join("") || "Erro ao processar resposta.";

    // Try to send email if it's a report
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const report = JSON.parse(jsonMatch[0]);
        if (report.tipo === 'relatorio' && report.email) {
          // Build conversation history from messages
          const conversation = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => {
              const prefix = m.role === 'user' ? 'Lead' : 'Archie';
              // Skip the form context injection message
              if (m.content.startsWith('[DADOS DO FORMULÁRIO')) return null;
              return `${prefix}: ${m.content}`;
            })
            .filter(Boolean)
            .join('\n\n');

          const answers = messages
            .filter(m => m.role === 'user' && !m.content.startsWith('[DADOS DO FORMULÁRIO'))
            .map(m => m.content)
            .join('\n\n');

          // Add form data and conversation to report
          report.conversation = conversation;
          report.answers = answers;
          if (formData) {
            report.whatsapp = report.whatsapp || formData.whatsapp || null;
            report.faturamento = report.faturamento || formData.faturamento || null;
          }

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

async function sendLeadCapture(data) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;">
  <div style="background:#0A0A0A;padding:24px 32px;">
    <div style="font-size:11px;letter-spacing:4px;color:#888;">SCALECO · SCALE DIAGNOSTIC™</div>
    <div style="font-size:20px;font-weight:700;color:#fff;margin-top:8px;">NOVO LEAD CADASTRADO</div>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:#f9f9f9;border-radius:8px;padding:20px;font-size:14px;color:#333;line-height:2;">
      <strong>Nome:</strong> ${data.nome}<br>
      <strong>Email:</strong> ${data.email}<br>
      <strong>WhatsApp:</strong> ${data.whatsapp}<br>
      <strong>Faturamento:</strong> ${data.faturamento}
    </div>
    <div style="margin-top:16px;padding:14px;background:#fff8e1;border:1px solid #ffe082;border-radius:8px;font-size:13px;color:#555;">
      ⚠ Este lead iniciou o diagnóstico mas ainda não concluiu.
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="https://wa.me/55${data.whatsapp.replace(/\D/g,'')}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;padding:12px 28px;font-weight:700;font-size:14px;">CHAMAR NO WHATSAPP</a>
    </div>
  </div>
  <div style="padding:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa;">ScaleCo · diagnostic.scaleco.ai</div>
</div></body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Archie · ScaleCo <onboarding@resend.dev>',
      to: ['fabio@scaleco.ai'],
      subject: `[Lead Cadastrado] ${data.nome} · ${data.faturamento}`,
      html
    }),
  });
}

async function sendEmails(report) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const nivelColor = {
    "Crítico": "#EF4444",
    "Em Desenvolvimento": "#F59E0B",
    "Estruturado": "#2D5BE3",
    "Escalável": "#22C55E"
  }[report.nivel] || "#2D5BE3";

  const dimNames = {
    S: "Strategic Architecture",
    C: "Commercial Engine",
    A: "Analytics & Governance",
    L: "Leadership Institutionalization",
    E: "Execution Cadence"
  };

  const dimsHTML = Object.entries(report.dimensoes).map(([k, d]) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#2D5BE3;">${k}</td><td style="padding:8px 12px;color:#555;font-size:13px;">${dimNames[k]}</td><td style="padding:8px 12px;font-weight:700;text-align:right;">${d.score}</td></tr>${d.gargalo ? `<tr><td colspan="3" style="padding:2px 12px 10px;font-size:12px;color:#EF4444;">↳ ${d.gargalo}</td></tr>` : ""}`
  ).join("");

  const priosHTML = report.prioridades.map((p, i) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#2D5BE3;font-size:18px;">${String(i + 1).padStart(2, "0")}</td><td style="padding:8px 12px;color:#333;font-size:14px;">${p}</td></tr>`
  ).join("");

  // Conversation history HTML (admin only)
  const conversationHTML = report.conversation
    ? `<div style="margin-top:24px;border-top:1px solid #eee;padding-top:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:12px;">HISTÓRICO DA CONVERSA</div>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;font-size:12px;color:#444;line-height:2;white-space:pre-wrap;">${report.conversation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>`
    : '';

  // Answers only HTML (admin only)
  const answersHTML = report.answers
    ? `<div style="margin-top:16px;">
        <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:12px;">RESPOSTAS DO LEAD</div>
        <div style="background:#fff8f0;border:1px solid #fde;border-radius:8px;padding:16px;font-size:13px;color:#333;line-height:2;white-space:pre-wrap;">${report.answers.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>`
    : '';

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
      ? `<div style="text-align:center;background:#0A0A0A;border-radius:12px;padding:24px;"><div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:8px;">PRÓXIMO PASSO</div><div style="font-size:13px;color:#888;margin-bottom:16px;line-height:1.6;">O diagnóstico mostra onde a escala está quebrando. A próxima conversa define o que precisa ser construído.</div><a href="https://wa.me/5511974270077?text=Olá%20Fábio%2C%20acabei%20de%20fazer%20o%20diagnóstico%20da%20ScaleCo%20e%20gostaria%20de%20conversar%20sobre%20o%20resultado." style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;padding:12px 32px;font-weight:700;font-size:14px;">CONVERSAR SOBRE O DIAGNÓSTICO</a></div>`
      : `<div style="background:#f0f4ff;border-radius:8px;padding:16px;font-size:13px;color:#333;">
          <strong>Lead:</strong> ${report.nome} · ${report.email}<br>
          ${report.whatsapp ? `<strong>WhatsApp:</strong> ${report.whatsapp}<br>` : ''}
          ${report.faturamento ? `<strong>Faturamento:</strong> ${report.faturamento}<br>` : ''}
          <strong>Empresa:</strong> ${report.empresa}<br>
          <strong>Score:</strong> ${report.score_geral} · ${report.nivel}
        </div>
        ${conversationHTML}
        ${answersHTML}`
    }
  </div>
  <div style="padding:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa;">ScaleCo · diagnostic.scaleco.ai · Powered by Archie</div>
</div></body></html>`;

  const send = (to, subject, html) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: "Archie · ScaleCo <onboarding@resend.dev>", to: [to], subject, html }),
  });

  await send(
    "fabio@scaleco.ai",
    `[Novo Lead] ${report.nome} · ${report.empresa} · Score ${report.score_geral}`,
    makeHTML(true)
  );
}
