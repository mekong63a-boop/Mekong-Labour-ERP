-- 1. Enable DELETE for authenticated users on trainees table (admin only in code)
CREATE POLICY "Enable delete for authenticated users on trainees"
ON public.trainees
FOR DELETE
TO authenticated
USING (true);

-- 2. Enable DELETE for authenticated users on classes table
CREATE POLICY "Enable delete for authenticated users on classes"
ON public.classes
FOR DELETE
TO authenticated
USING (true);

-- 3. Create test_scores table for storing test results
CREATE TABLE public.test_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    max_score NUMERIC NOT NULL DEFAULT 100,
    score NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on test_scores
ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_scores
CREATE POLICY "Enable read access for all users on test_scores"
ON public.test_scores
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users on test_scores"
ON public.test_scores
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on test_scores"
ON public.test_scores
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on test_scores"
ON public.test_scores
FOR DELETE
TO authenticated
USING (true);

-- 4. Create trainee_reviews table for reviews and blacklist
CREATE TABLE public.trainee_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    review_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'behavior', 'academic', 'blacklist'
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    is_blacklisted BOOLEAN NOT NULL DEFAULT false,
    blacklist_reason TEXT,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trainee_reviews
ALTER TABLE public.trainee_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainee_reviews
CREATE POLICY "Enable read access for all users on trainee_reviews"
ON public.trainee_reviews
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users on trainee_reviews"
ON public.trainee_reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on trainee_reviews"
ON public.trainee_reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on trainee_reviews"
ON public.trainee_reviews
FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_test_scores_class_id ON public.test_scores(class_id);
CREATE INDEX idx_test_scores_trainee_id ON public.test_scores(trainee_id);
CREATE INDEX idx_trainee_reviews_trainee_id ON public.trainee_reviews(trainee_id);
CREATE INDEX idx_trainee_reviews_class_id ON public.trainee_reviews(class_id);
CREATE INDEX idx_trainee_reviews_is_blacklisted ON public.trainee_reviews(is_blacklisted) WHERE is_blacklisted = true;