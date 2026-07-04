import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, getStats } from './db.js';
import applicationsRouter from './routes/applications.js';
import { interviewsRouter, contactsRouter, emailsRouter, followupsRouter } from './routes/resources.js';
import chatRouter from './routes/chat.js';
import previewRouter from './routes/preview.js';
import pipelineRouter from './routes/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

app.use('/api/applications', applicationsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/preview', previewRouter);
app.use('/api/pipeline', pipelineRouter);

app.get('/api/stats', (_, res) => {
  try { res.json(getStats()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/interviews/all', (_, res) => {
  const interviews = db.prepare(`
    SELECT i.*, a.company, a.role, a.id as application_id
    FROM interviews i JOIN applications a ON i.application_id = a.id
    ORDER BY i.scheduled_at DESC
  `).all();
  res.json(interviews);
});

if (isProd) {
  const distDir = path.join(__dirname, '../dist');
  app.use(express.static(distDir));
  app.get('*', (_, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n🚀 Career Ops Dashboard`);
  console.log(`   Local:  http://localhost:${PORT}`);
  if (!isProd) console.log(`   API:    http://localhost:${PORT}/api`);
  console.log(`   Mode:   ${isProd ? 'production' : 'development'}\n`);
});
