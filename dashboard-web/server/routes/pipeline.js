import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../data');

function parseLine(line) {
  // Format A (numbered):   - [x] #062 | https://... | Company | Role | 3.6/5 | PDF ❌
  // Format B (unnumbered): - [ ] https://... | Company | Role
  // Format C (bare URL):   https://example.com
  const checkMatch = line.match(/^-\s+\[([ xX])\]\s+(.+)/);
  if (checkMatch) {
    const [, check, rest] = checkMatch;
    const done = check.toLowerCase() === 'x';
    const parts = rest.split(/\s*\|\s*/);

    let num = '', url = '', company = '', role = '', score = '', pdf = false;

    if (parts[0].startsWith('#')) {
      // Format A: #num | url | company | role | score | pdf
      num     = parts[0].replace(/^#/, '');
      url     = (parts[1] || '').trim();
      company = (parts[2] || '').trim();
      role    = (parts[3] || '').trim();
      score   = (parts[4] || '').trim();
      pdf     = (parts[5] || '').includes('✅');
    } else if (/^https?:\/\//.test(parts[0])) {
      // Format B: url | company | role  (no number)
      url     = parts[0].trim();
      company = (parts[1] || '').trim();
      role    = (parts[2] || '').trim();
      score   = (parts[3] || '').trim();
      pdf     = (parts[4] || '').includes('✅');
    }

    if (url) return { done, num, url, company, role, score, pdf, raw: line };
  }

  // Format C: bare URL line (no checkbox)
  const urlMatch = line.match(/^\s*(https?:\/\/\S+)/);
  if (urlMatch) {
    return { done: false, num: '', url: urlMatch[1], company: '', role: '', score: '', pdf: false, raw: line };
  }

  return null;
}

function parsePipelineFile(filepath) {
  if (!fs.existsSync(filepath)) return [];
  const content = fs.readFileSync(filepath, 'utf-8');
  const items = [];
  for (const line of content.split('\n')) {
    const item = parseLine(line.trim());
    if (item && item.url) items.push(item);
  }
  return items;
}

// GET /api/pipeline/files — list all pipeline .md files in data/
router.get('/files', (_, res) => {
  if (!fs.existsSync(DATA_DIR)) return res.json([]);
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/pipeline.*\.md$/i))
    .sort();
  res.json(files);
});

// GET /api/pipeline?file=pipeline.md
router.get('/', (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: 'file param required' });

  // Only allow files within the data dir
  const abs = path.resolve(DATA_DIR, path.basename(file));
  if (!abs.startsWith(DATA_DIR + path.sep) && abs !== DATA_DIR) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const items = parsePipelineFile(abs);
  const pending = items.filter(i => !i.done);
  const processed = items.filter(i => i.done);

  res.json({ file, total: items.length, pending: pending.length, items, pendingItems: pending, processedItems: processed });
});

// POST /api/pipeline/add — add a pipeline item to the applications tracker
router.post('/add', (req, res) => {
  const { url, company, role, score, num } = req.body;
  if (!url && !company) return res.status(400).json({ error: 'url or company required' });

  const existing = company && role
    ? db.prepare('SELECT id FROM applications WHERE company=? AND role=? LIMIT 1').get(company, role)
    : null;

  if (existing) {
    return res.json({ id: existing.id, created: false, message: `Already exists (ID ${existing.id})` });
  }

  const today = new Date().toISOString().split('T')[0];
  const source = req.body.source || '';
  const r = db.prepare(`
    INSERT INTO applications (num, date, company, role, score, status, url, notes, source)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(num || '', today, company || '', role || '', score || '', 'Evaluated', url || '', '', source);

  res.json({ id: r.lastInsertRowid, created: true });
});

export default router;
