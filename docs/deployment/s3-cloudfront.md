# S3 + CloudFront deployment

Live at <https://d16lbq7rem1z12.cloudfront.net>. CD workflow ([`.github/workflows/cd.yml`](../../.github/workflows/cd.yml)) deploys on every push to `main`.

## Why S3 + CloudFront

The frontend bundle is a handful of static files: one `index.html`, one CSS and one JS in `dist/`. We don't need a Node server in production. S3 hosts the files, CloudFront fronts them with TLS, caching and a global edge network. GitHub Actions builds and pushes on every merge to `main`.

## Topology

```
GitHub Actions (build + sync)
       │
       ▼
   S3 bucket (private, OAC-only)         dist/index.html
                                         dist/assets/index-*.js  ── hashed names
                                         dist/assets/index-*.css
       ▲
       │ Origin Access Control
       │
   CloudFront distribution               TLS, edge cache, SPA fallback (403/404 → /index.html 200)
       ▲
       │
   Browser
```

The backend stays on its own EC2 host; CloudFront and the backend share nothing other than the domain name.

## Infra checklist (one-time)

| What                                                                                                                                                                                                                | Where       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| S3 bucket `llm-portrait-frontend`, region `eu-central-1`, "Block all public access" on                                                                                                                              | AWS console |
| CloudFront distribution. Origin: the S3 bucket via OAC. Default root object: `index.html`. SPA fallback: custom error responses, 403 and 404 → `/index.html` with status 200.                                       | AWS console |
| ACM certificate (us-east-1, required for CloudFront) for the production hostname                                                                                                                                    | AWS console |
| Attach the certificate as an alternate domain name on the distribution                                                                                                                                              | AWS console |
| IAM role for GitHub OIDC, trusted to `repo:capitanx9/llm-portrait-frontend:ref:refs/heads/main`. Permissions: `s3:PutObject`, `s3:DeleteObject` on the bucket, `cloudfront:CreateInvalidation` on the distribution. | AWS IAM     |

The DNS record (CNAME for the custom domain) is currently on NoIP. There were a few false starts with NoIP's shared zone restrictions; for now we plan to ship on the raw `*.cloudfront.net` URL until DNS is sorted out.

## Cache policy

- `dist/assets/*` (hashed filenames) → `Cache-Control: public, max-age=31536000, immutable`. Safe to cache forever because every deploy emits new hashes.
- `dist/index.html` (single, no hash) → `Cache-Control: no-cache, must-revalidate`. Every deploy creates a new `index.html` that references the new asset hashes; we need the browser to fetch it fresh.

The CD workflow uploads in two passes (hashed assets first, then everything else) and then invalidates only `/index.html` on CloudFront, not `/*`. This minimises invalidation cost and prevents serving an old `index.html` that points at deleted asset hashes.

## CD workflow (committed in PR-7)

```yaml
name: CD
on:
  push:
    branches: [main]

concurrency:
  group: cd-${{ github.ref }}
  cancel-in-progress: false

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    name: Build and deploy to S3 + CloudFront
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Sync hashed assets (long cache)
        run: |
          aws s3 sync dist/assets/ s3://${{ secrets.S3_BUCKET }}/assets/ \
            --delete \
            --cache-control "public, max-age=31536000, immutable"

      - name: Sync index.html and other root files (no cache)
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }}/ \
            --delete \
            --exclude "assets/*" \
            --cache-control "no-cache, must-revalidate"

      - name: Invalidate CloudFront cache for index.html
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/index.html" "/"
```

## Secrets

Added by hand on GitHub (`Settings → Secrets and variables → Actions`):

- `AWS_ROLE_TO_ASSUME` — ARN of the OIDC role.
- `AWS_REGION` — `eu-central-1`.
- `S3_BUCKET` — bucket name.
- `CLOUDFRONT_DISTRIBUTION_ID` — set once the distribution is created.

We never run `gh secret set` from a script. Secret material is added through the UI by the repo owner.

## Backend CORS

The backend needs to allow the production frontend origin in `CORS_ALLOWED_ORIGINS`. That edit happens on the backend side in `/opt/llm-portrait/.env`; the deployment doc for it is in the backend repo.

## Smoke checks after a deploy

1. CD workflow run is green in GitHub Actions.
2. `curl -I https://<distribution>/` returns 200 with `cache-control: no-cache`.
3. `curl -I https://<distribution>/assets/index-<hash>.js` returns 200 with `cache-control: public, max-age=31536000, immutable`.
4. Open the URL in an incognito tab; log in; send a chat message; both REST and WS work.

## Rollback

Revert the offending commit on `main` and let CD redeploy. There is no separate rollback path — the deploy is fully driven from `main`.
