export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const shortUrl = await response.text();
      return res.status(200).json({ shortUrl });
    } else {
      return res.status(500).json({ error: 'Failed to shorten URL' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
