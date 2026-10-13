# SaaS Make SaaS Explain

Create brand-adapted SaaS promotional videos from reference videos, for international agencies.

**Status: planning + offline foundation. This is not a working SaaS or video renderer yet.**

## Agreed scope

- International agencies; single-user accounts with multiple client brand kits.
- Preserve reference pacing, motion and scene layout; editable logos, colors, typography and copy.
- Hybrid AI footage plus precise brand/UI composition.
- Landscape 16:9 MP4, 1920×1080, under 60 seconds.
- Monthly subscriptions with credits; Stripe and PayPal subject to merchant eligibility.
- Advanced audio, team collaboration and automatic asset reconstruction deferred.

## Documents

- [Full project plan and 120 tasks](docs/project-plan.md)
- [Scene/brand/prompt specification](docs/scene-template-spec.md)
- [Implementation status and next steps](docs/implementation-status.md)
- [Decisions still needed](docs/open-decisions.md)

## Run the offline foundation

Requires Node.js 24+. No runtime dependencies or API keys needed.

```sh
npm test
npm run demo
```

The demo prints a render manifest and master prompt from a synthetic end-card scene. It does **not** produce MP4 or call an AI API. Synthetic logo/font/frame IDs must be replaced by validated uploaded assets before a real renderer can use them.

## Included

- TypeScript scene/brand contracts and runtime validation.
- End-card prompt compiler with separate composited vs AI background layers.
- Continuity/version checks and project duration validation.
- Tests and a GitHub Actions workflow.

Node strips TypeScript syntax when executing. This workflow does not yet perform static TypeScript type checking; add a pinned TypeScript toolchain when bootstrapping the application.

## Not yet implemented

Reference-video analysis, upload/storage, actual rendering, web UI, auth/database, jobs, provider adapters, payments and deployment. The compiler currently supports locked-camera end cards only. Frame geometry and assets in the example are illustrative, not extracted from the original reference video.

## Security and billing

Never commit API keys, tokens, customer videos or payment data. Asset ownership checks here are local consistency checks; server-side authorization and tenant isolation still need implementation. User-provided prompt text must remain untrusted data. No paid API calls or live billing have been enabled.

### Browser prototype

`npm run build:preview` builds a dependency-free static scene editor in `dist/`.
Open via a static host. Edit brand colors, wordmark and CTA, preview the 66-frame
end-card timeline, and download the compiled scene JSON. Uses the same validated
compiler content as the Node package. Uploaded logos stay in browser memory and
are not embedded in exports. This is a synthetic canvas preview, not source-video
analysis or an MP4 renderer. No API calls, database, authentication or billing.
