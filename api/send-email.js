// Vercel Serverless Function
// Recebe { to, subject, body, html } do app (index.html / artifact) e envia o e-mail de
// verdade através da API do Brevo (antigo Sendinblue), sem nunca expor a API key no navegador.
//
// Variáveis de ambiente necessárias (configure no painel do Vercel, não aqui no código):
//   BREVO_API_KEY   -> a chave de API criada no Brevo (SMTP & API > API Keys)
//   BREVO_FROM_EMAIL -> o e-mail verificado no Brevo (Senders & IP > Senders)
//   BREVO_FROM_NAME  -> (opcional) nome de exibição do remetente

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const { to, subject, body, html } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Campos obrigatórios: to, subject, body." });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "Central de Facilities";

  if (!apiKey || !fromEmail) {
    return res.status(500).json({
      error: "Configuração ausente no servidor: defina BREVO_API_KEY e BREVO_FROM_EMAIL nas variáveis de ambiente do Vercel.",
    });
  }

  try {
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject: subject,
        textContent: body,
        ...(html ? { htmlContent: html } : {}),
      }),
    });

    if (!brevoResponse.ok) {
      const detail = await brevoResponse.text();
      console.error("Erro do Brevo:", brevoResponse.status, detail);
      return res.status(502).json({ error: "Brevo recusou o envio.", detail });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao chamar o Brevo:", err);
    return res.status(500).json({ error: err.message });
  }
};
