import express from 'express';
import { db, getStats } from '../db.js';
import { syncFromMd } from '../parser.js';

const router = express.Router();

const STATUSES = ['Evaluated','Applied','Responded','Interview','Offer','Rejected','Discarded','SKIP'];

function findApp(query) {
  return db.prepare('SELECT * FROM applications WHERE company LIKE ? OR role LIKE ? ORDER BY date DESC LIMIT 5').all(`%${query}%`, `%${query}%`);
}

function processMessage(input) {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  if (/^(help|\?)/.test(lower)) {
    return {
      type: 'help',
      text: `**Available commands:**\n\n` +
        `• \`add [company] - [role]\` — add a new application\n` +
        `• \`update [company] to [status]\` — change status\n` +
        `• \`list [status]\` — list applications by status\n` +
        `• \`search [query]\` — search applications\n` +
        `• \`stats\` — show your statistics\n` +
        `• \`upcoming\` — upcoming interviews\n` +
        `• \`import\` — sync from applications.md\n` +
        `• \`help\` — show this message\n\n` +
        `**Statuses:** ${STATUSES.join(', ')}`,
    };
  }

  if (/^(stats?|summary|overview)/.test(lower)) {
    const s = getStats();
    const breakdown = s.byStatus.map(b => `  • ${b.status}: ${b.c}`).join('\n');
    return {
      type: 'stats',
      text: `**Your job search stats:**\n\n📊 Total: **${s.total}**\n📅 This month: **${s.thisMonth}**\n🔄 In progress: **${s.inProgress}**\n🎉 Offers: **${s.offers}**\n\n**By status:**\n${breakdown}`,
    };
  }

  if (/^(import|sync)/.test(lower)) {
    try {
      const r = syncFromMd(db);
      return { type: 'import', text: `✅ Synced from applications.md\n\n• Imported: **${r.imported}** new\n• Updated: **${r.updated}** existing\n• Total: **${r.total}**` };
    } catch (e) {
      return { type: 'error', text: `❌ Import failed: ${e.message}` };
    }
  }

  if (/^(upcoming|next interview)/.test(lower)) {
    const upcoming = db.prepare(`
      SELECT i.*, a.company, a.role FROM interviews i
      JOIN applications a ON i.application_id = a.id
      WHERE i.scheduled_at >= datetime('now') AND i.outcome = 'pending'
      ORDER BY i.scheduled_at ASC LIMIT 5
    `).all();
    if (!upcoming.length) return { type: 'info', text: '📅 No upcoming interviews scheduled.' };
    const list = upcoming.map(i => `• **${i.company}** (${i.role}) — ${i.round || i.interview_type} @ ${i.scheduled_at}`).join('\n');
    return { type: 'interviews', text: `**Upcoming interviews:**\n\n${list}` };
  }

  const addMatch = raw.match(/^(?:add|new|create)\s+(.+?)\s*[-–]\s*(.+)/i);
  if (addMatch) {
    const [, company, role] = addMatch;
    const today = new Date().toISOString().split('T')[0];
    const r = db.prepare('INSERT INTO applications (company, role, date, status) VALUES (?,?,?,?)').run(company.trim(), role.trim(), today, 'Evaluated');
    const app = db.prepare('SELECT * FROM applications WHERE id=?').get(r.lastInsertRowid);
    return { type: 'created', text: `✅ Added **${app.company}** — ${app.role}\n\n_ID: ${app.id} | Status: ${app.status} | Date: ${app.date}_`, data: { id: app.id } };
  }

  const updateMatch = raw.match(/^(?:update|set|change)\s+(.+?)\s+(?:to|status\s+to)\s+(.+)/i);
  if (updateMatch) {
    const [, query, targetStatus] = updateMatch;
    const status = STATUSES.find(s => s.toLowerCase() === targetStatus.trim().toLowerCase());
    if (!status) return { type: 'error', text: `❌ Unknown status: **${targetStatus.trim()}**\n\nValid statuses: ${STATUSES.join(', ')}` };
    const apps = findApp(query.trim());
    if (!apps.length) return { type: 'error', text: `❌ No applications found matching "**${query.trim()}**"` };
    if (apps.length === 1) {
      db.prepare("UPDATE applications SET status=?, updated_at=datetime('now') WHERE id=?").run(status, apps[0].id);
      return { type: 'updated', text: `✅ Updated **${apps[0].company}** → **${status}**`, data: { id: apps[0].id } };
    }
    const list = apps.map((a, i) => `${i + 1}. ${a.company} — ${a.role}`).join('\n');
    return { type: 'ambiguous', text: `Found multiple matches. Which one?\n\n${list}\n\nTry: \`update [more specific name] to ${status}\`` };
  }

  const listMatch = raw.match(/^(?:list|show)\s+(.+?)(?:\s+applications?)?$/i);
  if (listMatch) {
    const query = listMatch[1].trim();
    const status = STATUSES.find(s => s.toLowerCase() === query.toLowerCase());
    if (status) {
      const apps = db.prepare('SELECT * FROM applications WHERE status=? ORDER BY date DESC LIMIT 10').all(status);
      if (!apps.length) return { type: 'list', text: `No applications with status **${status}**` };
      const list = apps.map(a => `• **${a.company}** — ${a.role} (${a.score || 'no score'})`).join('\n');
      return { type: 'list', text: `**${status}** applications (${apps.length}):\n\n${list}` };
    }
  }

  const searchMatch = raw.match(/^(?:search|find)\s+(.+)/i);
  if (searchMatch) {
    const q = searchMatch[1].trim();
    const apps = findApp(q);
    if (!apps.length) return { type: 'search', text: `No results for "**${q}**"` };
    const list = apps.map(a => `• **${a.company}** — ${a.role} | ${a.status} (${a.score || '?'})`).join('\n');
    return { type: 'search', text: `Found **${apps.length}** result(s) for "${q}":\n\n${list}` };
  }

  return {
    type: 'unknown',
    text: `I didn't understand that. Try \`help\` to see available commands.\n\n**Quick examples:**\n• \`add Google - Software Engineer\`\n• \`update Razorpay to Applied\`\n• \`list Interview\`\n• \`stats\``,
  };
}

router.post('/', (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });
  try {
    res.json(processMessage(message));
  } catch (err) {
    res.status(500).json({ type: 'error', text: `Error: ${err.message}` });
  }
});

export default router;
