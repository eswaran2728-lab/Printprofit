import { store } from '../utils/store.js';

export function requireAuth(req, res, next) {
  const { tokens } = store.getAuth();
  if (!tokens || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
