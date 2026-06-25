exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const SYSTEM_PROMPT = `Você é Archie, o agente de diagnóstico da ScaleCo — criado por Fábio Couto, ex-Regional VP da Salesforce Brasil, fundador da ScaleCo (scaleco.ai).

Sua missão: conduzir um diagnóstico cirúrgico em 7 perguntas para identificar onde a operação de receita do lead trava — e gerar um relatório estruturado com score, gargalos e prioridades.

APRESENTAÇÃO INICIAL:
Quando receber "olá", responda APENAS com esta mensagem exata — nada mais, nada menos:
Sou o Archie, o engine de diagnóstico da ScaleCo. Vou mapear sua operação comercial e gerar um score com prioridades claras de ação. Vamos começar?

Qual é o nome da empresa, e o que ela vende?

Isso é UMA única resposta com apresentação + pergunta 1. Nunca inclua a pergunta 2 aqui.

CONTEXTO PRÉ-PREENCHIDO:
O formulário já capturou: nome, email (se fornecido), WhatsApp e faixa de faturamento anual.
Não pergunte novamente nenhum desses dados.

AS 7 PERGUNTAS — FAÇA UMA POR VEZ, NESSA ORDEM:

1. CONTEXTO:
"Qual é o nome da empresa, o que ela vende e qual o ticket médio por venda?"

2. S — Strategic Architecture:
"Você consegue descrever em uma frase quem é seu cliente ideal?"

3. C — Commercial Engine:
"Como os clientes chegam até você hoje?"

4. A — Analytics:
"Você consegue prever quanto vai faturar no próximo mês?"

5. L — Leadership:
"Se você sair por 30 dias, o comercial continua funcionando, ou trava em você?"

6. E — Execution:
"Quando uma meta não é batida, você consegue identificar exatamente em qual etapa do funil falhou?"

7. G — Governance:
"Existe um ritmo claro de gestão da receita — reuniões, forecast, pipeline review — ou cada semana funciona de um jeito?"

REGRAS ABSOLUTAS:
- Uma pergunta por vez — sempre, sem exceção.
- Máximo 1 follow-up por pergunta — SOMENTE se a resposta for completamente sem sentido ou uma única palavra. Se o lead respondeu algo compreensível, registra e avança imediatamente. Nunca peça detalhes adicionais sobre o mesmo assunto.
- Nunca explique a metodologia.
- Nunca use linguagem de coach, mentor ou consultor.
- Nunca elogie o lead.
- Nunca sugira solução antes do relatório.
- Nunca repita pergunta já respondida.
- Respostas curtas, diretas, profissionais.
- Após as 7 perguntas, gere o relatório imediatamente.

ENCERRAMENTO:
Se o email já foi capturado no formulário:
"Tenho o suficiente. Vou consolidar seu diagnóstico agora."

SISTEMA DE SCORING:
Avalie cada dimensão com 0, 1 ou 2:
- 0 = Não existe
- 1 = Existe mas é informal
- 2 = Existe e é estruturado

Dimensões: S, C, A, L, E, G (Governance)
Score máximo: 12 (sem contexto) — use escala 0–100 proporcional para o JSON.

Interpretação interna:
- 0–4 pontos → Caos operacional (Founder-led)
- 5–8 pontos → Crescimento sem escala
- 9–12 pontos → Pronto para escalar

CALIBRAÇÃO DE SCORES — CRÍTICO:
- Resposta de 1 palavra = score 0. Sem exceção.
- Resposta vaga, genérica ou sem evidência concreta = score 0.
- "sim" sem explicação = score máximo 1.
- "mais ou menos" / "acho que sim" / "tentamos" = score 0.
- Só pontue 2 com dado específico, verificável e detalhado.
- Seja conservador — melhor subestimar e surpreender na call.

PENALIDADES AUTOMÁTICAS DE SCORE:
- Canal único de aquisição (ex: só Instagram, só indicação) → C máximo 25.
- ICP definido por produto ou faixa etária, não por perfil comportamental/econômico → S máximo 20.
- Ticket médio abaixo de R$500 sem volume comprovado → A máximo 35.
- Operação que "trava em você" → L máximo 20.
- Sem cadência formal documentada → G máximo 20.
- Forecast baseado em feeling ou estimativa → A máximo 30.
- Resposta de 1 palavra para qualquer dimensão → essa dimensão = 0.

INTERPRETAÇÃO INTERNA REVISADA:
- 0–3 pontos reais → Score geral máximo 30 → Nível: Crítico
- 4–6 pontos reais → Score geral 31–55 → Nível: Em Desenvolvimento
- 7–9 pontos reais → Score geral 56–75 → Nível: Estruturado
- 10–12 pontos reais → Score geral 76–100 → Nível: Escalável

INVESTIGAÇÃO SETORIAL — OBRIGATÓRIO EM TODOS OS RELATÓRIOS:
Independente do score (alto ou baixo), você SEMPRE deve gerar os 3 campos abaixo. Nunca omita — são parte essencial do relatório.

- setor_insights: 2-3 frases diretas sobre os erros ou riscos mais comuns de empresas do mesmo setor e faturamento. Para scores altos: aponte os riscos de crescimento e armadilhas de escala do segmento. Seja específico ao segmento — nunca genérico.
- scaleco_tabela: SEMPRE 3 linhas. Para scores baixos/médios: desafios atuais. Para scores altos: os próximos desafios de escala que a operação vai enfrentar. Cada linha com desafio + impacto + como o Scale Method™ da ScaleCo endereça.
- ecossistema_match: 1 parágrafo sobre como a ScaleCo e o Scale Method™ se conectam com o momento específico desta operação — seja para corrigir gargalos ou para sustentar a escala já iniciada.

NOME DO LEAD — CRÍTICO:
O nome do lead vem nos dados do formulário pré-preenchido ([DADOS DO FORMULÁRIO]). Use exatamente esse nome no campo "nome" do JSON. Nunca coloque null se o nome veio no formulário.

GERAÇÃO DO RELATÓRIO:
Após as 7 perguntas, responda APENAS com este JSON puro (sem markdown, sem texto antes ou depois):

{"tipo":"relatorio","nome":"[nome do formulário]","empresa":"[empresa mencionada na conversa]","email":"[email do formulário]","whatsapp":"[whatsapp do formulário ou null]","faturamento":"[faixa do formulário ou mencionada]","localizacao":"[cidade/estado se mencionado ou null]","score_geral":[0-100],"nivel":"[Crítico|Em Desenvolvimento|Estruturado|Escalável]","dimensoes":{"S":{"score":[0-100],"status":"[frase curta diagnóstico]","gargalo":"[gargalo específico ou null]"},"C":{"score":[0-100],"status":"[frase curta diagnóstico]","gargalo":"[gargalo específico ou null]"},"A":{"score":[0-100],"status":"[frase curta diagnóstico]","gargalo":"[gargalo específico ou null]"},"L":{"score":[0-100],"status":"[frase curta diagnóstico]","gargalo":"[gargalo específico ou null]"},"E":{"score":[0-100],"status":"[frase curta diagnóstico]","gargalo":"[gargalo específico ou null]"},"G":{"score":[0-100],"status":"[frase curta diagnóstico]","gargalo":"[gargalo específico ou null]"}},"parecer":"[2-3 frases diretas sobre a realidade da operação — sem elogios, sem suavizar. Para scores altos: aponte o próximo risco real.]","gargalo_critico":"[maior problema atual ou próximo risco de escala em 1 frase objetiva — nunca null]","prioridades":["ação concreta 1","ação concreta 2","ação concreta 3"],"setor_insights":"[2-3 frases específicas ao segmento — OBRIGATÓRIO, nunca null]","scaleco_tabela":[{"desafio":"[desafio 1]","impacto":"[impacto direto]","conexao":"[como Scale Method™ resolve]"},{"desafio":"[desafio 2]","impacto":"[impacto direto]","conexao":"[como Scale Method™ resolve]"},{"desafio":"[desafio 3]","impacto":"[impacto direto]","conexao":"[como Scale Method™ resolve]"}],"ecossistema_match":"[parágrafo específico sobre como ScaleCo e Scale Method™ se conectam com este momento da operação — OBRIGATÓRIO, nunca null]"}

TOM: Direto, frases curtas, sem elogios. Nunca use "mentoria" ou "consultoria".`;

  try {
    const body = JSON.parse(event.body);
    const { messages, formData } = body;

    // Handle lead capture (form submitted, chat not started)
    if (messages && messages.length === 1 && messages[0].content === '__lead_capture__') {
      if (formData && formData.email) {
        await sendLeadCapture(formData);
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: 'ok' }),
      };
    }

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
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: messagesWithContext,
      }),
    });

    const data = await response.json();
    const reply = data.content?.map((b) => b.text || "").join("") || "Erro ao processar resposta.";

    // Try to send email if it's a report
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const report = JSON.parse(jsonMatch[0]);
        if (report.tipo === 'relatorio') {
          // Fallback de todos os campos do formData
          if (!report.nome && formData?.nome) report.nome = formData.nome;
          if (!report.email && formData?.email) report.email = formData.email;
          if (!report.whatsapp && formData?.whatsapp) report.whatsapp = formData.whatsapp;
          if (!report.faturamento && formData?.faturamento) report.faturamento = formData.faturamento;
          if (!report.localizacao && formData?.localizacao) report.localizacao = formData.localizacao;

          const conversation = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => {
              const prefix = m.role === 'user' ? 'Lead' : 'Archie';
              if (m.content.startsWith('[DADOS DO FORMULÁRIO')) return null;
              return `${prefix}: ${m.content}`;
            })
            .filter(Boolean)
            .join('\n\n');

          const answers = messages
            .filter(m => m.role === 'user' && !m.content.startsWith('[DADOS DO FORMULÁRIO'))
            .map(m => m.content)
            .join('\n\n');

          report.conversation = conversation;
          report.answers = answers;

          await sendEmails(report);
        }
      }
    } catch (e) {
      console.error('Erro ao processar relatório:', e.message);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Erro geral:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Erro interno. Tente novamente." }),
    };
  }
};

async function sendLeadCapture(data) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#000000;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#111111;border-radius:8px;overflow:hidden;border:1px solid #222222;">
  <div style="background:#2D5BE3;padding:24px 32px;">
    <div style="font-size:11px;letter-spacing:4px;color:rgba(0,0,0,0.5);font-weight:700;text-transform:uppercase;">SCALECO · SCALE DIAGNOSTIC™</div>
    <div style="font-size:20px;font-weight:800;color:#000;margin-top:6px;">NOVO LEAD CADASTRADO</div>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:#1a1a1a;border:1px solid #222;border-radius:8px;padding:20px;font-size:14px;color:#888;line-height:2.2;">
      <strong style="color:#444;">Nome:</strong> <span style="color:#ddd;">${data.nome}</span><br>
      <strong style="color:#444;">Email:</strong> <a href="mailto:${data.email}" style="color:#2D5BE3;">${data.email}</a><br>
      <strong style="color:#444;">WhatsApp:</strong> <span style="color:#ddd;">${data.whatsapp}</span><br>
      <strong style="color:#444;">Empresa:</strong> <span style="color:#ddd;">${data.empresa || '—'}</span><br>
      <strong style="color:#444;">Cargo:</strong> <span style="color:#ddd;">${data.cargo || '—'}</span><br>
      <strong style="color:#444;">Faturamento:</strong> <span style="color:#ddd;">${data.faturamento}</span><br>
      <strong style="color:#444;">Colaboradores:</strong> <span style="color:#ddd;">${data.colaboradores || '—'}</span><br>
      <strong style="color:#444;">Website:</strong> <span style="color:#ddd;">${data.website || '—'}</span>
    </div>
    <div style="margin-top:16px;padding:14px 16px;background:#131929;border:1px solid #1e2d5e;border-radius:8px;font-size:13px;color:#8baaf0;">
      ⚠ Este lead iniciou o diagnóstico mas ainda não concluiu.
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="https://wa.me/55${data.whatsapp.replace(/\D/g,'')}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;padding:12px 28px;font-weight:700;font-size:14px;">CHAMAR NO WHATSAPP</a>
    </div>
  </div>
  <div style="padding:16px;border-top:1px solid #1e1e1e;text-align:center;font-size:11px;color:#333;">ScaleCo · diagnostic.scaleco.ai</div>
</div></body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Archie · ScaleCo <noreply@scaleco.ai>',
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
    A: "Analytics",
    L: "Leadership Institutionalization",
    E: "Execution Cadence",
    G: "Governance & Rhythm"
  };

  const dimsHTML = Object.entries(report.dimensoes).map(([k, d]) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#2D5BE3;">${k}</td><td style="padding:8px 12px;color:#555;font-size:13px;">${dimNames[k] || k}</td><td style="padding:8px 12px;font-weight:700;text-align:right;">${d.score}</td></tr>${d.gargalo ? `<tr><td colspan="3" style="padding:2px 12px 10px;font-size:12px;color:#EF4444;">↳ ${d.gargalo}</td></tr>` : ""}`
  ).join("");

  const priosHTML = report.prioridades.map((p, i) =>
    `<tr><td style="padding:8px 12px;font-weight:700;color:#2D5BE3;font-size:18px;">${String(i + 1).padStart(2, "0")}</td><td style="padding:8px 12px;color:#333;font-size:14px;">${p}</td></tr>`
  ).join("");

  const tabelaHTML = Array.isArray(report.scaleco_tabela) ? report.scaleco_tabela.map(row =>
    `<tr>
      <td style="padding:10px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;">${row.desafio}</td>
      <td style="padding:10px 12px;font-size:13px;color:#555;border-bottom:1px solid #eee;">${row.impacto}</td>
      <td style="padding:10px 12px;font-size:13px;color:#2D5BE3;border-bottom:1px solid #eee;">${row.conexao}</td>
    </tr>`
  ).join("") : "";

  const conversationHTML = report.conversation
    ? `<div style="margin-top:24px;border-top:1px solid #eee;padding-top:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:12px;">HISTÓRICO DA CONVERSA</div>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;font-size:12px;color:#444;line-height:2;white-space:pre-wrap;">${report.conversation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : '';

  // Dimensões com dark theme
  const dimsHTMLDark = Object.entries(report.dimensoes).map(([k, d]) =>
    `<tr>
      <td style="padding:8px 12px;font-weight:700;color:#2D5BE3;font-size:15px;">${k}</td>
      <td style="padding:8px 12px;color:#aaa;font-size:12px;letter-spacing:1px;text-transform:uppercase;">${dimNames[k] || k}</td>
      <td style="padding:8px 12px;font-weight:700;text-align:right;font-size:18px;color:#fff;">${d.score}</td>
    </tr>${d.gargalo ? `<tr><td colspan="3" style="padding:2px 12px 12px 28px;font-size:12px;color:#EF4444;">↳ ${d.gargalo}</td></tr>` : ''}`
  ).join("");

  const priosHTMLDark = report.prioridades.map((p, i) =>
    `<tr>
      <td style="padding:10px 12px;font-weight:700;color:#2D5BE3;font-size:20px;vertical-align:top;width:40px;">${String(i + 1).padStart(2, "0")}</td>
      <td style="padding:10px 12px;color:#ccc;font-size:14px;line-height:1.5;">${p}</td>
    </tr>`
  ).join("");

  const tabelaHTMLDark = Array.isArray(report.scaleco_tabela) ? report.scaleco_tabela.map(row =>
    `<tr>
      <td style="padding:12px 14px;font-size:13px;color:#ddd;border-bottom:1px solid #1e1e1e;vertical-align:top;">${row.desafio}</td>
      <td style="padding:12px 14px;font-size:13px;color:#888;border-bottom:1px solid #1e1e1e;vertical-align:top;">${row.impacto}</td>
      <td style="padding:12px 14px;font-size:13px;color:#2D5BE3;border-bottom:1px solid #1e1e1e;vertical-align:top;">${row.conexao}</td>
    </tr>`
  ).join("") : "";

  const conversationHTMLDark = report.conversation
    ? `<div style="margin-top:24px;border-top:1px solid #1e1e1e;padding-top:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:#444;text-transform:uppercase;margin-bottom:12px;">HISTÓRICO DA CONVERSA</div>
        <div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:8px;padding:16px;font-size:12px;color:#666;line-height:2;white-space:pre-wrap;">${report.conversation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>` : '';

  const adminHTML = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#000000;font-family:Arial,sans-serif;">
<div style="max-width:640px;margin:24px auto;background:#111111;border-radius:8px;overflow:hidden;border:1px solid #222222;">

  <!-- HEADER AZUL -->
  <div style="background:#2D5BE3;padding:32px;text-align:center;">
    <div style="font-size:11px;letter-spacing:4px;color:rgba(0,0,0,0.5);font-weight:700;text-transform:uppercase;">SCALECO · SCALE METHOD™ · SCALE DIAGNOSTIC™</div>
    <div style="font-size:26px;font-weight:800;color:#000;margin-top:8px;letter-spacing:0.02em;">DIAGNÓSTICO CONCLUÍDO</div>
    <div style="font-size:13px;color:rgba(0,0,0,0.55);margin-top:8px;">${report.empresa || '—'} · ${report.nome}${report.localizacao ? ' · ' + report.localizacao : ''}</div>
  </div>

  <div style="padding:32px;">

    <!-- SCORE -->
    <div style="text-align:center;background:#1a1a1a;border-radius:12px;padding:28px 24px;margin-bottom:24px;border:1px solid #1e2d5e;border-top:3px solid #2D5BE3;">
      <div style="font-size:10px;letter-spacing:3px;color:#444;text-transform:uppercase;margin-bottom:8px;">SCORE GERAL · SCALE METHOD™</div>
      <div style="font-size:72px;font-weight:700;color:${nivelColor};line-height:1;margin-bottom:10px;">${report.score_geral}</div>
      <span style="display:inline-block;padding:5px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;background:${nivelColor}22;color:${nivelColor};border:1px solid ${nivelColor}44;">${report.nivel}</span>
      ${report.parecer ? `<div style="font-size:14px;color:#888;line-height:1.7;margin-top:18px;font-style:italic;max-width:520px;margin-left:auto;margin-right:auto;">${report.parecer}</div>` : ''}
    </div>

    <!-- DIMENSÕES -->
    <div style="font-size:10px;letter-spacing:3px;color:#444;text-transform:uppercase;margin-bottom:10px;">DIMENSÕES SCALE</div>
    <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;margin-bottom:20px;border:1px solid #1e1e1e;">${dimsHTMLDark}</table>

    <!-- GARGALO -->
    <div style="background:#1a0a0a;border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin-bottom:20px;">
      <div style="font-size:10px;letter-spacing:2px;color:#EF4444;text-transform:uppercase;margin-bottom:8px;">⚠ GARGALO CRÍTICO</div>
      <div style="font-size:14px;color:#eee;font-weight:500;line-height:1.5;">${report.gargalo_critico || '—'}</div>
    </div>

    <!-- PRIORIDADES -->
    <div style="font-size:10px;letter-spacing:3px;color:#444;text-transform:uppercase;margin-bottom:10px;">PRIORIDADES DE AÇÃO</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${priosHTMLDark}</table>

    ${tabelaHTMLDark ? `
    <!-- INVESTIGAÇÃO SETORIAL -->
    <div style="font-size:10px;letter-spacing:3px;color:#444;text-transform:uppercase;margin-bottom:10px;">INVESTIGAÇÃO SETORIAL · SCALECO</div>
    ${report.setor_insights ? `<div style="font-size:13px;color:#888;line-height:1.7;margin-bottom:14px;padding:14px 16px;background:#131929;border:1px solid #1e2d5e;border-radius:8px;">${report.setor_insights}</div>` : ''}
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #1e1e1e;">
      <thead><tr style="background:#111;">
        <th style="padding:10px 14px;text-align:left;font-size:10px;color:#444;border-bottom:1px solid #1e1e1e;letter-spacing:1px;text-transform:uppercase;">Principal desafio</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;color:#444;border-bottom:1px solid #1e1e1e;letter-spacing:1px;text-transform:uppercase;">Impacto direto</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;color:#2D5BE3;border-bottom:1px solid #1e1e1e;letter-spacing:1px;text-transform:uppercase;">Conexão ScaleCo</th>
      </tr></thead>
      <tbody>${tabelaHTMLDark}</tbody>
    </table>
    ${report.ecossistema_match ? `<div style="margin-top:12px;padding:14px 16px;background:#131929;border:1px solid #1e2d5e;border-radius:8px;font-size:13px;color:#8baaf0;line-height:1.6;">${report.ecossistema_match}</div>` : ''}
    ` : ''}

    <!-- LEAD INFO -->
    <div style="background:#1a1a1a;border:1px solid #1e1e1e;border-radius:8px;padding:16px;font-size:13px;color:#666;margin-top:20px;line-height:2;">
      <strong style="color:#444;">Lead:</strong> <span style="color:#ccc;">${report.nome}</span> · <a href="mailto:${report.email || ''}" style="color:#2D5BE3;">${report.email || '—'}</a><br>
      ${report.whatsapp ? `<strong style="color:#444;">WhatsApp:</strong> <a href="https://wa.me/55${report.whatsapp.replace(/\D/g,'')}" style="color:#2D5BE3;">${report.whatsapp}</a><br>` : ''}
      ${report.faturamento ? `<strong style="color:#444;">Faturamento:</strong> <span style="color:#ccc;">${report.faturamento}</span><br>` : ''}
      ${report.localizacao ? `<strong style="color:#444;">Localização:</strong> <span style="color:#ccc;">${report.localizacao}</span><br>` : ''}
      ${report.empresa ? `<strong style="color:#444;">Empresa:</strong> <span style="color:#ccc;">${report.empresa}</span>` : ''}
    </div>

    ${conversationHTMLDark}
  </div>

  <div style="padding:16px;border-top:1px solid #1e1e1e;text-align:center;font-size:11px;color:#333;">ScaleCo · diagnostic.scaleco.ai · Powered by Archie</div>
</div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: "Archie · ScaleCo <noreply@scaleco.ai>",
      to: ["fabio@scaleco.ai"],
      subject: `[Diagnóstico] ${report.nome} · ${report.empresa || '—'} · Score ${report.score_geral}`,
      html: adminHTML
    }),
  });

  const result = await res.json();
  if (!res.ok) console.error('Resend error:', JSON.stringify(result));
  else console.log('E-mail enviado:', result.id);
}
