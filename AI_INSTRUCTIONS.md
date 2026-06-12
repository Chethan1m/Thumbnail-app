# AI Assistant Context File

Hello! If you are an AI assistant (like me) reading this in the future, here is everything you need to know about this project to help the user update it:

## Project Overview
- **Name:** Thumbnail App
- **Tech Stack:** Next.js 16 (App Router), React, Tailwind CSS, TypeScript
- **Database & Auth:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **AI Image Generation:** Fal.ai (Flux)
- **Deployment:** Vercel (`thumbnail-app-one.vercel.app`)

## Core Features
1. **Authentication:** Users can sign up/login. (Magic links & email verification are disabled in Supabase to prevent rate-limiting on the free tier).
2. **Credit System:** 
   - New users get 2 free credits upon signup.
   - We use a custom SQL trigger in `supabase/migrations/001_initial_schema.sql` to assign credits.
   - *Important fix made:* We lazy-provision credits in `app/api/user/route.ts` and `app/api/generate-thumbnail/route.ts` by upserting the user into `public.users` to prevent Foreign Key constraint errors.
3. **AI Generation:** Users upload a reference image, provide a prompt, and the app calls Fal.ai to generate a YouTube thumbnail.
4. **Stripe Integration:** Users can buy more credits via Stripe Checkout. Webhooks listen for successful payments to update the `user_credits` table.

## Deployment Notes
- The app uses `proxy.ts` (Next.js 16 standard) instead of `middleware.ts`.
- The production app is hosted on Vercel under the `chethan1ms-projects` team.
- **Environment Variables:** Must be managed in both `.env.local` (for local dev) and the Vercel Dashboard (for production).

## How to Help the User
When the user asks you to make changes, you have full permission to edit these files, run local builds (`npm run build`), and deploy directly to Vercel using `npx vercel --prod --yes` if requested. Always maintain the sleek, modern UI design.
