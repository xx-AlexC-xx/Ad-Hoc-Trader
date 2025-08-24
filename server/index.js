import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// 🧠 GET /api/alpaca/account → fetch live account info
app.get('/api/alpaca/account', async (req, res) => {
  try {
    const url = `${process.env.ALPACA_BASE_URL}/v2/account`;

    const response = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });

    // 🔐 Handle non-200 responses (like 404/401/etc)
    if (!response.ok) {
      const text = await response.text();
      console.error('Alpaca API Error:', response.status, text);
      return res.status(response.status).json({ error: text });
    }

    // ✅ Only parse JSON if response is valid
    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Server Error Fetching Alpaca Data:', err);
    res.status(500).json({ error: 'Failed to fetch Alpaca data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Alpaca backend running at http://localhost:${PORT}`);
});
