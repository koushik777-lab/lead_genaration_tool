import { Router } from "express";

const router = Router();

router.get("/businesses", async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string" || !q.trim()) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "SERPAPI_KEY not configured" });
  }

  try {
    const query = q.trim();
    let allResults = [];
    let start = 0;
    let hasMore = true;
    let pagesFetched = 0;
    const MAX_PAGES = 3; // Safety limit: 3 pages = 60 results

    while (hasMore && pagesFetched < MAX_PAGES) {
      const params = new URLSearchParams({
        engine: "google_maps",
        q: query,
        api_key: apiKey,
        start: start.toString(),
        hl: "en",
      });

      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

      if (!response.ok) {
        const text = await response.text();
        console.error(`SerpAPI error (start=${start}):`, text);
        // If first page fails, return error. Otherwise, keep what we have.
        if (pagesFetched === 0) {
          return res.status(502).json({ error: "Search API error", details: text });
        }
        break;
      }

      const data = await response.json();
      const localResults = data.local_results || [];

      if (localResults.length === 0) {
        hasMore = false;
        break;
      }

      // Filter duplicates by place_id
      const newItems = localResults.filter(
        (item) => !allResults.some((existing) => existing.placeId === (item.place_id || item.fid))
      );

      if (newItems.length === 0) {
        hasMore = false;
        break;
      }

      // Map to our UI format
      const mappedItems = newItems.map((item) => ({
        type: "local",
        name: item.title || item.name || "",
        address: item.address || "",
        phone: item.phone || "",
        website: item.website || item.links?.website || "",
        rating: item.rating ?? null,
        reviews: item.reviews ?? null,
        category: item.type || item.category || item.extensions?.[0] || "",
        hours: item.hours || "",
        thumbnail: item.thumbnail || "",
        placeId: item.place_id || item.fid || "",
        googleMapsLink: item.links?.directions || item.gps_coordinates || "",
      }));

      allResults.push(...mappedItems);

      start += 20;
      pagesFetched++;
      
      // If there's no serpapi_pagination or next page, stop
      if (!data.serpapi_pagination?.next) {
        hasMore = false;
      }
    }

    return res.json({
      query,
      total: allResults.length,
      results: allResults,
    });
  } catch (err) {
    console.error("Search internal error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

export default router;
