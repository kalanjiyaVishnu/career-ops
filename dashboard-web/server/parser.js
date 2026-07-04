import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APPS_MD = path.join(__dirname, '../../data/applications.md');

export function parseApplicationsMd() {
  if (!fs.existsSync(APPS_MD)) return [];

  const content = fs.readFileSync(APPS_MD, 'utf-8');
  const lines = content.split('\n');
  const results = [];
  let headerSeen = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    if (/^\|[\s\-|]+\|$/.test(trimmed)) { headerSeen = true; continue; }
    if (!headerSeen) continue;

    const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 5) continue;

    const [num, date, company, role, score, status, pdf, report, ...rest] = cells;
    if (!company || company === 'Company') continue;

    const notes = rest.join(' | ').trim();
    const reportText = report || '';
    const reportLink = reportText.replace(/^\[.*?\]\((.*?)\)$/, '$1');

    results.push({
      num: num || '',
      date: date || new Date().toISOString().split('T')[0],
      company,
      role,
      score: score || '',
      status: status || 'Evaluated',
      pdf_generated: pdf === '✅' ? 1 : 0,
      report_link: reportLink || reportText,
      notes,
    });
  }

  return results;
}

export function syncFromMd(db) {
  const apps = parseApplicationsMd();
  if (!apps.length) return { imported: 0, updated: 0 };

  const find = db.prepare('SELECT id FROM applications WHERE company = ? AND role = ? LIMIT 1');
  const insert = db.prepare(`
    INSERT INTO applications (num, date, company, role, score, status, pdf_generated, report_link, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const update = db.prepare(`
    UPDATE applications SET status=?, score=?, notes=?, updated_at=datetime('now') WHERE id=?
  `);

  let imported = 0, updated = 0;
  const run = db.transaction(() => {
    for (const a of apps) {
      const existing = find.get(a.company, a.role);
      if (existing) { update.run(a.status, a.score, a.notes, existing.id); updated++; }
      else { insert.run(a.num, a.date, a.company, a.role, a.score, a.status, a.pdf_generated, a.report_link, a.notes, 'applications.md'); imported++; }
    }
  });
  run();

  return { imported, updated, total: apps.length };
}
