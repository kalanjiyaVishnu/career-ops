import express from 'express';
import { db, logActivity } from '../db.js';

export const interviewsRouter = express.Router();
export const contactsRouter = express.Router();
export const emailsRouter = express.Router();
export const followupsRouter = express.Router();

// Interviews
interviewsRouter.put('/:id', (req, res) => {
  const before = db.prepare('SELECT * FROM interviews WHERE id=?').get(req.params.id);
  const { round, scheduled_at, interview_type, interviewers, location, notes, feedback, outcome } = req.body;
  db.prepare(`
    UPDATE interviews SET round=COALESCE(?,round), scheduled_at=COALESCE(?,scheduled_at),
    interview_type=COALESCE(?,interview_type), interviewers=COALESCE(?,interviewers),
    location=COALESCE(?,location), notes=COALESCE(?,notes), feedback=COALESCE(?,feedback),
    outcome=COALESCE(?,outcome) WHERE id=?
  `).run(round, scheduled_at, interview_type, interviewers, location, notes, feedback, outcome, req.params.id);
  const after = db.prepare('SELECT * FROM interviews WHERE id=?').get(req.params.id);
  if (before && after) {
    const label = after.round || after.interview_type || 'Interview';
    if (before.outcome !== after.outcome) {
      logActivity(after.application_id, 'interview_outcome', `Interview outcome: ${label} → ${after.outcome}`);
    } else if (feedback && !before.feedback) {
      logActivity(after.application_id, 'interview_feedback', `Feedback added for: ${label}`);
    } else {
      const FIELDS = { round: 'Round', scheduled_at: 'Scheduled', interview_type: 'Type', interviewers: 'Interviewers', location: 'Location' };
      const changed = Object.keys(FIELDS).filter(f => req.body[f] !== undefined && String(before[f] ?? '') !== String(after[f] ?? ''));
      const detail = changed.length
        ? changed.map(f => `${FIELDS[f]}: ${before[f] || '(empty)'} → ${after[f] || '(empty)'}`).join(' · ')
        : `Interview updated: ${label}`;
      logActivity(after.application_id, 'interview_updated', detail);
    }
  }
  res.json(after);
});

interviewsRouter.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM interviews WHERE id=?').get(req.params.id);
  db.prepare('DELETE FROM interviews WHERE id=?').run(req.params.id);
  if (row) logActivity(row.application_id, 'interview_deleted', `Interview deleted: ${row.round || row.interview_type || 'Interview'}`);
  res.json({ success: true });
});

// Contacts
contactsRouter.put('/:id', (req, res) => {
  const { name, title, email, linkedin, phone, notes } = req.body;
  db.prepare(`
    UPDATE hr_contacts SET name=COALESCE(?,name), title=COALESCE(?,title), email=COALESCE(?,email),
    linkedin=COALESCE(?,linkedin), phone=COALESCE(?,phone), notes=COALESCE(?,notes) WHERE id=?
  `).run(name, title, email, linkedin, phone, notes, req.params.id);
  const row = db.prepare('SELECT * FROM hr_contacts WHERE id=?').get(req.params.id);
  if (row) logActivity(row.application_id, 'contact_updated', `Contact updated: ${row.name || 'Unknown'}`);
  res.json(row);
});

contactsRouter.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM hr_contacts WHERE id=?').get(req.params.id);
  db.prepare('DELETE FROM hr_contacts WHERE id=?').run(req.params.id);
  if (row) logActivity(row.application_id, 'contact_deleted', `Contact removed: ${row.name || 'Unknown'}`);
  res.json({ success: true });
});

// Cold emails
emailsRouter.put('/:id', (req, res) => {
  const before = db.prepare('SELECT * FROM cold_emails WHERE id=?').get(req.params.id);
  const { subject, sent_at, body, status, response, notes } = req.body;
  db.prepare(`
    UPDATE cold_emails SET subject=COALESCE(?,subject), sent_at=COALESCE(?,sent_at),
    body=COALESCE(?,body), status=COALESCE(?,status), response=COALESCE(?,response),
    notes=COALESCE(?,notes) WHERE id=?
  `).run(subject, sent_at, body, status, response, notes, req.params.id);
  const after = db.prepare('SELECT * FROM cold_emails WHERE id=?').get(req.params.id);
  if (before && after) {
    if (before.status !== after.status)
      logActivity(after.application_id, 'email_status', `Email status: "${after.subject || '(no subject)'}" → ${after.status}`);
    else if (response && !before.response)
      logActivity(after.application_id, 'email_response', `Response received for: "${after.subject || '(no subject)'}"`);
    else
      logActivity(after.application_id, 'email_updated', `Email updated: "${after.subject || '(no subject)'}"`);
  }
  res.json(after);
});

emailsRouter.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM cold_emails WHERE id=?').get(req.params.id);
  db.prepare('DELETE FROM cold_emails WHERE id=?').run(req.params.id);
  if (row) logActivity(row.application_id, 'email_deleted', `Email deleted: "${row.subject || '(no subject)'}"`);
  res.json({ success: true });
});

// Followups
followupsRouter.put('/:id', (req, res) => {
  const before = db.prepare('SELECT * FROM followups WHERE id=?').get(req.params.id);
  const { due_date, done, notes } = req.body;
  db.prepare('UPDATE followups SET due_date=COALESCE(?,due_date), done=COALESCE(?,done), notes=COALESCE(?,notes) WHERE id=?').run(due_date, done, notes, req.params.id);
  const after = db.prepare('SELECT * FROM followups WHERE id=?').get(req.params.id);
  if (before && after && before.done !== after.done) {
    const action = after.done ? 'followup_done' : 'followup_undone';
    const desc = after.done ? 'Follow-up marked complete' : 'Follow-up reopened';
    logActivity(after.application_id, action, after.notes ? `${desc}: ${after.notes}` : desc);
  }
  res.json(after);
});

followupsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM followups WHERE id=?').run(req.params.id);
  res.json({ success: true });
});
