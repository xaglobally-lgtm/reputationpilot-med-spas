-- ================================================================
-- APP TEMPLATE DATABASE SCHEMA
-- ================================================================
-- This schema is designed to be copied into the shared "API Verifier LIVE"
-- Supabase project. When cloning for a new app, replace all instances of
-- "reputationpilot_med_spas_" with your app's namespace (e.g., "myreputationpilot_med_spas_", "watchdog_", "foresite_")
-- 
-- Copy the entire contents and paste into Supabase SQL Editor.
-- ================================================================

-- Users table (auth/identity)
CREATE TABLE IF NOT EXISTS reputationpilot_med_spas_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'billing_admin'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- API Keys for programmatic access
CREATE TABLE IF NOT EXISTS reputationpilot_med_spas_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES reputationpilot_med_spas_users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  prefix VARCHAR(20), -- e.g., "sk_live_", "sk_test_"
  rate_limit INTEGER DEFAULT 100, -- requests per minute
  scopes TEXT[] DEFAULT '{"read", "write"}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Audit log for all significant actions
CREATE TABLE IF NOT EXISTS reputationpilot_med_spas_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES reputationpilot_med_spas_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'api_call'
  resource_type VARCHAR(50), -- 'user', 'api_key', 'payment', etc.
  resource_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Error tracking (for alerts to xaglobally@gmail.com)
CREATE TABLE IF NOT EXISTS reputationpilot_med_spas_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code VARCHAR(50),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}', -- request info, user_id, etc.
  severity VARCHAR(20) DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Metered usage (for billing, rate limiting, analytics)
CREATE TABLE IF NOT EXISTS reputationpilot_med_spas_metered_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES reputationpilot_med_spas_users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES reputationpilot_med_spas_api_keys(id) ON DELETE SET NULL,
  operation VARCHAR(100) NOT NULL, -- 'api_call', 'storage_write', 'compute_sec'
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'count', -- 'count', 'bytes', 'seconds', 'requests'
  tier VARCHAR(50) DEFAULT 'standard', -- 'standard', 'pro', 'enterprise'
  cost DECIMAL(10, 4), -- calculated from tier
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health check / heartbeat tracking (for uptime monitoring)
CREATE TABLE IF NOT EXISTS reputationpilot_med_spas_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(100) NOT NULL, -- 'frontend', 'backend', 'database'
  status VARCHAR(20) DEFAULT 'healthy', -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- INDEXES (for performance)
-- ================================================================

CREATE INDEX idx_reputationpilot_med_spas_users_email ON reputationpilot_med_spas_users(email);
CREATE INDEX idx_reputationpilot_med_spas_users_role ON reputationpilot_med_spas_users(role);
CREATE INDEX idx_reputationpilot_med_spas_api_keys_user_id ON reputationpilot_med_spas_api_keys(user_id);
CREATE INDEX idx_reputationpilot_med_spas_api_keys_key_hash ON reputationpilot_med_spas_api_keys(key_hash);
CREATE INDEX idx_reputationpilot_med_spas_audit_log_user_id ON reputationpilot_med_spas_audit_log(user_id);
CREATE INDEX idx_reputationpilot_med_spas_audit_log_action ON reputationpilot_med_spas_audit_log(action);
CREATE INDEX idx_reputationpilot_med_spas_audit_log_created_at ON reputationpilot_med_spas_audit_log(created_at);
CREATE INDEX idx_reputationpilot_med_spas_errors_severity ON reputationpilot_med_spas_errors(severity);
CREATE INDEX idx_reputationpilot_med_spas_errors_resolved ON reputationpilot_med_spas_errors(resolved);
CREATE INDEX idx_reputationpilot_med_spas_errors_created_at ON reputationpilot_med_spas_errors(created_at);
CREATE INDEX idx_reputationpilot_med_spas_metered_usage_user_id ON reputationpilot_med_spas_metered_usage(user_id);
CREATE INDEX idx_reputationpilot_med_spas_metered_usage_operation ON reputationpilot_med_spas_metered_usage(operation);
CREATE INDEX idx_reputationpilot_med_spas_metered_usage_created_at ON reputationpilot_med_spas_metered_usage(created_at);
CREATE INDEX idx_reputationpilot_med_spas_health_checks_service ON reputationpilot_med_spas_health_checks(service);
CREATE INDEX idx_reputationpilot_med_spas_health_checks_created_at ON reputationpilot_med_spas_health_checks(created_at DESC);

-- ================================================================
-- ROW-LEVEL SECURITY (RLS)
-- Users can only see/modify their own data
-- ================================================================

ALTER TABLE reputationpilot_med_spas_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputationpilot_med_spas_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputationpilot_med_spas_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputationpilot_med_spas_metered_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON reputationpilot_med_spas_users
  FOR SELECT USING (auth.uid()::text = id::text OR current_user = 'postgres');

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON reputationpilot_med_spas_users
  FOR UPDATE USING (auth.uid()::text = id::text OR current_user = 'postgres');

-- Users can only view their own API keys
CREATE POLICY "Users can view own API keys" ON reputationpilot_med_spas_api_keys
  FOR SELECT USING (auth.uid()::text = user_id::text OR current_user = 'postgres');

-- Users can only view their own audit log
CREATE POLICY "Users can view own audit log" ON reputationpilot_med_spas_audit_log
  FOR SELECT USING (auth.uid()::text = user_id::text OR current_user = 'postgres');

-- Users can only view their own metered usage
CREATE POLICY "Users can view own metered usage" ON reputationpilot_med_spas_metered_usage
  FOR SELECT USING (auth.uid()::text = user_id::text OR current_user = 'postgres');

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION reputationpilot_med_spas_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reputationpilot_med_spas_users_update_updated_at BEFORE UPDATE ON reputationpilot_med_spas_users
FOR EACH ROW EXECUTE FUNCTION reputationpilot_med_spas_update_updated_at_column();

-- Log user actions to audit_log
CREATE OR REPLACE FUNCTION reputationpilot_med_spas_log_user_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reputationpilot_med_spas_audit_log (user_id, action, resource_type, resource_id, old_value, new_value)
  VALUES (
    COALESCE(auth.uid(), NULL)::uuid,
    TG_ARGV[0],
    TG_TABLE_NAME,
    NEW.id::text,
    TO_JSONB(OLD),
    TO_JSONB(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SAMPLE DATA (optional, delete for production)
-- ================================================================
-- Uncomment to seed initial test data
-- INSERT INTO reputationpilot_med_spas_users (email, password_hash, first_name, last_name, role)
-- VALUES ('admin@example.com', 'hashed_password', 'Admin', 'User', 'admin');
