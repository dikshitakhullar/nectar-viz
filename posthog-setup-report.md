<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Nectar Visualizer. Here is a summary of all changes made:

**New files created:**
- `instrumentation-client.ts` — Initializes posthog-js client-side using the Next.js 15.3+ instrumentation API. Enables automatic pageview tracking, exception capture, and session replay.
- `lib/posthog-server.ts` — Factory function (`createPostHogClient`) for server-side PostHog event capture using `posthog-node`. Creates a fresh client per API request with `flushAt: 1` to guarantee immediate delivery.

**Modified files:**
- `app/providers.tsx` — Removed `initPostHog()` call (replaced by `instrumentation-client.ts` to avoid double-initialization).
- `next.config.ts` — Added reverse proxy rewrites so PostHog requests route through `/ingest` (reduces ad-blocker interference).
- `app/upload/page.tsx` — Added PostHog event captures for `room_photo_uploaded`, `visualization_submitted`, `ai_recommendation_submitted`, `visualization_completed`, `ai_visualization_completed`, `visualization_failed`. Also passes `X-POSTHOG-DISTINCT-ID` header to API routes for client–server correlation.
- `app/result/page.tsx` — Added captures for `result_downloaded`, `result_shared`, `ai_option_switched`, `try_different_room_clicked`, `try_another_product_clicked`.
- `app/api/generate/route.ts` — Server-side captures for `visualization_generated` and `visualization_generation_failed`.
- `app/api/recommend/route.ts` — Server-side captures for `recommendation_generated` and `recommendation_generation_failed`.
- `.env.local` — Created with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.
- `package.json` / `package-lock.json` — Added `posthog-node` dependency.

---

| Event | Description | File |
|-------|-------------|------|
| `room_photo_uploaded` | User selects a room photo on the upload form | `app/upload/page.tsx` |
| `visualization_submitted` | User submits form for a specific product render | `app/upload/page.tsx` |
| `ai_recommendation_submitted` | User submits form in AI mode | `app/upload/page.tsx` |
| `visualization_completed` | Specific product render succeeds and result is ready | `app/upload/page.tsx` |
| `ai_visualization_completed` | All AI recommendation renders complete successfully | `app/upload/page.tsx` |
| `visualization_failed` | Render or AI flow fails with an error | `app/upload/page.tsx` |
| `result_downloaded` | User downloads their room visualization | `app/result/page.tsx` |
| `result_shared` | User shares their room visualization via Web Share API | `app/result/page.tsx` |
| `ai_option_switched` | User switches between AI-recommended product options | `app/result/page.tsx` |
| `try_different_room_clicked` | User taps "Try a Different Room" on result page | `app/result/page.tsx` |
| `try_another_product_clicked` | User taps "Try Another Product" on result page | `app/result/page.tsx` |
| `visualization_generated` | Server-side: AI image generation succeeds | `app/api/generate/route.ts` |
| `visualization_generation_failed` | Server-side: AI image generation fails | `app/api/generate/route.ts` |
| `recommendation_generated` | Server-side: AI product recommendation returns 3 slugs | `app/api/recommend/route.ts` |
| `recommendation_generation_failed` | Server-side: AI product recommendation fails | `app/api/recommend/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1597854)
- [Visualization conversion funnel](/insights/KOqWBps3) — Submission → render completion rate
- [Full user journey funnel](/insights/ZsonCkYY) — Submission → completion → download
- [Renders generated vs failed](/insights/R1CHOBhQ) — Server-side success/failure trend
- [Downloads and shares over time](/insights/nyBe3e5k) — Result engagement trend
- [AI mode vs specific product submissions](/insights/qTHDzzlu) — Which flow users prefer

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
