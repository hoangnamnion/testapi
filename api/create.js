import { getRedis } from './redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method không hợp lệ' });
  }

  const { name, ttlMinutes } = req.body || {};

  const cleanName = String(name || '').trim();
  const minutes = Number(ttlMinutes);

  if (!cleanName) {
    return res.status(400).json({ error: 'Thiếu tên khách hàng' });
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return res.status(400).json({ error: 'Thời gian sống phải là số phút lớn hơn 0' });
  }

  const safeMinutes = Math.floor(minutes);
  const expTime = Date.now() + safeMinutes * 60 * 1000;
  
  // Generate a short 6-character random ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortId = '';
  for (let i = 0; i < 6; i++) {
    shortId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const payload = {
    name: cleanName,
    exp: expTime
  };

  try {
    const redis = await getRedis();
    // Save to Redis with an expiration time (in seconds)
    await redis.set(`link:${shortId}`, JSON.stringify(payload), { EX: safeMinutes * 60 });
    return res.status(200).json({ id: shortId, exp: expTime });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi khi lưu vào Database' });
  }
}
