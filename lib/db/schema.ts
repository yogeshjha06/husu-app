export const DATABASE_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles enum
CREATE TYPE user_role AS ENUM ('HUSU_OWNER', 'ORG_ADMIN', 'EMPLOYEE');
CREATE TYPE question_type AS ENUM ('MCQ', 'TRUE_FALSE', 'MULTI_OPTION', 'SUBJECTIVE', 'RATING', 'IMAGE_MCQ');
CREATE TYPE form_type AS ENUM ('SINGLE_PAGE', 'INTERACTIVE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE response_status AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL,
  organization_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_name VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  employee_count INT,
  logo_url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add foreign key for users.organization_id
ALTER TABLE users 
ADD CONSTRAINT fk_users_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status subscription_status DEFAULT 'ACTIVE',
  start_date TIMESTAMP DEFAULT now(),
  end_date TIMESTAMP,
  user_limit INT DEFAULT 100,
  active_users INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type question_type NOT NULL,
  options JSONB,
  correct_answer VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_name VARCHAR(255) NOT NULL,
  form_type form_type DEFAULT 'SINGLE_PAGE',
  description TEXT,
  cover_image_url VARCHAR(500),
  logo_url VARCHAR(500),
  template_name VARCHAR(100),
  banner_color VARCHAR(7),
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Form questions mapping
CREATE TABLE form_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  display_order INT NOT NULL,
  section_title VARCHAR(255),
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Form video sections (for interactive forms)
CREATE TABLE form_video_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  video_url VARCHAR(500) NOT NULL,
  section_title VARCHAR(255),
  display_order INT NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT now()
);

-- Certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  template_design JSONB NOT NULL,
  background_color VARCHAR(7),
  text_color VARCHAR(7),
  border_style VARCHAR(50),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Form assignments table
CREATE TABLE form_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP,
  due_date TIMESTAMP,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Form responses table
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_assignment_id UUID NOT NULL REFERENCES form_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status response_status DEFAULT 'PENDING',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  time_spent_seconds INT,
  progress_percentage INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Answer responses table
CREATE TABLE answer_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_value JSONB,
  rating_value INT,
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT now()
);

-- Issued certificates table
CREATE TABLE issued_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  form_response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_url VARCHAR(500),
  issued_at TIMESTAMP DEFAULT now()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  survey_round VARCHAR(50),
  content TEXT,
  pdf_url VARCHAR(500),
  benchmark_data JSONB,
  kpi_data JSONB,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  file_size_bytes BIGINT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Resource access table
CREATE TABLE resource_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_organizations_admin ON organizations(admin_id);
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_questions_creator ON questions(created_by);
CREATE INDEX idx_forms_creator ON forms(created_by);
CREATE INDEX idx_form_questions_form ON form_questions(form_id);
CREATE INDEX idx_form_assignments_organization ON form_assignments(organization_id);
CREATE INDEX idx_form_assignments_form ON form_assignments(form_id);
CREATE INDEX idx_form_responses_assignment ON form_responses(form_assignment_id);
CREATE INDEX idx_form_responses_user ON form_responses(user_id);
CREATE INDEX idx_form_responses_status ON form_responses(status);
CREATE INDEX idx_answer_responses_form_response ON answer_responses(form_response_id);
CREATE INDEX idx_reports_organization ON reports(organization_id);
CREATE INDEX idx_reports_creator ON reports(created_by);
CREATE INDEX idx_resources_uploader ON resources(uploaded_by);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Create RLS Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR role = 'HUSU_OWNER');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Organizations RLS policies
CREATE POLICY "Org data visible to org members and HUSU owner" ON organizations
  FOR SELECT USING (
    admin_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'HUSU_OWNER'
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE organization_id = organizations.id AND id = auth.uid()::uuid
    )
  );

-- Forms RLS policies
CREATE POLICY "Forms visible to creator and org members" ON forms
  FOR SELECT USING (
    created_by = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'HUSU_OWNER'
    ) OR
    EXISTS (
      SELECT 1 FROM form_assignments fa
      JOIN organizations o ON fa.organization_id = o.id
      JOIN users u ON u.organization_id = o.id
      WHERE fa.form_id = forms.id AND u.id = auth.uid()::uuid
    )
  );

-- Form responses RLS policies
CREATE POLICY "Users can view their own responses" ON form_responses
  FOR SELECT USING (
    user_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'HUSU_OWNER'
    )
  );

-- Certificates RLS policies
CREATE POLICY "Users can view their certificates" ON issued_certificates
  FOR SELECT USING (
    user_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'HUSU_OWNER'
    )
  );
`;
