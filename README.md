# BizTool - ERP & CRM Solution

This is a mobile-first ERP & CRM solution built with Next.js, inspired by Odoo. It provides comprehensive business management tools for MSMEs (Micro, Small, and Medium Enterprises).

## Features

- **Mobile-First Design**: Optimized for mobile devices with responsive layouts
- **Modular Architecture**: Separate modules for different business functions
- **Modern UI**: Built with shadcn/ui and Aceternity UI components
- **Authentication**: Secure login system with social authentication options
- **Business Modules**:
  - Manager Module: Business management dashboard with analytics
  - Store Module: Inventory management and sales tracking
  - Attendance Module: Employee time tracking and leave management
  - HR Module: Human resources management and payroll

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Aceternity UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **TypeScript**: Full type safety

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── attendance/         # Attendance module
│   ├── hr/                # HR module
│   ├── login/             # Authentication pages
│   ├── manager/           # Manager module
│   ├── store/             # Store module
│   └── components/        # Shared components
├── components/
│   └── ui/                # Reusable UI components
└── lib/                   # Utility functions
```

## Current Status

This is the initial setup with:
- ✅ Landing page with hero section and module cards
- ✅ Login page with authentication form
- ✅ Placeholder pages for all modules
- ✅ Mobile-responsive design
- ✅ Modern UI components
- 🚧 Module implementations (coming soon)
- ❌ NO - Subscription/Billing Module NOT Implemented:

There's a "Billing & Subscriptions" button in the dashboard (line 472) but it's just a placeholder
No actual subscription management, payment processing, or billing features exist
No pricing tiers, upgrade/downgrade functionality, or payment integration
The button doesn't do anything when clicked


## Development

The project is set up for modern React development with:


## Face Attendance (FACEIO)

This app integrates FACEIO for face-based attendance.

- Client wrapper: `src/lib/faceio.ts` dynamically loads the SDK and exposes `faceEnroll()` and `faceAuthenticate()`.
- UI: `src/app/attendance/FaceAttendance.tsx` provides buttons to enroll a face and punch in/out.
- API routes:
   - `POST /api/attendance/enroll` stores the FACEIO reference (facialId) in your `employees.face_embedding` JSON.
   - `POST /api/attendance/record` records check-in/out in `attendance_records` after authenticating.

Environment variable required:

- `NEXT_PUBLIC_FACEIO_APP_KEY` — your FACEIO public application key (client-side).

Module gating:

- The Attendance module is only shown and usable when the tenant has subscribed to it.
- We check the `tenant_effective_modules` view if available, falling back to `tenant_module_subscriptions`.

Data flow:

- Enrollment: FACEIO returns a `facialId`; we link it to the current employee row (same user) in `employees.face_embedding`.
- Punch: FACEIO authenticate -> send `facialId` -> we validate match with the employee for the current user+tenant -> insert into `attendance_records`.

Notes: You must have an `employees` row associated to the user (`employees.user_id`) and a `user_profiles` row with `tenant_id`.

## Dev/Test accounts (Supabase)

For local testing across roles and tenants, use the provided scripts. These require:

- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server secret; do not commit)

Commands (PowerShell):

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"; npm run seed:dev
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"; npm run list:users
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"; npm run reset:user -- user@example.com NewPass123!
```

Seeded demo users:

- acme-admin@demo.local / Demo12345! (admin @ acme)
- acme-manager@demo.local / Demo12345! (manager @ acme)
- acme-employee@demo.local / Demo12345! (employee @ acme)
- globex-admin@demo.local / Demo12345! (admin @ globex)

Safety notes:

- Use in dev only. Service role key is highly privileged—never expose in the browser or commit it.
- These scripts upsert tenants, profiles, memberships, employees, and activate core module subscriptions to allow testing.

## User Experience Analytics (Clarity + WebGazer)

The app ships with optional analytics that combine Microsoft Clarity session replays/heat-maps with WebGazer eye-tracking.

### 1. Microsoft Clarity (mouse, scroll, rage-click heat-maps)

1. Sign in at [clarity.microsoft.com](https://clarity.microsoft.com) with any Microsoft account.
2. Create a **New Project** and copy the generated `<script>` snippet.
3. Set the project ID as an environment variable (PowerShell example):

   ```powershell
   $env:NEXT_PUBLIC_MS_CLARITY_ID="YOUR-CLARITY-ID"; npm run dev
   ```

When `NEXT_PUBLIC_MS_CLARITY_ID` is present, the loader script is injected automatically via `src/app/layout.tsx`.

### 2. WebGazer Eye Tracking

1. Ensure users grant webcam access when prompted.
2. Toggle the feature by setting:

   ```powershell
   $env:NEXT_PUBLIC_ENABLE_EYE_TRACKING="true"; npm run dev
   ```

3. With the flag enabled, the `EyeTracker` client component streams gaze coordinates to Clarity custom tags (`gazeX`, `gazeY`).
4. In the Clarity dashboard, add custom filters for `gazeX` / `gazeY` to slice heat-maps by eye focus.

The `EyeTracker` component lives in `src/components/analytics/EyeTracker.tsx`; you can drop it into any route that should capture gaze data or adjust the listener to forward coordinates to your own backend.

> Tip: For calibration, ask testers to follow an on-screen dot for a few seconds before starting the session to improve WebGazer accuracy.
## Contributing

1. Fork the repository
4. Submit a pull request

## License


## Password reset flow


Implementation notes:
- Forgot page calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/reset-password" })`.
- Supabase recovery link redirects to `/reset-password`; the client session is established and then `auth.updateUser({ password })` is called.
- If you change the path, update the redirect in `src/app/forgot-password/page.tsx`.
