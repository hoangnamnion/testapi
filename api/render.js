import fs from 'fs';
import path from 'path';
import { getRedis } from './redis.js';

export default async function handler(req, res) {
  const { route, id } = req.query;

  // Xác định file html cần load dựa vào route
  const fileName = route === 'download2' ? 'download2.html' : 'download.html';
  const filePath = path.join(process.cwd(), fileName);

  let html = '';
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error("Lỗi đọc file HTML", err);
    return res.status(500).send("Lỗi Server: Không tìm thấy file gốc.");
  }

  // Lấy thông tin khách hàng từ Database
  let customerName = "Khách hàng VIP";
  let isExpired = false;
  let isUsed = false;
  
  try {
    const redis = await getRedis();
    const rawData = await redis.get(`link:${id}`);
    
    if (rawData) {
      const data = JSON.parse(rawData);
      customerName = data.name || "Khách hàng VIP";
      if (Date.now() > data.exp) {
        isExpired = true;
      }
    } else {
      isUsed = true;
    }
  } catch (error) {
    console.error("Redis Error", error);
  }

  // Chuẩn bị Meta Tags động
  let ogTitle = `🎫 Locket VIP Pass - Dành riêng cho ${customerName}`;
  let ogDesc = `Nhấn vào đây để tải cấu hình VIP. Phiên bản cao cấp, an toàn tuyệt đối.`;

  if (isExpired) {
    ogTitle = `❌ Locket VIP - Link đã hết hạn`;
    ogDesc = `Phiên bản cài đặt dành cho ${customerName} đã quá hạn sử dụng.`;
  } else if (isUsed) {
    ogTitle = `❌ Locket VIP - Link đã được sử dụng`;
    ogDesc = `Link này đã được kích hoạt. Bạn cần lấy link mới.`;
  }

  // Bơm Meta Tags vào thẻ <head> của file HTML
  const metaTags = `
    <!-- Social Preview Tags (Dynamic) -->
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://raw.githubusercontent.com/namclick/assets/main/vip-gold.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${ogTitle}" />
    <meta name="twitter:description" content="${ogDesc}" />
  `;

  // Chèn meta tags ngay trước thẻ </head>
  const finalHtml = html.replace('</head>', metaTags + '\n</head>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(finalHtml);
}
