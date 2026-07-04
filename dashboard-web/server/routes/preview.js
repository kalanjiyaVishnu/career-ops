import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAREER_OPS_ROOT = path.resolve(__dirname, '../../..');

// GET /api/preview?file=reports/060-razorpay-2026-06-12.md
// Also handles relative paths from data/ dir like ../reports/...
router.get('/', (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: 'file param required' });

  // Normalize: strip leading ../ so callers can pass report_link directly
  // report_link values from applications.md look like ../reports/xxx.md
  const normalized = file.replace(/^\.\.\//, '');
  const abs = path.resolve(CAREER_OPS_ROOT, normalized);

  // Security: must stay within career-ops root
  if (!abs.startsWith(CAREER_OPS_ROOT + path.sep) && abs !== CAREER_OPS_ROOT) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(abs)) {
    return res.status(404).json({ error: `File not found: ${normalized}` });
  }

  const ext = path.extname(abs).toLowerCase();
  if (ext !== '.md') {
    return res.status(400).json({ error: 'Only .md files are supported for preview' });
  }

  const content = fs.readFileSync(abs, 'utf-8');
  res.json({ content, filename: path.basename(abs), path: normalized });
});

// GET /api/preview/uploads/:filename  — preview uploaded JD .md files
router.get('/uploads/:filename', (req, res) => {
  const abs = path.resolve(CAREER_OPS_ROOT, 'dashboard-web/data/uploads', req.params.filename);
  if (!abs.startsWith(path.resolve(CAREER_OPS_ROOT, 'dashboard-web/data/uploads'))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'Not found' });
  if (!abs.endsWith('.md')) return res.status(400).json({ error: 'Only .md files' });
  res.json({ content: fs.readFileSync(abs, 'utf-8'), filename: req.params.filename });
});

export default router;
