-- ============================================================================
-- KEYSTONE OVERSEAS UNIFIED CRM SCHEMA (SUPABASE / POSTGRESQL)
-- Redesigned for Cloudflare Pages & Supabase B2B Outreach
-- Covers: 4-Digit PIN Auth, B2B Telecalling, Concurrency Leasing,
--         Truecaller Enrichment, Owner Proposal Review Queue & WhatsApp Dispatch
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (4-Digit PIN Authentication & Hub Assignments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'telecaller'
        CHECK (role IN ('admin', 'telecaller', 'counselor', 'partner')),
    hub VARCHAR(50) NOT NULL DEFAULT 'ALL', -- 'CALLER_1', 'CALLER_2', 'CALLER_3', 'ALL'
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Users (Admins & 3 Hub Callers with Deterministic UUIDs)
INSERT INTO public.users (id, pin, name, role, hub, phone)
VALUES 
    ('00000000-0000-0000-0000-000000001001'::uuid, '1001', 'Hasibul Munim (Owner)', 'admin', 'ALL', '+8801941646278'),
    ('00000000-0000-0000-0000-000000001002'::uuid, '1002', 'Co-Owner (Admin)', 'admin', 'ALL', '+8801941646279'),
    ('00000000-0000-0000-0000-000000003001'::uuid, '3001', 'Caller 1 (Eastern Hub)', 'telecaller', 'CALLER_1', '+8801700000002'),
    ('00000000-0000-0000-0000-000000003002'::uuid, '3002', 'Caller 2 (Northern Hub)', 'telecaller', 'CALLER_2', '+8801700000003'),
    ('00000000-0000-0000-0000-000000003003'::uuid, '3003', 'Caller 3 (Southern Hub)', 'telecaller', 'CALLER_3', '+8801700000004')
ON CONFLICT (pin) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    hub = EXCLUDED.hub,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 2. B2B PARTNERS (Institutional Language & Coaching Centers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2b_partners (
    id VARCHAR(50) PRIMARY KEY, -- 'center-0001' to 'center-0859'
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_e164 VARCHAR(30),
    carrier VARCHAR(50),
    url TEXT,
    whatsapp_status VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN'
        CHECK (whatsapp_status IN ('ACTIVE', 'VERIFIED_ACTIVE', 'INACTIVE', 'UNKNOWN')),
    whatsapp_type VARCHAR(30)
        CHECK (whatsapp_type IN ('STANDARD_ACCOUNT', 'BUSINESS_ACCOUNT', NULL)),
    whatsapp_business_name TEXT,
    whatsapp_link TEXT,
    facebook_url TEXT,
    contact_person VARCHAR(255),
    director_name VARCHAR(255),
    designation VARCHAR(100),
    truecaller_name VARCHAR(255),
    truecaller_resolved_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'cold'
        CHECK (status IN ('cold', 'eager', 'follow_up', 'partnered', 'rejected', 'new')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('High', 'Medium', 'Low')),
    assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_caller_pin VARCHAR(10),
    lease_expires_at TIMESTAMPTZ, -- Concurrency lock for caller batch reservation
    last_contact_at TIMESTAMPTZ,
    follow_up_date TIMESTAMPTZ,
    commission_upfront NUMERIC(10,2) NOT NULL DEFAULT 2000.00, -- BDT 2,000 upfront
    commission_bonus NUMERIC(10,2) NOT NULL DEFAULT 20000.00,   -- BDT 15k-25k post-visa
    notes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. B2B CALL LOGS (Outreach & Disposition History)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2b_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id VARCHAR(50) NOT NULL REFERENCES public.b2b_partners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    caller_pin VARCHAR(10),
    caller_name VARCHAR(255),
    status VARCHAR(30) NOT NULL
        CHECK (status IN ('eager', 'follow_up', 'rejected', 'cold', 'partnered', 'no_answer', 'invalid_number')),
    notes TEXT NOT NULL,
    callback_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PROPOSAL REVIEW QUEUE (Owner Review & Vetting Gate)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proposal_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id VARCHAR(50) NOT NULL REFERENCES public.b2b_partners(id) ON DELETE CASCADE,
    partner_name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    director_name VARCHAR(255),
    submitted_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    submitted_by_caller_name VARCHAR(255),
    submitted_by_caller_pin VARCHAR(10),
    caller_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'dispatched')),
    reviewed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    whatsapp_dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. STUDENTS & STUDENT CALL LOGS (Keystone Candidate Processing)
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
CREATE INDEX IF NOT EXISTS idx_b2b_partners_phone ON public.b2b_partners(phone);
CREATE INDEX IF NOT EXISTS idx_b2b_partners_lease ON public.b2b_partners(assigned_to_user_id, lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_b2b_call_logs_partner ON public.b2b_call_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_b2b_call_logs_caller ON public.b2b_call_logs(caller_pin, created_at);
CREATE INDEX IF NOT EXISTS idx_proposal_queue_status ON public.proposal_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_proposal_queue_partner ON public.proposal_review_queue(partner_id);

-- ----------------------------------------------------------------------------
-- 7. CONCURRENCY LEASE RPC (Prevents Telecaller Dialing Collisions)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lease_b2b_batch(
    p_user_id UUID DEFAULT NULL,
    p_caller_pin VARCHAR(10) DEFAULT NULL,
    p_batch_size INT DEFAULT 30,
    p_lease_minutes INT DEFAULT 45,
    p_district TEXT DEFAULT NULL,
    p_hub_districts TEXT[] DEFAULT NULL
)
RETURNS SETOF public.b2b_partners
LANGUAGE plpgsql
AS $$
DECLARE
    v_expires_at TIMESTAMPTZ := NOW() + (p_lease_minutes || ' minutes')::INTERVAL;
    v_resolved_user_id UUID := p_user_id;
BEGIN
    IF v_resolved_user_id IS NULL AND p_caller_pin IS NOT NULL THEN
        SELECT id INTO v_resolved_user_id FROM public.users WHERE pin = p_caller_pin LIMIT 1;
    END IF;

    RETURN QUERY
    WITH candidate_batch AS (
        SELECT id
        FROM public.b2b_partners
        WHERE (
            assigned_to_user_id IS NULL 
            OR lease_expires_at < NOW()
            OR (v_resolved_user_id IS NOT NULL AND assigned_to_user_id = v_resolved_user_id)
            OR (p_caller_pin IS NOT NULL AND assigned_caller_pin = p_caller_pin)
        )
          AND status IN ('cold', 'follow_up', 'new')
          AND (p_district IS NULL OR district = p_district)
          AND (p_hub_districts IS NULL OR district = ANY(p_hub_districts))
        ORDER BY 
            CASE status WHEN 'follow_up' THEN 1 WHEN 'cold' THEN 2 ELSE 3 END,
            id ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.b2b_partners p
    SET 
        assigned_to_user_id = COALESCE(v_resolved_user_id, p.assigned_to_user_id),
        assigned_caller_pin = COALESCE(p_caller_pin, p.assigned_caller_pin),
        lease_expires_at = v_expires_at,
        updated_at = NOW()
    FROM candidate_batch cb
    WHERE p.id = cb.id
    RETURNING p.*;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. DATA BACKFILL: MIGRATE FROM LEGACY b2b_centers IF PRESENT
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'b2b_centers'
    ) THEN
        INSERT INTO public.b2b_partners (
            id, name, district, phone, url, status, priority, 
            notes, updated_at
        )
        SELECT 
            id,
            name,
            district,
            phone,
            COALESCE(url, link),
            LOWER(COALESCE(status, 'cold')),
            COALESCE(priority, 'Medium'),
            COALESCE(notes, '[]'::jsonb),
            COALESCE(updated_at, NOW())
        FROM public.b2b_centers
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            district = EXCLUDED.district,
            phone = EXCLUDED.phone,
            url = EXCLUDED.url,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority,
            notes = EXCLUDED.notes,
            updated_at = EXCLUDED.updated_at;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write on users" ON public.users;
CREATE POLICY "Allow public read/write on users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on b2b_partners" ON public.b2b_partners;
CREATE POLICY "Allow public read/write on b2b_partners" ON public.b2b_partners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on b2b_call_logs" ON public.b2b_call_logs;
CREATE POLICY "Allow public read/write on b2b_call_logs" ON public.b2b_call_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on proposal_review_queue" ON public.proposal_review_queue;
CREATE POLICY "Allow public read/write on proposal_review_queue" ON public.proposal_review_queue FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on students" ON public.students;
CREATE POLICY "Allow public read/write on students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on student_call_logs" ON public.student_call_logs;
CREATE POLICY "Allow public read/write on student_call_logs" ON public.student_call_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 10. REALTIME REPLICATION PUBLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_partners;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.b2b_call_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_review_queue;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
