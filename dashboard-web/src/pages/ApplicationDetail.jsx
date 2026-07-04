import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi, interviewApi, contactApi, emailApi, followupApi } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { PreviewButton } from '../components/MarkdownPreview.jsx';
import { STATUSES, INTERVIEW_TYPES, INTERVIEW_OUTCOMES, EMAIL_STATUSES, fmtDate, fmtDateTime, scoreColor, timeAgo } from '../utils/index.js';
import {
  ArrowLeft, Edit3, Trash2, Plus, ExternalLink, Calendar, User2, Mail, Phone, Linkedin,
  FileText, Upload, Download, Check, X, MessageSquare, Clock, ChevronDown, CheckCircle2,
  GitCommit, Star, Paperclip, UserPlus, UserMinus, UserCheck, MailPlus, MailCheck,
  MailX, CheckSquare, RotateCcw, Activity, Info,
} from 'lucide-react';

const TABS = ['Overview','Interviews','HR Contacts','Cold Emails','Documents','History'];

const ACTION_META = {
  app_created:        { icon: Plus,         color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20' },
  app_imported:       { icon: Download,      color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
  status_changed:     { icon: GitCommit,     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  notes_updated:      { icon: FileText,      color: 'text-slate-400',   bg: 'bg-slate-700/60 border-slate-600/30' },
  score_updated:      { icon: Star,          color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  details_updated:    { icon: Edit3,         color: 'text-slate-400',   bg: 'bg-slate-700/60 border-slate-600/30' },
  jd_uploaded:        { icon: Paperclip,     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  interview_scheduled:{ icon: Calendar,      color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
  interview_updated:  { icon: Edit3,         color: 'text-slate-400',   bg: 'bg-slate-700/60 border-slate-600/30' },
  interview_feedback: { icon: MessageSquare, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  interview_outcome:  { icon: CheckCircle2,  color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
  interview_deleted:  { icon: Trash2,        color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  contact_added:      { icon: UserPlus,      color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20' },
  contact_updated:    { icon: UserCheck,     color: 'text-slate-400',   bg: 'bg-slate-700/60 border-slate-600/30' },
  contact_deleted:    { icon: UserMinus,     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  email_logged:       { icon: MailPlus,      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  email_status:       { icon: MailCheck,     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  email_response:     { icon: MailCheck,     color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
  email_updated:      { icon: Edit3,         color: 'text-slate-400',   bg: 'bg-slate-700/60 border-slate-600/30' },
  email_deleted:      { icon: MailX,         color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  followup_added:     { icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  followup_done:      { icon: CheckSquare,   color: 'text-green-400',   bg: 'bg-green-500/10 border-green-500/20' },
  followup_undone:    { icon: RotateCcw,     color: 'text-slate-400',   bg: 'bg-slate-700/60 border-slate-600/30' },
};

function ActivityTimeline({ entries }) {
  if (!entries.length) {
    return (
      <div className="card p-10 text-center">
        <Activity size={32} className="mx-auto text-slate-700 mb-3" />
        <p className="text-slate-500 text-sm">No activity recorded yet</p>
        <p className="text-slate-700 text-xs mt-1">Actions like status changes, interviews, and emails will appear here</p>
      </div>
    );
  }

  // Group by date
  const groups = entries.reduce((acc, e) => {
    const day = (e.created_at || '').slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([day, items]) => (
        <div key={day}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 shrink-0">{fmtDate(day)}</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-800" />
            <div className="space-y-1">
              {items.map((entry) => {
                const meta = ACTION_META[entry.action] || { icon: Info, color: 'text-slate-400', bg: 'bg-slate-700/60 border-slate-600/30' };
                const Icon = meta.icon;
                const time = entry.created_at ? entry.created_at.slice(11, 16) : '';
                return (
                  <div key={entry.id} className="flex items-start gap-3 pl-1 py-1 group">
                    {/* Dot with icon */}
                    <div className={`relative z-10 w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <Icon size={13} className={meta.color} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-sm text-slate-300 leading-snug">{entry.detail}</p>
                    </div>
                    {/* Time */}
                    <span className="text-[11px] text-slate-600 shrink-0 pt-1 tabular-nums">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, mono }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{label}</p>
      <p className={`text-sm text-slate-300 break-words ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}

function InterviewCard({ interview, onEdit, onDelete }) {
  const outcomeColors = { pending: 'text-amber-400', passed: 'text-green-400', failed: 'text-red-400', cancelled: 'text-slate-500' };
  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{interview.round || interview.interview_type}</p>
          <p className="text-xs text-slate-500 capitalize">{interview.interview_type}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(interview)} className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10"><Edit3 size={13} /></button>
          <button onClick={() => onDelete(interview.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
        </div>
      </div>
      {interview.scheduled_at && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {fmtDateTime(interview.scheduled_at)}</p>}
      {interview.interviewers && <p className="text-xs text-slate-400 flex items-center gap-1.5"><User2 size={12} /> {interview.interviewers}</p>}
      {interview.location && <p className="text-xs text-slate-400 flex items-center gap-1.5"><MessageSquare size={12} /> {interview.location}</p>}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold capitalize ${outcomeColors[interview.outcome] || 'text-slate-400'}`}>
          {interview.outcome}
        </span>
      </div>
      {interview.notes && <p className="text-xs text-slate-500 bg-slate-800 rounded-lg px-3 py-2 mt-2">{interview.notes}</p>}
      {interview.feedback && (
        <div className="bg-slate-700/30 rounded-lg px-3 py-2 mt-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Feedback</p>
          <p className="text-xs text-slate-300">{interview.feedback}</p>
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div>
          <p className="text-sm font-semibold text-slate-200">{contact.name || 'Unknown'}</p>
          {contact.title && <p className="text-xs text-slate-500">{contact.title}</p>}
        </div>
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
            <Mail size={11} /> {contact.email}
          </a>
        )}
        {contact.linkedin && (
          <a href={contact.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
            <Linkedin size={11} /> LinkedIn
          </a>
        )}
        {contact.phone && <p className="flex items-center gap-1.5 text-xs text-slate-400"><Phone size={11} /> {contact.phone}</p>}
        {contact.notes && <p className="text-xs text-slate-500 mt-1">{contact.notes}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(contact)} className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10"><Edit3 size={13} /></button>
        <button onClick={() => onDelete(contact.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function EmailCard({ email, onEdit, onDelete, onToggleFollowup, appId, qc }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = { sent: 'text-blue-400', opened: 'text-violet-400', replied: 'text-green-400', bounced: 'text-red-400', 'no-response': 'text-slate-500' };

  const addFollowup = useMutation({
    mutationFn: (data) => applicationApi.addFollowup(appId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emails', appId] }),
  });

  const toggleFollowup = useMutation({
    mutationFn: ({ id, done }) => followupApi.update(id, { done: done ? 1 : 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emails', appId] }),
  });

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{email.subject || '(no subject)'}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[11px] font-medium capitalize ${statusColors[email.status] || 'text-slate-400'}`}>{email.status}</span>
              <span className="text-[11px] text-slate-600">{fmtDate(email.sent_at)}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-700/50">
              <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => onEdit(email)} className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10"><Edit3 size={13} /></button>
            <button onClick={() => onDelete(email.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
          </div>
        </div>

        {/* Follow-ups */}
        {(email.followups || []).length > 0 && (
          <div className="space-y-1 mt-2">
            {email.followups.map(f => (
              <div key={f.id} className="flex items-center gap-2 text-xs">
                <button onClick={() => toggleFollowup.mutate({ id: f.id, done: !f.done })} className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${f.done ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-slate-600 text-slate-600 hover:border-slate-400'}`}>
                  {f.done && <Check size={10} />}
                </button>
                <span className={f.done ? 'text-slate-600 line-through' : 'text-slate-400'}>{f.notes || 'Follow up'}</span>
                <span className="text-slate-600 ml-auto">{fmtDate(f.due_date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-700/40 p-4 space-y-3">
          {email.body && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase mb-1">Email Body</p>
              <p className="text-xs text-slate-400 whitespace-pre-wrap">{email.body}</p>
            </div>
          )}
          {email.response && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase mb-1">Response</p>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{email.response}</p>
            </div>
          )}
          {email.notes && <p className="text-xs text-slate-500">{email.notes}</p>}
          <button
            onClick={() => addFollowup.mutate({ cold_email_id: email.id, due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], notes: 'Follow up' })}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={12} /> Add Follow-up
          </button>
        </div>
      )}
    </div>
  );
}

function InterviewForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    round: initial.round || '',
    scheduled_at: initial.scheduled_at ? initial.scheduled_at.slice(0, 16) : '',
    interview_type: initial.interview_type || 'video',
    interviewers: initial.interviewers || '',
    location: initial.location || '',
    notes: initial.notes || '',
    feedback: initial.feedback || '',
    outcome: initial.outcome || 'pending',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group"><label className="label">Round / Name</label><input className="input" value={form.round} onChange={set('round')} placeholder="e.g. Technical Round 1" /></div>
        <div className="form-group"><label className="label">Type</label>
          <select className="input" value={form.interview_type} onChange={set('interview_type')}>
            {INTERVIEW_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-2 form-group"><label className="label">Scheduled At</label><input type="datetime-local" className="input" value={form.scheduled_at} onChange={set('scheduled_at')} /></div>
        <div className="col-span-2 form-group"><label className="label">Interviewers</label><input className="input" value={form.interviewers} onChange={set('interviewers')} placeholder="Names or titles" /></div>
        <div className="form-group"><label className="label">Location / Link</label><input className="input" value={form.location} onChange={set('location')} placeholder="Zoom / Google Meet / Office" /></div>
        <div className="form-group"><label className="label">Outcome</label>
          <select className="input" value={form.outcome} onChange={set('outcome')}>
            {INTERVIEW_OUTCOMES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="col-span-2 form-group"><label className="label">Notes (before)</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Preparation notes..." /></div>
        <div className="col-span-2 form-group"><label className="label">Feedback (after)</label><textarea className="input resize-none" rows={2} value={form.feedback} onChange={set('feedback')} placeholder="How it went, questions asked..." /></div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">{loading ? 'Saving…' : 'Save Interview'}</button>
    </form>
  );
}

function ContactForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({ name: initial.name || '', title: initial.title || '', email: initial.email || '', linkedin: initial.linkedin || '', phone: initial.phone || '', notes: initial.notes || '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 form-group"><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} placeholder="Full name" /></div>
        <div className="col-span-2 form-group"><label className="label">Title</label><input className="input" value={form.title} onChange={set('title')} placeholder="e.g. HR Manager, Recruiter" /></div>
        <div className="col-span-2 form-group"><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={set('email')} /></div>
        <div className="col-span-2 form-group"><label className="label">LinkedIn URL</label><input className="input" value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/..." /></div>
        <div className="form-group"><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        <div className="col-span-2 form-group"><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">{loading ? 'Saving…' : 'Save Contact'}</button>
    </form>
  );
}

function EmailForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({ subject: initial.subject || '', sent_at: initial.sent_at ? initial.sent_at.slice(0, 10) : new Date().toISOString().split('T')[0], body: initial.body || '', status: initial.status || 'sent', response: initial.response || '', notes: initial.notes || '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 form-group"><label className="label">Subject</label><input className="input" value={form.subject} onChange={set('subject')} placeholder="Email subject" /></div>
        <div className="form-group"><label className="label">Date Sent</label><input type="date" className="input" value={form.sent_at} onChange={set('sent_at')} /></div>
        <div className="form-group"><label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {EMAIL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2 form-group"><label className="label">Email Body</label><textarea className="input resize-none" rows={4} value={form.body} onChange={set('body')} placeholder="Paste your email here..." /></div>
        <div className="col-span-2 form-group"><label className="label">Response Received</label><textarea className="input resize-none" rows={3} value={form.response} onChange={set('response')} placeholder="Their response..." /></div>
        <div className="col-span-2 form-group"><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">{loading ? 'Saving…' : 'Save Email'}</button>
    </form>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [editOpen, setEditOpen] = useState(false);
  const [interviewModal, setInterviewModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const fileRef = useRef();

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.get(id).then(r => r.data),
  });
  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews', id],
    queryFn: () => applicationApi.getInterviews(id).then(r => r.data),
    enabled: tab === 'Interviews',
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => applicationApi.getContacts(id).then(r => r.data),
    enabled: tab === 'HR Contacts',
  });
  const { data: emails = [] } = useQuery({
    queryKey: ['emails', id],
    queryFn: () => applicationApi.getEmails(id).then(r => r.data),
    enabled: tab === 'Cold Emails',
  });
  const { data: activity = [] } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => applicationApi.getActivity(id).then(r => r.data),
    enabled: tab === 'History',
    refetchOnWindowFocus: false,
  });

  const invalidateActivity = () => qc.invalidateQueries({ queryKey: ['activity', id] });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['application', id] });
    qc.invalidateQueries({ queryKey: ['applications'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    invalidateActivity();
  };

  const updateMut = useMutation({ mutationFn: (d) => applicationApi.update(id, d), onSuccess: invalidate });
  const deleteMut = useMutation({ mutationFn: () => applicationApi.remove(id), onSuccess: () => navigate('/applications') });

  const addInterviewMut = useMutation({
    mutationFn: (d) => applicationApi.addInterview(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews', id] }); invalidateActivity(); setInterviewModal(null); },
  });
  const editInterviewMut = useMutation({
    mutationFn: ({ iid, data }) => interviewApi.update(iid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews', id] }); invalidateActivity(); setInterviewModal(null); },
  });
  const delInterviewMut = useMutation({
    mutationFn: interviewApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews', id] }); invalidateActivity(); },
  });

  const addContactMut = useMutation({
    mutationFn: (d) => applicationApi.addContact(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts', id] }); invalidateActivity(); setContactModal(null); },
  });
  const editContactMut = useMutation({
    mutationFn: ({ cid, data }) => contactApi.update(cid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts', id] }); invalidateActivity(); setContactModal(null); },
  });
  const delContactMut = useMutation({
    mutationFn: contactApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts', id] }); invalidateActivity(); },
  });

  const addEmailMut = useMutation({
    mutationFn: (d) => applicationApi.addEmail(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emails', id] }); invalidateActivity(); setEmailModal(null); },
  });
  const editEmailMut = useMutation({
    mutationFn: ({ eid, data }) => emailApi.update(eid, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emails', id] }); invalidateActivity(); setEmailModal(null); },
  });
  const delEmailMut = useMutation({
    mutationFn: emailApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emails', id] }); invalidateActivity(); },
  });

  const jdUploadMut = useMutation({
    mutationFn: (file) => applicationApi.uploadJd(id, file),
    onSuccess: () => invalidate(),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!app) return <div className="card p-8 text-center text-slate-500">Application not found</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/applications" className="text-slate-500 hover:text-slate-300 flex items-center gap-1"><ArrowLeft size={14} /> Applications</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-400">{app.company}</span>
      </div>

      {/* Header card */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-400 shrink-0">
            {app.company[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{app.company}</h1>
            <p className="text-slate-400 mt-0.5">{app.role}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <StatusBadge status={app.status} size="md" />
              {app.score && <span className={`text-base font-bold ${scoreColor(app.score)}`}>{app.score}</span>}
              <span className="text-xs text-slate-600">{fmtDate(app.date)}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {app.url && (
              <a href={app.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={13} /> View JD
              </a>
            )}
            <button onClick={() => setEditOpen(true)} className="btn btn-secondary btn-sm"><Edit3 size={13} /> Edit</button>
            <button onClick={() => { if (window.confirm('Delete this application?')) deleteMut.mutate(); }} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
          </div>
        </div>

        {/* Quick status change */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="label mb-2">Quick Status Update</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => updateMut.mutate({ status: s })}
                disabled={app.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${app.status === s ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 cursor-default' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'tab-active shrink-0' : 'tab-inactive shrink-0'}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Company" value={app.company} />
          <Field label="Role" value={app.role} />
          <Field label="Date Applied" value={fmtDate(app.date)} />
          <Field label="Score" value={app.score} />
          <Field label="Status" value={app.status} />
          {app.url && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Job URL</p>
              <a href={app.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1">
                Open JD <ExternalLink size={12} />
              </a>
            </div>
          )}
          {app.report_link && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Report</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-mono truncate">{app.report_link}</span>
                <PreviewButton file={app.report_link} title={`Report — ${app.company}`} />
              </div>
            </div>
          )}
          {app.notes && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Notes</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{app.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Interviews' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">{interviews.length} interview{interviews.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setInterviewModal('new')} className="btn btn-primary btn-sm"><Plus size={14} /> Schedule</button>
          </div>
          {interviews.length === 0 && <div className="card p-8 text-center text-slate-600 text-sm">No interviews yet</div>}
          {interviews.map(i => (
            <InterviewCard
              key={i.id}
              interview={i}
              onEdit={() => setInterviewModal(i)}
              onDelete={(iid) => { if (window.confirm('Delete interview?')) delInterviewMut.mutate(iid); }}
            />
          ))}
        </div>
      )}

      {tab === 'HR Contacts' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setContactModal('new')} className="btn btn-primary btn-sm"><Plus size={14} /> Add Contact</button>
          </div>
          {contacts.length === 0 && <div className="card p-8 text-center text-slate-600 text-sm">No contacts yet</div>}
          {contacts.map(c => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={() => setContactModal(c)}
              onDelete={(cid) => { if (window.confirm('Delete contact?')) delContactMut.mutate(cid); }}
            />
          ))}
        </div>
      )}

      {tab === 'Cold Emails' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">{emails.length} email{emails.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setEmailModal('new')} className="btn btn-primary btn-sm"><Plus size={14} /> Log Email</button>
          </div>
          {emails.length === 0 && <div className="card p-8 text-center text-slate-600 text-sm">No cold emails logged yet</div>}
          {emails.map(e => (
            <EmailCard
              key={e.id}
              email={e}
              appId={id}
              qc={qc}
              onEdit={() => setEmailModal(e)}
              onDelete={(eid) => { if (window.confirm('Delete email?')) delEmailMut.mutate(eid); }}
            />
          ))}
        </div>
      )}

      {tab === 'History' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm">{activity.length} event{activity.length !== 1 ? 's' : ''}</p>
          </div>
          <ActivityTimeline entries={activity} />
        </div>
      )}

      {tab === 'Documents' && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">Job Description File</h3>
            <p className="text-xs text-slate-500 mb-4">Attach the original JD PDF or document for reference.</p>
            {app.jd_file ? (
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <FileText size={20} className="text-indigo-400 shrink-0" />
                <p className="text-sm text-slate-300 flex-1 truncate">{app.jd_file}</p>
                <a href={`/uploads/${app.jd_file}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm shrink-0">
                  <Download size={13} /> Download
                </a>
                {app.jd_file.endsWith('.md') && (
                  <PreviewButton file={`dashboard-web/data/uploads/${app.jd_file}`} label="Preview" title={app.jd_file} className="shrink-0" />
                )}
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                <Upload size={24} className="mx-auto text-slate-600 group-hover:text-indigo-400 mb-2 transition-colors" />
                <p className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Click to upload JD file</p>
                <p className="text-xs text-slate-700 mt-1">PDF, DOC, DOCX up to 20MB</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={e => { if (e.target.files[0]) jdUploadMut.mutate(e.target.files[0]); }}
            />
            {app.jd_file && (
              <button onClick={() => fileRef.current?.click()} className="btn btn-secondary btn-sm mt-2">
                <Upload size={13} /> Replace File
              </button>
            )}
            {jdUploadMut.isPending && <p className="text-xs text-slate-500 mt-2">Uploading…</p>}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Application" maxWidth="max-w-lg">
        <EditAppForm app={app} onSubmit={(d) => { updateMut.mutate(d); setEditOpen(false); }} loading={updateMut.isPending} />
      </Modal>

      {/* Interview Modal */}
      <Modal
        isOpen={!!interviewModal}
        onClose={() => setInterviewModal(null)}
        title={interviewModal === 'new' ? 'Schedule Interview' : 'Edit Interview'}
        maxWidth="max-w-lg"
      >
        <InterviewForm
          initial={interviewModal !== 'new' ? interviewModal : {}}
          loading={addInterviewMut.isPending || editInterviewMut.isPending}
          onSubmit={(d) => {
            if (interviewModal === 'new') addInterviewMut.mutate(d);
            else editInterviewMut.mutate({ iid: interviewModal.id, data: d });
          }}
        />
      </Modal>

      {/* Contact Modal */}
      <Modal
        isOpen={!!contactModal}
        onClose={() => setContactModal(null)}
        title={contactModal === 'new' ? 'Add HR Contact' : 'Edit Contact'}
        maxWidth="max-w-md"
      >
        <ContactForm
          initial={contactModal !== 'new' ? contactModal : {}}
          loading={addContactMut.isPending || editContactMut.isPending}
          onSubmit={(d) => {
            if (contactModal === 'new') addContactMut.mutate(d);
            else editContactMut.mutate({ cid: contactModal.id, data: d });
          }}
        />
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={!!emailModal}
        onClose={() => setEmailModal(null)}
        title={emailModal === 'new' ? 'Log Cold Email' : 'Edit Email'}
        maxWidth="max-w-lg"
      >
        <EmailForm
          initial={emailModal !== 'new' ? emailModal : {}}
          loading={addEmailMut.isPending || editEmailMut.isPending}
          onSubmit={(d) => {
            if (emailModal === 'new') addEmailMut.mutate(d);
            else editEmailMut.mutate({ eid: emailModal.id, data: d });
          }}
        />
      </Modal>
    </div>
  );
}

function EditAppForm({ app, onSubmit, loading }) {
  const [form, setForm] = useState({
    company: app.company || '', role: app.role || '', date: app.date || '', status: app.status || 'Evaluated',
    score: app.score || '', url: app.url || '', notes: app.notes || '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 form-group"><label className="label">Company</label><input className="input" value={form.company} onChange={set('company')} required /></div>
        <div className="col-span-2 form-group"><label className="label">Role</label><input className="input" value={form.role} onChange={set('role')} required /></div>
        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={set('date')} /></div>
        <div className="form-group"><label className="label">Score</label><input className="input" value={form.score} onChange={set('score')} /></div>
        <div className="form-group"><label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="form-group"><label className="label">URL</label><input className="input" value={form.url} onChange={set('url')} /></div>
        <div className="col-span-2 form-group"><label className="label">Notes</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} /></div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">{loading ? 'Saving…' : 'Save Changes'}</button>
    </form>
  );
}
