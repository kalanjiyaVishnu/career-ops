# Mode: tracker — Applications Tracker

Reads and displays `data/applications.md`.

**Tracker format:**
```markdown
| # | Date | Company | Role | Score | Status | PDF | Report |
```

Possible statuses (canonical — see `templates/states.yml`): `Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` / `Rejected` / `Discarded` / `SKIP`

- `Applied` = the candidate submitted their application
- `Responded` = a recruiter/company reached out and the candidate replied (inbound)
- `Interview` = in the interview process

If the user asks to update a status, edit the corresponding row.

Also show statistics:
- Total applications
- By status
- Average score
- % with PDF generated
- % with report generated
