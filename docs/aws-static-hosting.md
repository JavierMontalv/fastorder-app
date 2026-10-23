# COMANDA static hosting on AWS

This stack is the AWS production hosting layer for the two Vite SPAs. GitHub `main` is the source of truth and GitHub Actions deploys directly to AWS through OIDC. EC2 and the existing API are outside this frontend stack.

## Components

- Private, encrypted, versioned S3 buckets.
- CloudFront distributions using Origin Access Control.
- SPA fallback for HTTP 403 and 404 responses.
- Managed security response headers and HTTPS redirects.
- Separate GitHub OIDC roles restricted to each repository and `main` branch.
- S3 noncurrent versions retained for 30 days to support rollback.

## Production environment

- CloudFormation stack: `comanda-static-frontends` (`UPDATE_COMPLETE`).
- Admin preview: `https://d2yqtbi3ehl8mo.cloudfront.net`.
- Menu preview: `https://d1adlxveiv3ha.cloudfront.net`.
- Admin distribution: `EFX88M70T55PI`.
- Menu distribution: `E1THVYGIXF2J3N`.
- ACM wildcard certificate: `arn:aws:acm:us-east-1:061039768875:certificate/47d216cc-6677-4f0d-89a2-2beab0ace515` (`ISSUED`).
- Admin alias: `admin.somoscomanda.com`.
- Menu alias: `menu.somoscomanda.com`.

Both direct S3 origins return HTTP 403. Root and client-side routes return HTTP 200 through CloudFront with the managed security headers policy.

The existing API authorizes the final origins `https://admin.somoscomanda.com` and `https://menu.somoscomanda.com`. CI verifies those origins with a CORS preflight against `/api/auth/login`. No EC2 or API configuration was changed.

## Namecheap records

Wildcard ACM validation record:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `_28d6bfe3f796165d66752759686d2383` | `_e27a343d7ed91dbf47841ca617a8d47b.wzccmgtwzk.acm-validations.aws` |

Production traffic records:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `admin` | `d2yqtbi3ehl8mo.cloudfront.net` |
| CNAME | `menu` | `d1adlxveiv3ha.cloudfront.net` |

## Deployment contract

Only an approved commit on `main` may assume a deployment role. GitHub Actions builds with locked dependencies, publishes non-hashed files with revalidation, publishes fingerprinted assets as immutable, invalidates CloudFront, and verifies both the SPA route and the API.

Both workflows are active and verified end to end: build, OIDC, S3 publication, CloudFront invalidation, SPA route and API CORS.

## Cutover and rollback

CloudFront aliases and the wildcard certificate are deployed before changing the Namecheap CNAME records. DNS is changed only after direct `--resolve` HTTPS checks pass for the final hostnames.

Rollback does not depend on Vercel. Restore the required previous S3 object versions in the versioned bucket and invalidate the corresponding CloudFront distribution. Infrastructure changes are reverted through the previous CloudFormation template/parameters.
