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

## Development

The project is set up for modern React development with:
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Password reset flow

This app uses Supabase Auth for password resets.

- /forgot-password — Enter email to receive reset link
- /reset-password — Enter new password after clicking email link

Implementation notes:
- Forgot page calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/reset-password" })`.
- Supabase recovery link redirects to `/reset-password`; the client session is established and then `auth.updateUser({ password })` is called.
- If you change the path, update the redirect in `src/app/forgot-password/page.tsx`.
