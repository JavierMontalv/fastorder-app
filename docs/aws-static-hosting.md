# COMANDA static hosting on AWS

This stack creates a parallel, reversible hosting layer for the two Vite SPAs. It does not change Namecheap DNS, Vercel, EC2, or the existing API.

## Components

- Private, encrypted, versioned S3 buckets.
- CloudFront distributions using Origin Access Control.
- SPA fallback for HTTP 403 and 404 responses.
- Managed security response headers and HTTPS redirects.
- Separate GitHub OIDC roles restricted to each repository and `main` branch.
- S3 noncurrent versions retained for 30 days to support rollback.

## Deployed parallel environment

- CloudFormation stack: `comanda-static-frontends` (`CREATE_COMPLETE`).
- Admin preview: `https://d2yqtbi3ehl8mo.cloudfront.net`.
- Menu preview: `https://d1adlxveiv3ha.cloudfront.net`.
- Admin distribution: `EFX88M70T55PI`.
- Menu distribution: `E1THVYGIXF2J3N`.
- ACM certificate: `arn:aws:acm:us-east-1:061039768875:certificate/7d86404f-6732-467a-b2e3-04515f694850` (`PENDING_VALIDATION`).

Both direct S3 origins return HTTP 403. Root and client-side routes return HTTP 200 through CloudFront with the managed security headers policy.

The existing API already authorizes the final origins `https://admin.somoscomanda.com` and `https://menu.somoscomanda.com`. It intentionally rejects the temporary CloudFront hostnames, so API preflight testing against those temporary names is limited without changing EC2. No EC2 or API configuration was changed.

## Namecheap records (do not publish yet)

ACM validation records can be published without moving traffic:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `_7b41e9f5509a498e3b435dab06eafc1d.admin` | `_a0e989b4e0a7cf9925db7747293ea0cc.wzccmgtwzk.acm-validations.aws` |
| CNAME | `_56ea490906b66ebac72cacee368e8c22.menu` | `_dcacb416af779aa781a2882eacc8954a.wzccmgtwzk.acm-validations.aws` |

Traffic cutover records are only applied after ACM is issued and the certificate/aliases are attached to CloudFront:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `admin` | `d2yqtbi3ehl8mo.cloudfront.net` |
| CNAME | `menu` | `d1adlxveiv3ha.cloudfront.net` |

## Deployment contract

Only an approved commit on `main` may assume a deployment role. GitHub Actions builds with locked dependencies, publishes non-hashed files with revalidation, publishes fingerprinted assets as immutable, invalidates CloudFront, and verifies both the SPA route and the API.

The admin workflow remains dormant until `admin-web` exists on `main`. The visual pull request is not merged by this infrastructure change.

## Cutover and rollback

Cutover is a later, explicitly authorized phase. After ACM validation, update the stack with `CustomDomainCertificateArn`, wait for both distributions to be `Deployed`, then replace the Namecheap CNAME records. Vercel remains intact during the observation window.

Rollback is a DNS change back to `cname.vercel-dns.com`. For an application-only rollback, restore a previous S3 object version and invalidate CloudFront.
