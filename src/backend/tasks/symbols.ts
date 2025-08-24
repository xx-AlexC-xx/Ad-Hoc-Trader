// src/backend/routes/symbols.ts
import express from 'express';
import { runUpdateSymbols } from '../tasks/updateSymbols';

const router = express.Router();

router.post('/run-symbol-update', async (req, res) => {
  try {
    const result = await runUpdateSymbols();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
