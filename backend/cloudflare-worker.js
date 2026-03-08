
// Cloudflare Worker for QARI AI with KV Caching and Gemini Integration
// Binding: QARIAI_CACHE (KV Namespace)

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json();
      const { surah, ayah, audioFingerprint, audioData, mimeType, prompt } = body;

      if (!surah || !ayah || !audioFingerprint) {
        return new Response("Missing required fields", { status: 400 });
      }

      // LAYER 2 - SERVER SIDE CACHE (KV)
      const cacheKey = `rec_cache_${surah}_${ayah}_${audioFingerprint}`;
      const cachedResponse = await env.QARIAI_CACHE.get(cacheKey);

      if (cachedResponse) {
        console.log("KV Cache Hit:", cacheKey);
        return new Response(cachedResponse, {
          headers: { "Content-Type": "application/json", "X-Cache": "HIT" }
        });
      }

      console.log("KV Cache Miss, calling Gemini...");

      // Call Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: audioData } }
            ]
          }]
        })
      });

      const result = await geminiResponse.json();

      // Extract the text content from Gemini response (assuming standard format)
      // Note: You might need to adjust based on your specific prompt/response structure
      const feedbackText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (feedbackText) {
        // Find JSON in the response
        const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const finalJson = jsonMatch[0];
            // Store in KV for 30 days
            await env.QARIAI_CACHE.put(cacheKey, finalJson, { expirationTtl: 2592000 });

            return new Response(finalJson, {
              headers: { "Content-Type": "application/json", "X-Cache": "MISS" }
            });
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
