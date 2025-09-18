## Phased Plan: Personalized Dashboard

### Phase 1: Data Fetch & Role Resolution
Goal: Reliably know who the user is and what role they have when rendering the dashboard.
- Server component (or route segment) fetch: auth user, `user_profiles`, `tenant_memberships`.
- Derive effectiveRole (e.g., manager, employee; fallback to employee).
- Handle unauthenticated redirect gracefully.
- Skeleton loading + basic error boundary.

### Phase 2: Role-Based Module Configuration
Goal: Central config maps roles -> visible modules/actions.
- Create `src/lib/dashboard/modules.ts` exporting array of module definitions:
  { key, label, href, icon, roles: [...] }
- Filter modules in dashboard render based on effectiveRole.
- Support future favorites (placeholder field).

### Phase 3: Shared Dashboard Layout
Goal: Reusable layout & base UI.
- Create `DashboardShell` component with: header (welcome, role chip), grid of modules, quick actions slot.
- Add empty state variations (e.g., no modules).

### Phase 4: Manager Widgets
Goal: Manager-specific insights.
- Placeholder cards: Organization Users (count), Pending Approvals, Inventory Low Stock (stub), Recent Orders.
- Async data fetch structure (mock/stub queries now, real queries later).

### Phase 5: Employee Widgets
Goal: Employee-centric experience.
- Attendance status (last record or “not checked in”).
- Assigned tasks (stub).
- Quick links (Request Leave, View Payslip placeholder, Update Profile).

### Phase 6: Preferences Persistence
Goal: Personalization.
- Extend `user_profiles.preferences.dashboard` with: favorites: string[], dismissedTips: string[]
- Add “star” toggle for modules (optimistic update).

### Phase 7: Quality & Polishing
- Loading states (skeletons).
- Error boundaries per widget.
- Accessibility: landmarks, role-based aria labels.
- Dark/light variable alignment.

## Data Contract (Initial)
effectiveRole: 'manager' | 'employee'
profile: { first_name, last_name, role, preferences }
modules: Array<{ key, label, href, icon, ... }>
widgets: lazy/conditional based on role

## Edge Cases
- User has no profile yet → onboarding notice.
- User in multiple tenants (future) → tenant switcher placeholder.
- Missing permissions (role downgrade) → safe fallback to employee.

## Implementation Order
1. Phase 1 (data + role)
2. Phase 2 (module config)
3. Phase 3 (layout)
4. Phase 4 & 5 (widgets)
5. Phase 6 (preferences)
6. Phase 7 (refinement)