import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'dashboard.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    num TEXT,
    date TEXT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    score TEXT,
    status TEXT DEFAULT 'Evaluated',
    pdf_generated INTEGER DEFAULT 0,
    report_link TEXT,
    url TEXT,
    jd_file TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round TEXT,
    scheduled_at TEXT,
    interview_type TEXT DEFAULT 'video',
    interviewers TEXT,
    location TEXT,
    notes TEXT,
    feedback TEXT,
    outcome TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hr_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    name TEXT,
    title TEXT,
    email TEXT,
    linkedin TEXT,
    phone TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cold_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    subject TEXT,
    sent_at TEXT,
    body TEXT,
    status TEXT DEFAULT 'sent',
    response TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    cold_email_id INTEGER REFERENCES cold_emails(id) ON DELETE SET NULL,
    due_date TEXT,
    done INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migration: add source column if not present (safe on existing DBs)
try { db.exec("ALTER TABLE applications ADD COLUMN source TEXT DEFAULT ''"); } catch {}

export function logActivity(appId, action, detail) {
  db.prepare('INSERT INTO activity_log (application_id, action, detail) VALUES (?,?,?)').run(appId, action, detail);
}

export function getActivity(appId) {
  return db.prepare('SELECT * FROM activity_log WHERE application_id=? ORDER BY created_at DESC').all(appId);
}

export function getStats() {
  const total = db.prepare('SELECT COUNT(*) as c FROM applications').get().c;
  const byStatus = db.prepare('SELECT status, COUNT(*) as c FROM applications GROUP BY status ORDER BY c DESC').all();
  const thisMonth = db.prepare("SELECT COUNT(*) as c FROM applications WHERE date >= date('now', 'start of month')").get().c;
  const inProgress = db.prepare("SELECT COUNT(*) as c FROM applications WHERE status IN ('Applied','Responded','Interview')").get().c;
  const offers = db.prepare("SELECT COUNT(*) as c FROM applications WHERE status = 'Offer'").get().c;
  const upcomingInterviews = db.prepare(`
    SELECT i.*, a.company, a.role FROM interviews i
    JOIN applications a ON i.application_id = a.id
    WHERE i.scheduled_at >= datetime('now') AND i.outcome = 'pending'
    ORDER BY i.scheduled_at ASC LIMIT 5
  `).all();
  const recentApplications = db.prepare('SELECT * FROM applications ORDER BY date DESC, created_at DESC LIMIT 10').all();
  const weeklyStats = db.prepare(`
    SELECT strftime('%Y-W%W', date) as week, COUNT(*) as count
    FROM applications WHERE date >= date('now', '-8 weeks')
    GROUP BY week ORDER BY week
  `).all();

  return { total, byStatus, thisMonth, inProgress, offers, upcomingInterviews, recentApplications, weeklyStats };
}
