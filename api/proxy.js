export default async function handler(req, res) {
  const path = req.query.path;  // example: "students"
  const backendURL = `http://pserp.pythonanywhere.com/${path}`;

  try {
    const response = await fetch(backendURL, {
      method: req.method,
      headers: {
        "Content-Type": "application/json"
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy failed", details: error.toString() });
  }
}
