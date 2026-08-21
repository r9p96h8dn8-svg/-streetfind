export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const productKey = req.query.product_key;

  if (!productKey) {
    return res.status(400).json({
      error: "Falta product_key"
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase no está configurado"
    });
  }

  try {
    const url =
      supabaseUrl +
      "/rest/v1/price_history" +
      "?select=price,currency,recorded_at" +
      "&product_key=eq." +
      encodeURIComponent(productKey) +
      "&order=recorded_at.asc";

    const response = await fetch(url, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": "Bearer " + supabaseKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      history: data
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error obteniendo historial"
    });
  }
}