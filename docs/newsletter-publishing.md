# Newsletter publishing

The pipeline produces a Markdown draft at
`drafts/YYYY-MM-DD-issue-N.md` via:

```bash
npm run pipeline:newsletter -- --since=<last issue date> --issue=<N>
```

Drafts are **never auto-published**. A human reviews, edits, and then
pastes into one of the platforms below. The platform decision is the
maintainer's, not the pipeline's — this doc only lays out the options.

## Platform options

### 1. LinkedIn Newsletter

- **Pros:** Native distribution to an audience that already follows the
  project owner; zero new tooling; strong reach in the AV / mobility
  professional network.
- **Cons:** Markdown must be hand-massaged into LinkedIn's editor;
  limited formatting; no list export, so subscribers are locked to
  LinkedIn.

### 2. Substack

- **Pros:** Free; clean Markdown-ish paste-in; owns an exportable
  subscriber list; good archive and SEO; built-in email + web.
- **Cons:** Substack-branded; another account/surface to manage;
  discovery skews to existing Substack readers.

### 3. beehiiv

- **Pros:** Free up to 2,500 subscribers; strongest growth/referral
  tooling of the three; exportable list; solid deliverability and
  analytics.
- **Cons:** Newer platform, smaller built-in audience; free tier caps
  at 2,500 subs; some advanced features are paywalled.

## Recommendation framing (decision stays with the maintainer)

- Optimizing for **reach now with least effort** → LinkedIn.
- Optimizing for **owning the list + clean archive** → Substack.
- Optimizing for **growth tooling and analytics** → beehiiv.

Whatever is chosen, wire the About-page signup form
(`/api/newsletter-signup`, see `avmap.io`) to that provider's list at
that time.
