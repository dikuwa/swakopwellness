# Environment Setup

| Variable | Purpose | Required | Scope | Placeholder / source |
|---|---|---:|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection | Yes | Server | `[postgresql-connection-url]` from database provider |
| `DIRECT_URL` | Direct migration connection | Usually | Server | `[direct-postgresql-url]` |
| `AUTH_SECRET` | Session signing/encryption | Yes | Server | Generate a long random secret |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL | Yes | Client-safe | `https://example.com` |
| `R2_ACCOUNT_ID` | Object storage account | If uploads | Server | Cloudflare dashboard |
| `R2_ACCESS_KEY_ID` | Storage credential | If uploads | Server | R2 API token |
| `R2_SECRET_ACCESS_KEY` | Storage secret | If uploads | Server | R2 API token |
| `R2_BUCKET_NAME` | Bucket | If uploads | Server | `[bucket-name]` |
| `R2_PUBLIC_BASE_URL` | Public media base | Optional | Client-safe | Custom domain or public endpoint |
| `RESEND_API_KEY` | Transactional email | If email enabled | Server | Resend dashboard |
| `RESEND_FROM_EMAIL` | Verified sender | If email enabled | Server | `Bookings <bookings@example.com>` |
| `OPENAI_API_KEY` | Chatbot model access | If chatbot enabled | Server | OpenAI project secret |
| `OPENAI_MODEL` | Selected compatible model | Optional | Server | `[model-id]` |
| `SENTRY_DSN` | Error reporting | Recommended | Server/client as configured | Sentry project |

Never prefix secrets with `NEXT_PUBLIC_`. Use separate credentials per environment and rotate them after staff or vendor access changes.
