export default async function handler(req, res) {
  // Permitir peticiones desde StreetFind en GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder a las peticiones OPTIONS del navegador
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      error: "Falta la búsqueda"
    });
  }

  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "SERPAPI_KEY no configurada"
    });
  }

  try {
    const url =
      "https://serpapi.com/search.json" +
      "?engine=google_shopping" +
      "&q=" + encodeURIComponent(query) +
      "&gl=es" +
      "&hl=es" +
      "&currency=EUR" +
      "&api_key=" + encodeURIComponent(apiKey);

    const response = await fetch(url);
    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Error buscando productos"
    });
  }
}