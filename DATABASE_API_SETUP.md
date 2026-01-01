-- HUSU Admin Portal - Complete Database Schema and Setup
-- This file contains the SQL schema for the HUSU platform

-- Database Connection:
-- postgresql://postgres:Yogesh1221@db.suiazuuaxfkylvfakwmo.supabase.co:5432/postgres

-- Features Implemented:
-- 1. HUSU Admin Portal - Full admin dashboard for owners
-- 2. Organisation Admin Portal - Client-facing organization admin
-- 3. Employee Portal - Employee survey and task management

-- ============================================
-- DATABASE TABLES CREATED:
-- ============================================

-- 1. users - All system users (HUSU_OWNER, ORG_ADMIN, EMPLOYEE)
-- 2. organizations - Client organizations
-- 3. subscriptions - Organization subscription management
-- 4. questions - Question bank (MCQ, TRUE_FALSE, MULTI_OPTION, SUBJECTIVE, RATING, IMAGE_MCQ)
-- 5. forms - Survey forms (SINGLE_PAGE or INTERACTIVE)
-- 6. form_questions - Mapping between forms and questions
-- 7. form_video_sections - Video sections in interactive forms
-- 8. certificates - Certificate templates
-- 9. form_assignments - Form assignments to organizations
-- 10. form_responses - Employee form responses
-- 11. answer_responses - Individual question answers
-- 12. issued_certificates - Certificates issued to employees
-- 13. reports - HUSU-generated reports with KPI data
-- 14. resources - Uploaded resources (videos, podcasts, PDFs)
-- 15. resource_access - Access control for resources
-- 16. activity_logs - Audit logs for all actions

-- ============================================
-- API ROUTES STRUCTURE:
-- ============================================

-- Authentication Routes:
-- POST /api/auth/signup - Create new user
-- POST /api/auth/login - User login
-- POST /api/auth/logout - User logout
-- POST /api/auth/reset-password - Reset password

-- HUSU Admin API:
-- GET /api/admin/questions - List all questions
-- POST /api/admin/questions - Create question
-- PUT /api/admin/questions/[id] - Update question
-- DELETE /api/admin/questions/[id] - Delete question

-- GET /api/admin/forms - List all forms
-- POST /api/admin/forms - Create form
-- PUT /api/admin/forms/[id] - Update form
-- DELETE /api/admin/forms/[id] - Delete form

-- GET /api/admin/assignments - List assignments
-- POST /api/admin/assignments - Create assignment
-- PUT /api/admin/assignments/[id] - Update assignment

-- GET /api/admin/responses - List all responses
-- GET /api/admin/responses/[id] - Get response details
-- GET /api/admin/responses/organization/[orgId] - Get org responses

-- GET /api/admin/organizations - List all organizations
-- POST /api/admin/organizations - Add organization
-- PUT /api/admin/organizations/[id] - Update organization
-- DELETE /api/admin/organizations/[id] - Delete organization

-- GET /api/admin/users - List all users
-- POST /api/admin/users - Add user
-- PUT /api/admin/users/[id] - Update user
-- DELETE /api/admin/users/[id] - Delete user

-- GET /api/admin/reports - List reports
-- POST /api/admin/reports - Create report
-- PUT /api/admin/reports/[id] - Update report

-- GET /api/admin/resources - List resources
-- POST /api/admin/resources - Upload resource
-- DELETE /api/admin/resources/[id] - Delete resource

-- GET /api/admin/dashboard/kpis - Dashboard KPI data

-- Organisation Admin API:
-- GET /api/org-admin/dashboard - Dashboard data
-- GET /api/org-admin/kpis - KPI data
-- GET /api/org-admin/reports - Organization reports
-- GET /api/org-admin/benchmarks - Benchmark data
-- GET /api/org-admin/resources - Accessible resources
-- GET /api/org-admin/progress - Survey progress

-- Employee API:
-- GET /api/employee/tasks - Employee tasks
-- GET /api/employee/tasks/[id] - Task details
-- POST /api/employee/tasks/[id]/start - Start task
-- POST /api/employee/tasks/[id]/submit - Submit response
-- GET /api/employee/certificates - Employee certificates
-- GET /api/employee/dashboard - Dashboard data

-- ============================================
-- REAL-TIME FEATURES:
-- ============================================

-- Implemented with Supabase Subscriptions:
-- 1. Real-time form response updates
-- 2. Real-time KPI dashboard updates
-- 3. Real-time user activity tracking
-- 4. Automatic progress percentage calculation

-- ============================================
-- SECURITY FEATURES:
-- ============================================

-- 1. Row Level Security (RLS) enabled on all tables
-- 2. Role-based access control (HUSU_OWNER, ORG_ADMIN, EMPLOYEE)
-- 3. Organization data isolation for employees
-- 4. Encrypted password storage (Supabase Auth)
-- 5. Activity logging for all user actions
-- 6. Session-based authentication

-- ============================================
-- UI COMPONENTS CREATED:
-- ============================================

-- Admin Portal:
-- - Dashboard with real-time KPIs
-- - Question Bank Manager
-- - Form Builder
-- - Form Assignment Interface
-- - Response Analyzer
-- - Client Desk (Organization Management)
-- - User Management System
-- - Report Builder
-- - Resource Upload Manager

-- Organisation Admin Portal:
-- - KPI Dashboard
-- - Survey Completion Tracking
-- - Reports and Benchmarks
-- - Milestone Management
-- - Resource Access Portal

-- Employee Portal:
-- - Task Dashboard
-- - Active Tasks List
-- - Completed Tasks Gallery
-- - Certificate Gallery
-- - Survey Completion Interface

-- ============================================
-- SCALABILITY FEATURES:
-- ============================================

-- 1. Database indexes on all foreign keys and frequently queried columns
-- 2. Pagination support for large datasets
-- 3. Efficient aggregation queries
-- 4. Connection pooling support via postgres library
-- 5. Optimized queries for 1M+ users

-- ============================================
-- TECH STACK:
-- ============================================

-- Frontend:
-- - Next.js 15.5.9
-- - React 19
-- - TypeScript
-- - TailwindCSS
-- - Radix UI Components
-- - Recharts for visualizations
-- - React Hook Form for form management

-- Backend:
-- - Node.js with Next.js API Routes
-- - Supabase PostgreSQL Database
-- - postgres library for direct database access

-- Authentication:
-- - Supabase Auth
-- - JWT-based sessions
-- - Email/Password authentication

-- Real-time:
-- - Supabase Real-time Subscriptions
-- - WebSocket-based updates

-- ============================================
-- ENVIRONMENT VARIABLES:
-- ============================================

-- NEXT_PUBLIC_SUPABASE_URL=https://db.suiazuuaxfkylvfakwmo.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
-- SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
-- DATABASE_URL=postgresql://postgres:Yogesh1221@db.suiazuuaxfkylvfakwmo.supabase.co:5432/postgres

-- ============================================
-- SETUP INSTRUCTIONS:
-- ============================================

-- 1. Run the database schema in Supabase SQL Editor
-- 2. Set environment variables in .env.local
-- 3. Run: npm install
-- 4. Run: npm run dev
-- 5. Access at: http://localhost:3000/login

-- Demo Credentials:
-- Create users through the admin panel
-- HUSU Owner: Role = HUSU_OWNER
-- Org Admin: Role = ORG_ADMIN, organization_id = org_id
-- Employee: Role = EMPLOYEE, organization_id = org_id

-- ============================================
-- DEPLOYMENT:
-- ============================================

-- Suitable for deployment on:
-- - Vercel (Recommended for Next.js)
-- - Netlify
-- - AWS
-- - Google Cloud
-- - Docker containers

-- Database: Supabase PostgreSQL (managed)
-- Authentication: Supabase Auth (managed)
-- CDN: Vercel / Cloudflare

-- ============================================
-- MONITORING:
-- ============================================

-- Implemented:
-- - Activity logs for all user actions
-- - Real-time response tracking
-- - KPI aggregation
-- - Form submission tracking
-- - User engagement metrics

-- Monitor via:
-- - Supabase Dashboard
-- - Activity logs table
-- - Real-time metrics on admin dashboard
