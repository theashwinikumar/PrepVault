-- Enable RLS on all tables

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- Public can view subjects

CREATE POLICY "Public can view subjects"
ON public.subjects
FOR SELECT
TO anon, authenticated
USING (true);


-- Public can view topics

CREATE POLICY "Public can view topics"
ON public.topics
FOR SELECT
TO anon, authenticated
USING (true);


-- Public can view companies

CREATE POLICY "Public can view companies"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (true);


-- Public can view question sources

CREATE POLICY "Public can view question sources"
ON public.question_sources
FOR SELECT
TO anon, authenticated
USING (true);


-- Public can view published questions only

CREATE POLICY "Public can view published questions"
ON public.questions
FOR SELECT
TO anon, authenticated
USING (status = 'published');


-- Public can view companies associated with published questions

CREATE POLICY "Public can view published question companies"
ON public.question_companies
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.questions q
        WHERE q.id = question_id
        AND q.status = 'published'
    )
);


-- Grant read permissions

GRANT SELECT ON
    public.subjects,
    public.topics,
    public.companies,
    public.question_sources,
    public.questions,
    public.question_companies
TO anon, authenticated;