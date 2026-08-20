# Demo seed

Run from the repository root after migrations:

```bash
npm run seed
```

The script requires `SEED_DEMO_PASSWORD` in `.env.local` with at least 12 characters. It creates or refreshes six confirmed demo accounts:

| Role | Email |
|---|---|
| Admin | `admin@clearpath.demo` |
| Reviewer | `maya.reviewer@clearpath.demo` |
| Reviewer | `jon.reviewer@clearpath.demo` |
| Submitter | `alex.submitter@clearpath.demo` |
| Submitter | `sam.submitter@clearpath.demo` |
| Submitter | `taylor.submitter@clearpath.demo` |

All accounts use the password supplied through `SEED_DEMO_PASSWORD`. Fifteen deterministic submissions cover every product type and channel, with varied statuses, AI flags, reviews, comments, and audit events.

The script is idempotent for its own records. It updates the six demo users, deletes only submissions with the reserved `c1ea…` fixture IDs, and recreates those fixtures. It does not delete other users or submissions.
