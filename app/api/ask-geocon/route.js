export async function POST(request) {
  try {
    const { question, context } = await request.json();

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: "You are GEOCON Intelligence, an AI advisor for the GEOCON plant conservation and venture platform. Answer questions about species, programs, and strategy concisely. Use the data provided. Be specific with species names and numbers. Keep answers under 200 words.",
        messages: [{ role: "user", content: `${context}\n\nQuestion: ${question}` }]
      })
    });

    const data = await res.json();

    if (data.content?.[0]?.text) {
      return Response.json({ answer: data.content[0].text });
    } else {
      return Response.json({ error: "No response from API", details: data }, { status: 500 });
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
