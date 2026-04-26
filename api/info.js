import { getRedis } from './redis.js';

export default async function handler(req, res) {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID' });
  }

  try {
    const redis = await getRedis();
    const rawData = await redis.get(`link:${id}`);
    
    if (!rawData) {
      return res.status(404).json({ error: 'Link đã hết hạn hoặc đã được sử dụng' });
    }

    const data = JSON.parse(rawData);

    if (Date.now() > data.exp) {
      return res.status(410).json({ error: 'Link đã hết hạn' });
    }

    return res.status(200).json({ name: data.name, exp: data.exp });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi server' });
  }
}
