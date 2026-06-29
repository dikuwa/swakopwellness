# Deployment Guide

## Environments
Local, preview/staging and production must use separate databases, storage prefixes/buckets and credentials.

## Recommended services
- Vercel application hosting
- Managed PostgreSQL
- Cloudflare R2 or compatible object storage
- Resend email
- OpenAI API
- Sentry monitoring

## Deployment sequence
1. Provision production services.
2. Configure secrets in hosting dashboard.
3. Run reviewed migrations through controlled CI/deploy job.
4. Seed roles, permissions, owner account, defaults and editable services.
5. Upload approved brand assets.
6. Verify domain, email sender and redirects.
7. Run smoke tests.
8. Enable monitoring and backups.

## Rollback
Keep previous deployment available, avoid irreversible migrations, document compensating SQL and test restore procedures before launch.
