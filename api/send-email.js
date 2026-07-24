// Vercel Serverless Function
// Recebe { to, subject, body } do app (index.html / artifact) e envia o e-mail de
// verdade através da API do SendGrid, sem nunca expor a API key no navegador.
//
// Variáveis de ambiente necessárias (configure no painel do Vercel, não aqui no código):
//   SENDGRID_API_KEY   -> a chave de API criada no SendGrid (Settings > API Keys)
//   SENDGRID_FROM_EMAIL -> o e-mail verificado no SendGrid (Single Sender Verification)
//   SENDGRID_FROM_NAME  -> (opcional) nome de exibição do remetente

module.exports = async function handler(req, res) {
  // Libera CORS para o app poder chamar essa função a partir do navegador
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { to, subject, body } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Campos obrigatórios: to, subject, body." });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME || "Central de Facilities";

  if (!apiKey || !fromEmail) {
    return res.status(500).json({
      error: "Configuração ausente no servidor: defina SENDGRID_API_KEY e SENDGRID_FROM_EMAIL nas variáveis de ambiente do Vercel.",
    });
  }

  try {
    const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: [{ type: "text/plain", value: body }],
      }),
    });

    if (!sgResponse.ok) {
      const detail = await sgResponse.text();
      console.error("Erro do SendGrid:", sgResponse.status, detail);
      return res.status(502).json({ error: "SendGrid recusou o envio.", detail });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao chamar o SendGrid:", err);
    return res.status(500).json({ error: err.message });
  }
};
