This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Content management

Administrators can manage public page copy, studio contact information, calls to action, and social-media URLs from **Admin → Content Editor**. Published values are validated by the backend and served through the public CMS API; built-in defaults keep pages usable if the API is temporarily unavailable.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Manual verification API contract

Class bookings and class-pass requests do not collect online payments. They remain pending until an administrator verifies them.

The API must provide these authenticated endpoints:

- `POST /payments/manual` — accepts JSON with `purchaseType` and `classId` or `passOptionId`. The server resolves the authoritative listed price and creates the pending verification record and enrollment/pass atomically.
- `GET /payments/manual?limit=100` — admin-only list, including student and purchased-item relationships. `screenshotUrl` must be a short-lived signed URL or an authenticated download URL.
- `PATCH /payments/manual/:id` — admin-only transition from `PENDING` to `VERIFIED` or `REJECTED`, with an optional `adminNote`. Verification must atomically activate the enrollment/pass and create its immutable receipt; rejection must not grant access.

The server is the authorization boundary: prices must be resolved server-side, meeting links must only be returned for approved/active enrollments, and duplicate submissions/approvals must be prevented with idempotency and database constraints.

## Makeup-credit expiry rule

An absence creates a single-use makeup credit that is valid only through the last calendar day of the missed class month. For example, a class missed on August 5, 2026 expires at the end of August 31, 2026 and is unavailable from September 1. The backend must enforce the same UTC calendar-month boundary when listing and consuming credits; frontend filtering is not an authorization boundary.
