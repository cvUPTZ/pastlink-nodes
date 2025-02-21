const http = require('http');
const { corsHeaders } = require("../shared-one/cors");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const server = http.createServer(async (req: any, res: any) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, { ...corsHeaders, "Access-Control-Max-Age": "86400" });
    res.end();
    return;
  }

  try {
    let requestBody = '';
    req.on('data', (chunk: any) => {
      requestBody += chunk;
    });

    req.on('end', async () => {
      const { text } = JSON.parse(requestBody);

      if (!text) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required field 'text'." }));
        return;
      }

      if (!GEMINI_API_KEY) {
        res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server configuration error. Missing API key." }));
        return;
      }

      // Simplified prompt that requests exact JSON structure
      const prompt = `
Analyze the following Arabic text and extract the main entities.
Return ONLY a JSON object with the following structure, no other text:
{
  "entities": [
    "entity1",
    "entity2",
    ...
  ]
}

Text to analyze:
${text}
`;

      const geminiResponse = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();

      if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid API response structure");
      }

      const geminiResponseText = geminiData.candidates[0].content.parts[0].text.trim();

      try {
        // Parse the response directly as JSON
        const jsonResponse = JSON.parse(geminiResponseText);

        // Validate the response structure
        if (!Array.isArray(jsonResponse.entities)) {
          throw new Error("Invalid response format: entities array missing");
        }

        // Validate each entity
        jsonResponse.entities = jsonResponse.entities.filter(entity => typeof entity === 'string');

        // Call the extract-relationships function
        const relationshipsResponse = await fetch(SUPABASE_URL + "/functions/v1/extract-relationships", {
          method: "POST",
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ text: text })
        });

        if (!relationshipsResponse.ok) {
          throw new Error(`Extract relationships function error: ${relationshipsResponse.status}`);
        }

        const relationshipsData = await relationshipsResponse.json();

        // Combine entities and relationships into a single response
        const combinedResponse = {
          entities: jsonResponse.entities,
          relationships: relationshipsData.relationships || []
        };

        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(combinedResponse));

      } catch (error: any) {
        console.error("Error:", error);
        res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Processing error", details: error.message }));
      }
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Processing error", details: error.message }));
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
