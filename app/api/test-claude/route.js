export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "No ANTHROPIC_API_KEY found" });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
       model: model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [{ role: "user", content: "Say hello in one word" }],
      }),
    });

    const data = await res.json();
    return Response.json({ status: res.status, response: data });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
