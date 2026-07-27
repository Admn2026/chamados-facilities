// Vercel Serverless Function
// Guarda e lê dados compartilhados (chamados, requisições, chat) usando o Vercel KV,
// para que TODAS as pessoas que acessam o app vejam os mesmos dados — em vez de cada
// navegador guardar sua própria cópia isolada (que era o problema do localStorage).
//
// Variáveis de ambiente necessárias — são criadas automaticamente quando você conecta
// um banco "KV" a este projeto pela aba "Storage" do Vercel:
//   KV_REST_API_URL
//   KV_REST_API_TOKEN

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({
      error: "Banco de dados não configurado. Conecte um banco 'KV' a este projeto na aba Storage do Vercel.",
    });
  }

  async function kvCommand(cmd) {
    const r = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmd),
    });
    return r.json();
  }

  try {
    if (req.method === "GET") {
      const key = req.query?.key;
      if (!key) return res.status(400).json({ error: "Parâmetro 'key' é obrigatório." });
      const result = await kvCommand(["GET", key]);
      return res.status(200).json({ value: result.result ?? null });
    }

    if (req.method === "POST") {
      const { action, key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: "Campo 'key' é obrigatório." });

      if (action === "set") {
        await kvCommand(["SET", key, value]);
        return res.status(200).json({ ok: true });
      }
      if (action === "delete") {
        await kvCommand(["DEL", key]);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: "Campo 'action' inválido (use 'set' ou 'delete')." });
    }

    return res.status(405).json({ error: "Método não permitido. Use GET ou POST." });
  } catch (err) {
    console.error("Erro no storage:", err);
    return res.status(500).json({ error: err.message });
  }
};
