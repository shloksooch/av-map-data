# Legacy V1 pipeline

The V1 autonomous multi-agent pipeline has **not been deleted**. It
lives, intact and runnable, in its own repository:

→ [`path-avmap/av-map-agents`](https://github.com/path-avmap/av-map-agents)

It is an AWS Lambda + EventBridge system that extracts AV events via
Claude on AWS Bedrock, stages candidates in Supabase, and serves a
React review dashboard. It is preserved for rollback.

V2 (the three-prompt CLI in [`/scripts/v2-pipeline.mjs`](../scripts/v2-pipeline.mjs))
supersedes it for day-to-day operation. See
[`/docs/architecture-v2.md`](../docs/architecture-v2.md) for the why and
the how, including the rollback path.

Do not remove the `av-map-agents` repo without an explicit decision —
it is the only copy of V1.
