-- =====================================================
-- PTQB HUB DATABASE SCHEMA
-- PostgreSQL / Supabase
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================
-- 1. SUBJECTS TABLE
-- =====================================================

CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    slug VARCHAR(100) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- 2. COMPANIES TABLE
-- =====================================================

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL UNIQUE,

    slug VARCHAR(150) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- 3. QUESTION SOURCES TABLE
-- =====================================================

CREATE TABLE public.question_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    source_name VARCHAR(200) NOT NULL,

    source_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- 4. IMPORT BATCHES TABLE
-- =====================================================

CREATE TABLE public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    filename VARCHAR(255),

    total_records INTEGER DEFAULT 0
        CHECK (total_records >= 0),

    valid_records INTEGER DEFAULT 0
        CHECK (valid_records >= 0),

    invalid_records INTEGER DEFAULT 0
        CHECK (invalid_records >= 0),

    duplicate_records INTEGER DEFAULT 0
        CHECK (duplicate_records >= 0),

    inserted_records INTEGER DEFAULT 0
        CHECK (inserted_records >= 0),

    status VARCHAR(50) DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'completed',
                'failed'
            )
        ),

    started_at TIMESTAMPTZ DEFAULT NOW(),

    completed_at TIMESTAMPTZ
);


-- =====================================================
-- 5. TOPICS TABLE
-- =====================================================

CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    subject_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    slug VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_topics_subject
        FOREIGN KEY (subject_id)
        REFERENCES public.subjects(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_topic_slug
        UNIQUE (subject_id, slug),

    CONSTRAINT unique_topic_name
        UNIQUE (subject_id, name),

    -- Required for composite foreign key in questions
    CONSTRAINT unique_topic_id_subject
        UNIQUE (id, subject_id)
);


-- =====================================================
-- 6. QUESTIONS TABLE
-- =====================================================

CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    subject_id UUID NOT NULL,

    topic_id UUID NOT NULL,

    source_id UUID,

    import_batch_id UUID,

    question_text TEXT NOT NULL,

    normalized_text TEXT,

    difficulty VARCHAR(30)
        CHECK (
            difficulty IN (
                'easy',
                'medium',
                'hard'
            )
        ),

    question_type VARCHAR(50)
        CHECK (
            question_type IN (
                'theory',
                'mcq',
                'coding',
                'output_based',
                'multiple_select'
            )
        ),

    answer TEXT,

    explanation TEXT,

    fingerprint VARCHAR(100) UNIQUE,

    status VARCHAR(30) DEFAULT 'published'
        CHECK (
            status IN (
                'draft',
                'published',
                'disabled'
            )
        ),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),


    -- Subject relationship
    CONSTRAINT fk_questions_subject
        FOREIGN KEY (subject_id)
        REFERENCES public.subjects(id)
        ON DELETE RESTRICT,


    -- Topic must belong to the same subject
    CONSTRAINT fk_questions_topic_subject
        FOREIGN KEY (topic_id, subject_id)
        REFERENCES public.topics(id, subject_id)
        ON DELETE RESTRICT,


    -- Question source relationship
    CONSTRAINT fk_questions_source
        FOREIGN KEY (source_id)
        REFERENCES public.question_sources(id)
        ON DELETE SET NULL,


    -- Import batch relationship
    CONSTRAINT fk_questions_import_batch
        FOREIGN KEY (import_batch_id)
        REFERENCES public.import_batches(id)
        ON DELETE SET NULL
);


-- =====================================================
-- 7. QUESTION COMPANIES TABLE
-- Many-to-many relationship
-- =====================================================

CREATE TABLE public.question_companies (
    question_id UUID NOT NULL,

    company_id UUID NOT NULL,

    PRIMARY KEY (question_id, company_id),

    CONSTRAINT fk_question_companies_question
        FOREIGN KEY (question_id)
        REFERENCES public.questions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_question_companies_company
        FOREIGN KEY (company_id)
        REFERENCES public.companies(id)
        ON DELETE CASCADE
);


-- =====================================================
-- 8. PROFILES TABLE
-- Connected to Supabase Authentication
-- =====================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,

    email VARCHAR(255) UNIQUE,

    full_name VARCHAR(150),

    role VARCHAR(30) DEFAULT 'STUDENT'
        CHECK (
            role IN (
                'ADMIN',
                'STUDENT'
            )
        ),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_profiles_auth_user
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);


-- =====================================================
-- INDEXES
-- =====================================================

-- Topics indexes
CREATE INDEX idx_topics_subject_id
ON public.topics(subject_id);


-- Questions indexes
CREATE INDEX idx_questions_subject_id
ON public.questions(subject_id);

CREATE INDEX idx_questions_topic_id
ON public.questions(topic_id);

CREATE INDEX idx_questions_status
ON public.questions(status);

CREATE INDEX idx_questions_difficulty
ON public.questions(difficulty);

CREATE INDEX idx_questions_type
ON public.questions(question_type);

CREATE INDEX idx_questions_source_id
ON public.questions(source_id);

CREATE INDEX idx_questions_import_batch_id
ON public.questions(import_batch_id);


-- Question companies indexes
CREATE INDEX idx_question_companies_company_id
ON public.question_companies(company_id);


-- Full-text search index
CREATE INDEX idx_questions_fulltext
ON public.questions
USING GIN (
    to_tsvector('english', question_text)
);


-- =====================================================
-- UPDATED_AT TRIGGER
-- Automatically updates questions.updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


-- =====================================================
-- END OF PTQB HUB DATABASE SCHEMA
-- =====================================================