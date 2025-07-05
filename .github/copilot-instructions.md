<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# BizTool Development Guidelines

This is a mobile-first ERP & CRM solution built with Next.js, inspired by Odoo. Follow these guidelines when working on the project:

## Project Overview
- **Target Audience**: MSMEs (Micro, Small, and Medium Enterprises)
- **Design Philosophy**: Mobile-first, simple, efficient, and affordable
- **Inspiration**: Odoo's modular approach and clean design

## Technical Stack
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui components
- Aceternity UI for advanced animations
- Lucide React for icons
- Framer Motion for animations

## Development Guidelines

### Mobile-First Approach
- Always design for mobile devices first
- Use responsive design patterns (sm:, md:, lg:, xl:)
- Ensure touch-friendly interface elements
- Optimize for smaller screens and touch interactions

### UI/UX Principles
- Keep interfaces clean and uncluttered
- Use consistent color schemes and typography
- Implement proper loading states and error handling
- Ensure accessibility standards are met

### Component Structure
- Use shadcn/ui components as the foundation
- Create reusable components in `src/components/ui/`
- Follow the established naming conventions
- Implement proper TypeScript interfaces

### Code Quality
- Write self-documenting code with clear variable names
- Use TypeScript strictly - avoid `any` types
- Follow React best practices and hooks patterns
- Implement proper error boundaries

### Styling Guidelines
- Use Tailwind CSS utility classes
- Maintain consistent spacing and sizing
- Use the established color palette
- Implement proper dark mode support

## Module Development
When developing new modules:
1. Create a new directory under `src/app/[module-name]/`
2. Follow the established page structure
3. Use the module-specific color scheme
4. Implement proper navigation and breadcrumbs
5. Add mobile-optimized layouts

## Performance Considerations
- Optimize images and assets
- Use Next.js Image component
- Implement proper lazy loading
- Consider bundle size impact

## Testing
- Test on multiple device sizes
- Verify touch interactions work properly
- Test dark mode functionality
- Ensure accessibility compliance
