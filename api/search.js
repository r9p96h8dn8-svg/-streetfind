export default async function handler(req, res) {
  // Permitir peticiones desde StreetFind en GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder a OPTIONS
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
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "SERPAPI_KEY no configurada"
    });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase no está configurado"
    });
  }

  try {

    // -----------------------------
    // 1. BUSCAR PRODUCTOS EN SERPAPI
    // -----------------------------

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

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const products = data.shopping_results || [];

    // -----------------------------
    // 2. GUARDAR PRECIOS EN SUPABASE
    // -----------------------------

    const records = [];

    for (const product of products) {

      const priceText = product.price;

      if (!priceText) {
        continue;
      }

      // Convertir precios como:
      // 89,99 €
      // 89.99 €
      // EUR 89.99

      const match =
        String(priceText).match(
          /(\d{1,5}(?:[.,]\d{1,2})?)/
        );

      if (!match) {
        continue;
      }

      let priceNumber = match[1];

      if (
        priceNumber.includes(",") &&
        priceNumber.includes(".")
      ) {

        if (
          priceNumber.lastIndexOf(",") >
          priceNumber.lastIndexOf(".")
        ) {

          priceNumber =
            priceNumber
              .replace(/\./g, "")
              .replace(",", ".");

        } else {

          priceNumber =
            priceNumber.replace(/,/g, "");

        }

      } else {

        priceNumber =
          priceNumber.replace(",", ".");

      }

      const price =
        parseFloat(priceNumber);

      if (!Number.isFinite(price)) {
        continue;
      }

      const productKey =
        product.product_link ||
        product.title;

      if (!productKey) {
        continue;
      }

      records.push({
        product_key: String(productKey),
        title: product.title || null,
        price: price,
        currency: "EUR",
        product_link: product.product_link || null,
        source: product.source || null,
        thumbnail: product.thumbnail || null
      });

    }

    // -----------------------------
    // 3. ENVIAR LOS PRECIOS A SUPABASE
    // -----------------------------

    if (records.length > 0) {

      const supabaseResponse =
        await fetch(
          supabaseUrl +
          "/rest/v1/price_history",
          {
            method: "POST",

            headers: {
              "apikey": supabaseKey,
              "Authorization":
                "Bearer " + supabaseKey,
              "Content-Type":
                "application/json",
              "Prefer":
                "return=minimal"
            },

            body:
              JSON.stringify(records)
          }
        );

      if (!supabaseResponse.ok) {

        const errorText =
          await supabaseResponse.text();

        console.error(
          "Error guardando precios:",
          errorText
        );

      }

    }

    // -----------------------------
    // 4. DEVOLVER LOS PRODUCTOS
    // -----------------------------

    return res.status(200).json(data);

  } catch (error) {

    console.error(
      "StreetFind API error:",
      error
    );

    return res.status(500).json({
      error: "Error buscando productos"
    });

  }
}