export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    const response = await fetch("https://api.github.com/repos/JudikaM/phishing-escape-room", {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "phishing-escape-room"
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "unavailable" }));
      return;
    }

    const data = await response.json();
    const count = data?.stargazers_count;

    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "unavailable" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ stars: count }));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "unavailable" }));
  }
}
