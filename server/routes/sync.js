import { Router } from 'express';
import { getSyncStatus } from '../services/syncQueue.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json(getSyncStatus());
});

export default router;
