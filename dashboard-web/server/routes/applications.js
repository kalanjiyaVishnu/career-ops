import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, logActivity, getActivity } from '../db.js';
import { syncFromMd } from '../parser.js';

const CSV_COLS = ['num','date','company','role','score','status','url','report_link','notes'];

function toCSV(rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = CSV_COLS.join(',');
  const lines = rows.map(r => CSV_COLS.map(c => escape(r[c])).join(','));
  return [header, ...lines].join('\r\n');
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/ /g, '_'));

  function parseLine(line) {
    const vals = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += ch;
    }
    vals.push(cur);
    return vals;
  }

  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
  }).filter(r => r.company && r.role);
}

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../../data/uploads')),
  filename: (req, file, cb) => cb(null, `jd-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

function buildWhereClause(status, search, source) {
  let q = 'SELECT * FROM applications WHERE 1=1';
  const p = [];
  if (status && status !== 'all') {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) { q += ' AND status=?'; p.push(statuses[0]); }
    else if (statuses.length > 1) { q += ` AND status IN (${statuses.map(() => '?').join(',')})`; p.push(...statuses); }
  }
  if (source) { q += ' AND source=?'; p.push(source); }
  if (search) { q += ' AND (company LIKE ? OR role LIKE ? OR notes LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  return { q, p };
}

router.get('/sources', (_, res) => {
  const rows = db.prepare("SELECT DISTINCT source FROM applications WHERE source IS NOT NULL AND source != '' ORDER BY source").all();
  res.json(rows.map(r => r.source));
});

router.get('/', (req, res) => {
  const { status, search, source } = req.query;
  const { q, p } = buildWhereClause(status, search, source);
  res.json(db.prepare(q + ' ORDER BY date DESC, created_at DESC').all(...p));
});

router.get('/export.csv', (req, res) => {
  const { status, search, source } = req.query;
  const { q, p } = buildWhereClause(status, search, source);
  const rows = db.prepare(q + ' ORDER BY date DESC, created_at DESC').all(...p);
  const csv = toCSV(rows);
  const filename = `career-ops-${new Date().toISOString().slice(0,10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv); // BOM for Excel
});

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/import-csv', csvUpload.single('csv'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const text = req.file.buffer.toString('utf-8').replace(/^﻿/, ''); // strip BOM
  const rows = parseCSV(text);
  if (!rows.length) return res.status(400).json({ error: 'No valid rows found. Expected columns: company, role' });

  let imported = 0, updated = 0;
  const upsert = db.transaction(() => {
    for (const r of rows) {
      const existing = db.prepare('SELECT id FROM applications WHERE company=? AND role=?').get(r.company, r.role);
      if (existing) {
        db.prepare(`UPDATE applications SET date=COALESCE(NULLIF(?,?),date), score=COALESCE(NULLIF(?,?),score),
          status=COALESCE(NULLIF(?,?),status), url=COALESCE(NULLIF(?,?),url),
          notes=COALESCE(NULLIF(?,?),notes), updated_at=datetime('now') WHERE id=?`)
          .run(r.date,'',r.date, r.score,'',r.score, r.status,'',r.status,
               r.url,'',r.url, r.notes,'',r.notes, existing.id);
        updated++;
      } else {
        const ins = db.prepare(`INSERT INTO applications (num,date,company,role,score,status,url,notes,report_link,source)
          VALUES (?,?,?,?,?,?,?,?,?,?)`)
          .run(r.num||'', r.date||new Date().toISOString().split('T')[0], r.company, r.role,
               r.score||'', r.status||'Evaluated', r.url||'', r.notes||'', r.report_link||'', 'csv');
        logActivity(ins.lastInsertRowid, 'app_imported', `Imported from CSV: ${r.company} — ${r.role}`);
        imported++;
      }
    }
  });
  upsert();
  res.json({ imported, updated, total: rows.length });
});

router.post('/import', (req, res) => {
  try {
    const result = syncFromMd(db);
    // log imported/updated entries
    const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC LIMIT ?').all(result.imported + result.updated);
    for (const a of apps) {
      const hasLog = db.prepare("SELECT 1 FROM activity_log WHERE application_id=? AND action='app_imported'").get(a.id);
      if (!hasLog) logActivity(a.id, 'app_imported', 'Imported from applications.md');
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { company, role, date, status, score, url, notes, num, source } = req.body;
  if (!company || !role) return res.status(400).json({ error: 'company and role required' });
  const r = db.prepare(`
    INSERT INTO applications (num, date, company, role, score, status, url, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(num || '', date || new Date().toISOString().split('T')[0], company, role, score || '', status || 'Evaluated', url || '', notes || '', source || '');
  const app = db.prepare('SELECT * FROM applications WHERE id=?').get(r.lastInsertRowid);
  logActivity(app.id, 'app_created', `Application created for ${company} — ${role}`);
  res.json(app);
});

router.get('/:id', (req, res) => {
  const a = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json(a);
});

router.put('/:id', (req, res) => {
  const before = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);
  const fields = ['company','role','date','status','score','url','notes','num','report_link','jd_file'];
  const sets = fields.map(f => `${f}=COALESCE(?,${f})`).join(',');
  const vals = fields.map(f => req.body[f] ?? null);
  db.prepare(`UPDATE applications SET ${sets}, updated_at=datetime('now') WHERE id=?`).run(...vals, req.params.id);
  const after = db.prepare('SELECT * FROM applications WHERE id=?').get(req.params.id);

  if (before && after) {
    const FIELD_LABELS = { company: 'Company', role: 'Role', date: 'Date', status: 'Status', score: 'Score', url: 'URL', notes: 'Notes', report_link: 'Report Link' };
    const changed = Object.keys(FIELD_LABELS).filter(f => req.body[f] !== undefined && String(before[f] ?? '') !== String(after[f] ?? ''));

    if (changed.includes('status'))
      logActivity(after.id, 'status_changed', `Status changed: ${before.status} → ${after.status}`);

    const otherChanged = changed.filter(f => f !== 'status');
    if (otherChanged.length > 0) {
      const action = otherChanged.length === 1 && otherChanged[0] === 'notes' ? 'notes_updated'
                   : otherChanged.length === 1 && otherChanged[0] === 'score' ? 'score_updated'
                   : 'details_updated';
      const lines = otherChanged.map(f => {
        const prev = before[f] ? `${before[f]}` : '(empty)';
        const next = after[f] ? `${after[f]}` : '(empty)';
        if (f === 'notes') return `Notes updated`;
        return `${FIELD_LABELS[f]}: ${prev} → ${next}`;
      });
      logActivity(after.id, action, lines.join(' · '));
    }
  }

  res.json(after);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM applications WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/jd', upload.single('jd'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  db.prepare('UPDATE applications SET jd_file=? WHERE id=?').run(req.file.filename, req.params.id);
  logActivity(req.params.id, 'jd_uploaded', `JD file uploaded: ${req.file.originalname}`);
  res.json({ filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

router.get('/:id/interviews', (req, res) => {
  res.json(db.prepare('SELECT * FROM interviews WHERE application_id=? ORDER BY scheduled_at ASC').all(req.params.id));
});

router.post('/:id/interviews', (req, res) => {
  const { round, scheduled_at, interview_type, interviewers, location, notes } = req.body;
  const r = db.prepare(`
    INSERT INTO interviews (application_id, round, scheduled_at, interview_type, interviewers, location, notes)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.params.id, round, scheduled_at, interview_type || 'video', interviewers, location, notes);
  const label = [round, interview_type].filter(Boolean).join(' · ');
  const when = scheduled_at ? ` on ${scheduled_at.slice(0, 16).replace('T', ' ')}` : '';
  logActivity(req.params.id, 'interview_scheduled', `Interview scheduled: ${label}${when}`);
  res.json(db.prepare('SELECT * FROM interviews WHERE id=?').get(r.lastInsertRowid));
});

router.get('/:id/contacts', (req, res) => {
  res.json(db.prepare('SELECT * FROM hr_contacts WHERE application_id=? ORDER BY created_at DESC').all(req.params.id));
});

router.post('/:id/contacts', (req, res) => {
  const { name, title, email, linkedin, phone, notes } = req.body;
  const r = db.prepare(`
    INSERT INTO hr_contacts (application_id, name, title, email, linkedin, phone, notes)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.params.id, name, title, email, linkedin, phone, notes);
  const who = [name, title].filter(Boolean).join(', ');
  logActivity(req.params.id, 'contact_added', `HR contact added: ${who || 'Unknown'}`);
  res.json(db.prepare('SELECT * FROM hr_contacts WHERE id=?').get(r.lastInsertRowid));
});

router.get('/:id/emails', (req, res) => {
  const emails = db.prepare('SELECT * FROM cold_emails WHERE application_id=? ORDER BY sent_at DESC').all(req.params.id);
  const ids = emails.map(e => e.id);
  const followups = ids.length
    ? db.prepare(`SELECT * FROM followups WHERE cold_email_id IN (${ids.map(() => '?').join(',')}) ORDER BY due_date`).all(...ids)
    : [];
  res.json(emails.map(e => ({ ...e, followups: followups.filter(f => f.cold_email_id === e.id) })));
});

router.post('/:id/emails', (req, res) => {
  const { subject, sent_at, body, status, response, notes } = req.body;
  const r = db.prepare(`
    INSERT INTO cold_emails (application_id, subject, sent_at, body, status, response, notes)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.params.id, subject, sent_at || new Date().toISOString(), body, status || 'sent', response, notes);
  logActivity(req.params.id, 'email_logged', `Cold email logged: "${subject || '(no subject)'}"`);
  res.json(db.prepare('SELECT * FROM cold_emails WHERE id=?').get(r.lastInsertRowid));
});

router.get('/:id/followups', (req, res) => {
  res.json(db.prepare('SELECT * FROM followups WHERE application_id=? ORDER BY due_date').all(req.params.id));
});

router.post('/:id/followups', (req, res) => {
  const { due_date, notes, cold_email_id } = req.body;
  const r = db.prepare('INSERT INTO followups (application_id, cold_email_id, due_date, notes) VALUES (?,?,?,?)').run(req.params.id, cold_email_id || null, due_date, notes);
  logActivity(req.params.id, 'followup_added', `Follow-up scheduled${due_date ? ' for ' + due_date : ''}${notes ? ': ' + notes : ''}`);
  res.json(db.prepare('SELECT * FROM followups WHERE id=?').get(r.lastInsertRowid));
});

router.get('/:id/activity', (req, res) => {
  res.json(getActivity(req.params.id));
});

export default router;
