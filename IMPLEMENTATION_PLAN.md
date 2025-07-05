# BizTool Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for BizTool, a mobile-first ERP & CRM solution for MSMEs. The plan covers authentication, database architecture, and future extensibility considerations.

## 1. Authentication Implementation with BetterAuth

### 1.1 Technology Stack
- **Primary**: BetterAuth with Supabase backend
- **Database**: PostgreSQL (via Supabase)
- **JWT**: Built-in BetterAuth JWT handling
- **Session Management**: Server-side sessions with JWT tokens

### 1.2 Authentication Methods
1. **Email/Password Authentication**
   - Standard email verification flow
   - Password reset functionality
   - Strong password requirements

2. **Magic Link Authentication**
   - Passwordless login via email
   - Time-limited secure tokens
   - Mobile-optimized experience

3. **Social Authentication**
   - Google OAuth integration
   - LinkedIn OAuth (for business users)
   - GitHub OAuth (for developers)

4. **Phone OTP Authentication**
   - SMS OTP via Supabase/Twilio integration
   - WhatsApp OTP (future enhancement)
   - Phone number verification

### 1.3 User Fields & Schema
```typescript
interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  tenantId: string;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}
```

### 1.4 Multi-Tenancy Architecture
- **Tenant Isolation**: Row-level security (RLS) in Supabase
- **Tenant Model**: Single database, tenant-scoped data
- **Subdomain Support**: `{tenant}.biztool.com` routing
- **Custom Domains**: Future feature for enterprise clients

### 1.5 Security Features
- **Rate Limiting**: Login attempts, OTP requests
- **Session Management**: Secure cookie handling
- **CSRF Protection**: Built-in with BetterAuth
- **Password Security**: Argon2 hashing
- **Domain Restrictions**: Admin-configurable email domains

## 2. Database Architecture

### 2.1 Technology Choice: PostgreSQL via Supabase

**Rationale:**
- **Scalability**: Handles growth from startup to enterprise
- **ACID Compliance**: Ensures data consistency for financial records
- **JSON Support**: Flexible schema for custom fields
- **Full-text Search**: Built-in search capabilities
- **Real-time**: Supabase provides real-time subscriptions
- **Backup & Recovery**: Automated backups and point-in-time recovery
- **Global Distribution**: Edge functions and global CDN

**vs SQLite:**
- SQLite: Good for single-user, local applications
- PostgreSQL: Better for multi-user, web applications with complex queries
- Supabase: Provides managed PostgreSQL with additional features

### 2.2 Core Schema Design

#### 2.2.1 Authentication Tables
```sql
-- Create custom enum types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'employee');
CREATE TYPE contact_type AS ENUM ('customer', 'vendor', 'lead');
CREATE TYPE order_type AS ENUM ('quote', 'order', 'invoice');
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Users (managed by Supabase Auth)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'employee',
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.2 Multi-Tenancy Tables
```sql
-- Tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(50) UNIQUE NOT NULL,
  custom_domain VARCHAR(255),
  settings JSONB DEFAULT '{}',
  subscription_tier VARCHAR(20) DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant Memberships
CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(tenant_id, user_id)
);
```

#### 2.2.3 Core Business Tables
```sql
-- Contacts (CRM)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type contact_type NOT NULL, -- 'customer', 'vendor', 'lead'
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  address JSONB,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores/Locations
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  store_code VARCHAR(50),
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees (HR Management)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  employee_code VARCHAR(50) UNIQUE,
  face_embedding JSONB, -- For face recognition
  hire_date DATE,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(20) NOT NULL, -- 'check_in', 'check_out', 'break_start', 'break_end'
  location VARCHAR(255),
  face_match_confidence DECIMAL(5,2),
  notes TEXT,
  is_manual_entry BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PPE Tasks (Task Management)
CREATE TABLE public.ppe_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  task_code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  start_date DATE,
  deadline DATE,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_supervisor UUID REFERENCES employees(id),
  assigned_employee UUID REFERENCES employees(id),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  location VARCHAR(255),
  safety_requirements JSONB,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machinery & Equipment
CREATE TABLE public.machinery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  usage_hours INTEGER DEFAULT 0,
  last_maintenance DATE,
  next_maintenance DATE,
  status VARCHAR(20) DEFAULT 'operational', -- 'operational', 'maintenance', 'broken', 'retired'
  purchase_cost DECIMAL(10,2),
  location VARCHAR(255),
  assigned_to UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Management
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  item_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  unit_of_measure VARCHAR(50),
  supplier VARCHAR(255),
  unit_cost DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  location_in_store VARCHAR(100),
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Orders / Goods Receipt
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  grn_number VARCHAR(50) UNIQUE NOT NULL, -- Goods Receipt Number
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  quantity INTEGER NOT NULL,
  received_date DATE,
  supplier VARCHAR(255),
  invoice_number VARCHAR(100),
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  quality_check_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
  received_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders/Invoices
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  type order_type NOT NULL, -- 'quote', 'order', 'invoice'
  status order_status NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.3 Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Example RLS policies for tenant isolation
CREATE POLICY "Users can only access their tenant data" ON user_profiles
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see stores from their tenant" ON stores
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see employees from their tenant" ON employees
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see attendance records from their tenant" ON attendance_records
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see tasks from their tenant" ON ppe_tasks
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see machinery from their tenant" ON machinery
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see inventory from their tenant" ON inventory
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see contacts from their tenant" ON contacts
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see orders from their tenant" ON orders
FOR ALL TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()));
```

### 2.5 Business Logic & Relationships

Based on your database architecture, the system will handle these key business relationships:

#### 2.5.1 User & Employee Relationship
- **Users** can be linked to **Employees** for internal staff
- **Employees** can have attendance records, task assignments, and machinery access
- Face recognition data stored for biometric attendance

#### 2.5.2 Multi-Location Inventory
- **Stores** represent different physical locations
- **Inventory** is location-specific (items can be in multiple stores)
- **Purchase Orders** track goods receipt into specific locations

#### 2.5.3 Task Management Workflow
- **PPE Tasks** can be assigned to employees with supervisors
- Tasks have priority levels and safety requirements
- Time tracking with estimated vs actual hours

#### 2.5.4 Equipment & Maintenance
- **Machinery** assigned to employees with usage tracking
- Maintenance scheduling based on hours or time intervals
- Equipment history and cost tracking

#### 2.5.5 Attendance & HR
- **Attendance Records** with face recognition confidence scores
- Manual entry with approval workflow
- Integration with employee profiles for reporting

#### 2.5.6 Inventory & Order Integration
- **Order Items** reference **Inventory** instead of separate products
- Real-time stock level updates on order fulfillment
- Purchase order integration with inventory receiving

### 2.6 Database Functions & Triggers
```sql
-- Function to update inventory on order completion
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE inventory 
    SET quantity = quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND inventory.id = oi.inventory_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update inventory
CREATE TRIGGER trigger_update_inventory_on_order
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_order();

-- Function to calculate total task hours for employee
CREATE OR REPLACE FUNCTION get_employee_task_hours(employee_uuid UUID, start_date DATE, end_date DATE)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(actual_hours), 0)
    FROM ppe_tasks
    WHERE assigned_employee = employee_uuid
    AND completion_date BETWEEN start_date AND end_date
    AND status = 'completed'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items(tenant_uuid UUID)
RETURNS TABLE(
  item_name VARCHAR(255),
  current_quantity INTEGER,
  min_stock_level INTEGER,
  store_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.item_name, i.quantity, i.min_stock_level, s.name
  FROM inventory i
  JOIN stores s ON i.store_id = s.id
  WHERE i.tenant_id = tenant_uuid
  AND i.quantity <= i.min_stock_level
  AND i.is_active = true;
END;
$$ LANGUAGE plpgsql;
```
```sql
-- Tenant-based indexes for all tables
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_employee_code ON employees(employee_code);
CREATE INDEX idx_attendance_records_tenant_id ON attendance_records(tenant_id);
CREATE INDEX idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_records_timestamp ON attendance_records(timestamp);
CREATE INDEX idx_ppe_tasks_tenant_id ON ppe_tasks(tenant_id);
CREATE INDEX idx_ppe_tasks_assigned_employee ON ppe_tasks(assigned_employee);
CREATE INDEX idx_ppe_tasks_status ON ppe_tasks(status);
CREATE INDEX idx_ppe_tasks_deadline ON ppe_tasks(deadline);
CREATE INDEX idx_machinery_tenant_id ON machinery(tenant_id);
CREATE INDEX idx_machinery_assigned_to ON machinery(assigned_to);
CREATE INDEX idx_machinery_status ON machinery(status);
CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX idx_inventory_store_id ON inventory(store_id);
CREATE INDEX idx_inventory_item_code ON inventory(item_code);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_inventory_id ON purchase_orders(inventory_id);
CREATE INDEX idx_purchase_orders_received_date ON purchase_orders(received_date);
CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_contact_id ON orders(contact_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_inventory_id ON order_items(inventory_id);
```

## 3. Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. **Setup BetterAuth with Supabase**
   - Install and configure BetterAuth
   - Setup Supabase project and database
   - Implement email/password authentication

2. **Database Schema Implementation**
   - Create core tables and relationships
   - Setup RLS policies
   - Create database functions and triggers

3. **Basic User Management**
   - Registration and login flows
   - Email verification
   - Password reset functionality

### Phase 2: Multi-Tenancy (Week 3-4)
1. **Tenant Management**
   - Tenant creation and management
   - User invitation system
   - Role-based access control

2. **Authentication Enhancement**
   - Social login integration
   - Magic link authentication
   - Phone OTP implementation

### Phase 3: Core Features (Week 5-8)
1. **Contact Management (CRM)**
   - Contact CRUD operations
   - Import/export functionality
   - Advanced filtering and search

2. **Store & Location Management**
   - Multi-location support
   - Store-specific inventory
   - Location-based reporting

3. **Inventory Management**
   - Product catalog with categories
   - Stock level tracking
   - Supplier management
   - Purchase order processing

4. **Order Management**
   - Quote generation
   - Order processing
   - Invoice creation
   - Integration with inventory

### Phase 4: HR & Operations (Week 9-12)
1. **Employee Management**
   - Employee profiles and hierarchy
   - Department and position management
   - Face recognition setup (optional)

2. **Attendance System**
   - Check-in/check-out functionality
   - Face recognition integration
   - Attendance reports and analytics
   - Manual entry and approvals

3. **Task Management (PPE)**
   - Task creation and assignment
   - Progress tracking
   - Safety requirements tracking
   - Completion reporting

4. **Machinery & Equipment**
   - Equipment catalog
   - Maintenance scheduling
   - Usage tracking
   - Assignment management

### Phase 5: Advanced Features (Week 13-16)
1. **Analytics & Reporting**
   - Sales analytics
   - Inventory analytics
   - HR analytics (attendance, productivity)
   - Equipment utilization reports

2. **Notifications & Alerts**
   - Low stock alerts
   - Maintenance reminders
   - Task deadline notifications
   - Attendance anomaly alerts

3. **Mobile App Enhancements**
   - Barcode scanning for inventory
   - Face recognition for attendance
   - Offline task management
   - Push notifications

## 4. Future Extensibility

### 4.1 Planned Enhancements
1. **WhatsApp Integration**
   - WhatsApp Business API
   - OTP via WhatsApp
   - Customer communication
   - Task notifications via WhatsApp

2. **Advanced Face Recognition**
   - Facial attendance system
   - Anti-spoofing measures
   - Multiple face registration
   - Attendance photo verification

3. **Barcode & QR Code Integration**
   - Inventory item scanning
   - Equipment tracking
   - Task completion verification
   - Asset management

4. **Advanced Analytics**
   - Business intelligence dashboards
   - Predictive analytics for inventory
   - Employee productivity analytics
   - Equipment utilization optimization
   - Custom reporting with charts

5. **API & Integrations**
   - REST API for third-party integrations
   - Webhook support for real-time updates
   - Zapier integration for automation
   - Integration with accounting software

6. **Enterprise Features**
   - Custom workflows for approvals
   - Advanced role-based permissions
   - Comprehensive audit logging
   - Multi-currency support
   - Advanced reporting with exports

7. **IoT & Equipment Integration**
   - Equipment sensor data integration
   - Predictive maintenance based on usage
   - Real-time equipment monitoring
   - Automated maintenance scheduling

8. **Mobile App Enhancements**
   - Offline-first architecture
   - Camera integration for documentation
   - GPS tracking for field tasks
   - Voice notes for task updates
   - Push notifications for critical alerts

### 4.2 Scalability Considerations
- **Database Sharding**: For large enterprise clients
- **Microservices**: Split into domain-specific services
- **CDN**: Global content delivery
- **Caching**: Redis for session and data caching
- **Load Balancing**: Multiple server instances

### 4.3 Performance Optimization
- **Database Query Optimization**
- **Image Optimization**: Next.js Image component
- **Bundle Splitting**: Code splitting and lazy loading
- **Service Workers**: For offline functionality

## 5. Security & Compliance

### 5.1 Data Protection
- **Encryption at Rest**: Supabase automatic encryption
- **Encryption in Transit**: HTTPS/TLS
- **Data Anonymization**: For analytics
- **Data Retention**: Configurable retention policies

### 5.2 Compliance
- **GDPR Compliance**: Data portability and deletion
- **SOC 2**: Through Supabase compliance
- **ISO 27001**: Security management standards
- **Data Residency**: Regional data storage options

## 6. Development Environment Setup

### 6.1 Required Dependencies
```json
{
  "dependencies": {
    "better-auth": "^1.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.2.0",
    "nodemailer": "^6.9.0",
    "twilio": "^4.19.0",
    "zod": "^3.22.0"
  }
}
```

### 6.2 Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# BetterAuth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Social Auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 7. Testing Strategy

### 7.1 Unit Testing
- Auth functions and utilities
- Database operations
- API endpoints

### 7.2 Integration Testing
- Auth flows end-to-end
- Database transactions
- Third-party integrations

### 7.3 E2E Testing
- User registration and login
- Core business workflows
- Mobile responsiveness

## 8. Deployment Strategy

### 8.1 Staging Environment
- Vercel preview deployments
- Supabase branch environments
- Test data and scenarios

### 8.2 Production Environment
- Vercel production deployment
- Supabase production database
- Domain configuration and SSL
- Monitoring and alerting

## 9. Monitoring & Analytics

### 9.1 Application Monitoring
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- User analytics (PostHog)

### 9.2 Database Monitoring
- Query performance
- Connection pooling
- Backup verification

## 10. Documentation

### 10.1 User Documentation
- Getting started guide
- Feature documentation
- Video tutorials

### 10.2 Developer Documentation
- API documentation
- Database schema
- Deployment guides

---

## Next Steps

1. **Review and Approval**: Please review this plan and provide feedback
2. **Environment Setup**: Create Supabase project and configure environment
3. **Phase 1 Implementation**: Begin with authentication setup
4. **Iterative Development**: Implement features incrementally with testing

This plan provides a comprehensive roadmap for building a scalable, secure, and feature-rich ERP & CRM solution for MSMEs. The modular approach allows for iterative development and future enhancements while maintaining code quality and security standards.
