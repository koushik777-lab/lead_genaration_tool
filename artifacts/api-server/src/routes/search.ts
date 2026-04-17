import { Router } from "express";

const router = Router();

router.get("/search/businesses", async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string" || !q.trim()) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "SERPAPI_KEY not configured" });
  }

  try {
    const params = new URLSearchParams({
      engine: "google",
      q: q.trim(),
      api_key: apiKey,
      num: "20",
      hl: "en",
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      console.error("SerpAPI error:", response.status, text);
      return res.status(502).json({ error: "Search API error", details: text });
    }

    const data = await response.json() as any;

    const results: any[] = [];

    if (data.local_results && Array.isArray(data.local_results)) {
      for (const item of data.local_results) {
        results.push({
          type: "local",
          name: item.title || item.name || "",
          address: item.address || "",
          phone: item.phone || "",
          website: item.website || item.links?.website || "",
          rating: item.rating ?? null,
          reviews: item.reviews ?? null,
          category: item.type || item.extensions?.[0] || "",
          hours: item.hours || "",
          thumbnail: item.thumbnail || "",
          placeId: item.place_id || "",
          googleMapsLink: item.links?.directions || "",
        });
      }
    }

    if (data.organic_results && Array.isArray(data.organic_results)) {
      for (const item of data.organic_results) {
        if (results.length >= 20) break;
        const alreadyAdded = results.some(
          (r) => r.website && item.link && r.website.includes(new URL(item.link).hostname)
        );
        if (alreadyAdded) continue;
        results.push({
          type: "organic",
          name: item.title || "",
          address: "",
          phone: "",
          website: item.link || "",
          rating: null,
          reviews: null,
          category: item.displayed_link || "",
          hours: "",
          thumbnail: item.thumbnail || item.favicon || "",
          snippet: item.snippet || "",
          placeId: "",
          googleMapsLink: "",
        });
      }
    }

    return res.json({
      query: q.trim(),
      total: results.length,
      results,
      searchInformation: data.search_information || {},
    });
  } catch (err: any) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

export default router;
