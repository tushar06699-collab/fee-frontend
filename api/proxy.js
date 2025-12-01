export default async function handler(req, res) {
  const path = req.query.path;
  const url = `http://pserp.pythonanywhere.com/${path}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", details: err.toString() });
  }
}
