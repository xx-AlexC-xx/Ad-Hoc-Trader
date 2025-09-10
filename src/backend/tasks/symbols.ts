// src/backend/task/symbols.ts
import express, { Request, Response } from "npm:express";
import { runUpdateSymbols } from "../tasks/updateSymbols.ts";

const router = express.Router();

router.post("/run-symbol-update", async (_req: Request, res: Response) => {
  try {
    const result = await runUpdateSymbols();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
