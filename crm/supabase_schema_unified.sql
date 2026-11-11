-- ============================================================================
-- KEYSTONE OVERSEAS UNIFIED CRM SCHEMA (SUPABASE / POSTGRESQL)
-- Covers: PIN Auth, B2B Telecalling, Quota Leasing, Student Intake, Call Logs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS & COUNSELORS TABLE (PIN-Based Authentication)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin VARCHAR(10) UNIQUE NOT NULL, -- 4-digit terminal/counselor PIN
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'telecaller'
        CHECK (role IN ('admin', 'counselor', 'telecaller', 'partner')),
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Users (Admin + Callers)
INSERT INTO public.users (pin, name, role, phone)
VALUES 
    ('1001', 'Hasibul Munim', 'admin', '+8801941646278'),
    ('2001', 'Senior Counselor', 'counselor', '+8801700000001'),
    ('3001', 'Caller 1 (East)', 'telecaller', '+8801700000002'),
    ('3002', 'Caller 2 (North)', 'telecaller', '+8801700000003'),
    ('3003', 'Caller 3 (South)', 'telecaller', '+8801700000004')
ON CONFLICT (pin) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. B2B PARTNERS (Institutional Language & Coaching Centers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2b_partners (
    id VARCHAR(50) PRIMARY KEY, -- Supports stable IDs e.g. 'center-0001' or UUID
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_e164 VARCHAR(30),
    carrier VARCHAR(50),
    whatsapp_status VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN'
        CHECK (whatsapp_status IN ('ACTIVE', 'VERIFIED_ACTIVE', 'INACTIVE', 'UNKNOWN')),
    whatsapp_type VARCHAR(30)
        CHECK (whatsapp_type IN ('STANDARD_ACCOUNT', 'BUSINESS_ACCOUNT', NULL)),
    whatsapp_business_name TEXT,
    whatsapp_link TEXT,
    facebook_url TEXT,
    contact_person VARCHAR(255),
    designation VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'cold'
        CHECK (status IN ('eager', 'follow_up', 'cold', 'partnered')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('High', 'Medium', 'Low')),
    assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    lease_expires_at TIMESTAMPTZ, -- Concurrency lock for caller reservation batches
    commission_upfront NUMERIC(10,2) NOT NULL DEFAULT 2000.00, -- BDT 2,000 upfront
    commission_bonus NUMERIC(10,2) NOT NULL DEFAULT 20000.00,   -- BDT 15k-25k post-visa
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. B2B CALL LOGS (Normalized Partner Call & Outreach History)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2b_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id VARCHAR(50) NOT NULL REFERENCES public.b2b_partners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL
        CHECK (status IN ('eager', 'follow_up', 'cold', 'partnered', 'no_answer', 'invalid_number')),
    notes TEXT NOT NULL,
    callback_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. STUDENTS (Candidate Profiles & Consultation Dossiers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    dob DATE,
    district VARCHAR(100) NOT NULL,
    academic_level VARCHAR(50) DEFAULT 'Bachelor',
    ssc_year INTEGER,
    ssc_gpa NUMERIC(3,2) CHECK (ssc_gpa >= 0.0 AND ssc_gpa <= 5.0),
    hsc_year INTEGER,
    gpa NUMERIC(3,2) CHECK (gpa >= 0.0 AND gpa <= 5.0),
    study_gap_years INTEGER,
    english_test VARCHAR(20) NOT NULL DEFAULT 'none'
        CHECK (english_test IN ('none', 'ielts', 'pte', 'duolingo', 'moi')),
    test_score NUMERIC(4,1),
    has_moi_certificate BOOLEAN NOT NULL DEFAULT FALSE,
    budget_eur NUMERIC(10,2) DEFAULT 3500.00,
    discipline VARCHAR(100) DEFAULT 'All',
    corridor_preference VARCHAR(100) NOT NULL DEFAULT 'All'
        CHECK (corridor_preference IN ('All', 'South Cyprus', 'South Korea', 'Hungary', 'Romania', 'Malaysia')),
    stage1_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    stage1_fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stage2_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    stage2_fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'new_inquiry'
        CHECK (status IN (
            'new_inquiry', 
            'follow_up_scheduled', 
            'visited_hq', 
            'stage1_file_opened', 
            'visa_lodged', 
            'visa_approved', 
            'enrolled', 
            'rejected', 
            'archived'
        )),
    referred_by_partner_id VARCHAR(50) REFERENCES public.b2b_partners(id) ON DELETE SET NULL,
    assigned_counselor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. STUDENT CALL LOGS (Student Counseling & Follow-Up History)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT NOT NULL,
    callback_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_b2b_partners_district ON public.b2b_partners(district);
CREATE INDEX IF NOT EXISTS idx_b2b_partners_status ON public.b2b_partners(status);
CREATE INDEX IF NOT EXISTS idx_b2b_partners_lease ON public.b2b_partners(assigned_to_user_id, lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_b2b_call_logs_partner ON public.b2b_call_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_b2b_call_logs_callback ON public.b2b_call_logs(callback_date);

CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);
CREATE INDEX IF NOT EXISTS idx_students_district ON public.students(district);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_counselor ON public.students(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_students_partner ON public.students(referred_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_student_call_logs_student ON public.student_call_logs(student_id);

-- ----------------------------------------------------------------------------
-- 7. CONCURRENCY LEASE RPC (Prevents Telecaller Dialing Collisions)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lease_b2b_batch(
    p_user_id UUID,
    p_batch_size INT DEFAULT 30,
    p_lease_minutes INT DEFAULT 45,
    p_district TEXT DEFAULT NULL
)
RETURNS SETOF public.b2b_partners
LANGUAGE plpgsql
AS $$
DECLARE
    v_expires_at TIMESTAMPTZ := NOW() + (p_lease_minutes || ' minutes')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH candidate_batch AS (
        SELECT id
        FROM public.b2b_partners
        WHERE (assigned_to_user_id IS NULL OR lease_expires_at < NOW())
          AND status IN ('cold', 'follow_up')
          AND (p_district IS NULL OR district = p_district)
        ORDER BY 
            CASE status WHEN 'follow_up' THEN 1 ELSE 2 END,
            id ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.b2b_partners p
    SET 
        assigned_to_user_id = p_user_id,
        lease_expires_at = v_expires_at,
        updated_at = NOW()
    FROM candidate_batch cb
    WHERE p.id = cb.id
    RETURNING p.*;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) & REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on b2b_partners" ON public.b2b_partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on b2b_call_logs" ON public.b2b_call_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on student_call_logs" ON public.student_call_logs FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_partners;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_call_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_call_logs;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
