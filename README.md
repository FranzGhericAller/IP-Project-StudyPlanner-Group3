This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


## Getting Started

Make sure node and npm are installed in the local device

node -v
npm -v

First, install dependencies:

```bash
npm install
```

Second, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
#or (if there are Windows Security concerns)
npx next dev --webpack
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Setup Database Locally

```bash
#Local database: create an empty database in MySQL first, then apply your existing table history:
  npx prisma migrate deploy
  npx prisma generate
#If the commands above complain about a missing database URL, either pass the file name each time:
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts

```



## Project Structure

The project follows the Next.js App Router architecture, with separate directories for application pages, reusable components, API routes, business logic, and database management.

```text
IP-Project-StudyPlanner/
├── app/                  # Pages, layouts, and API routes
│   ├── (app)/            # Authenticated application pages (Protected pages)
│   ├── (auth)/           # Login page (Public Pages)
│   └── api/              # API route handlers or server endpoints
├── components/           # Reusable UI components
├── lib/                  # Shared utilities, configuration and logic
├── services/              # Business logic and data operations
├── prisma/                # Database schema and migrations
├── storage/               # Local file uploads (gitignored)
├── public/                # Static assets
├── .env.example           # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

**Note:** The diagram general outline or the main directories and files. Some folders may contain additional nested files as development progresses.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
