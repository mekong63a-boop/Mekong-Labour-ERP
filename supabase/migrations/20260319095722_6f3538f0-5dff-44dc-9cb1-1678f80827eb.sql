-- Enforce global visibility/modification rules for deleted/locked trainees
-- 1) Helper: active trainee is visible in app
CREATE OR REPLACE FUNCTION public.can_view_trainee_record(_trainee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trainees t
    WHERE t.id = _trainee_id
      AND t.deleted_at IS NULL
  );
$$;

-- 2) Helper: only admin can modify locked trainee; deleted trainee cannot be modified
CREATE OR REPLACE FUNCTION public.can_modify_trainee_record(_trainee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trainees t
    WHERE t.id = _trainee_id
      AND t.deleted_at IS NULL
      AND (
        public.is_admin(auth.uid())
        OR NOT COALESCE(t.is_locked, false)
      )
  );
$$;

-- 3) Trainees policies
ALTER POLICY trainees_select
ON public.trainees
USING (
  can_view('trainees')
  AND deleted_at IS NULL
);

ALTER POLICY trainees_update
ON public.trainees
USING (
  can_update('trainees')
  AND deleted_at IS NULL
  AND (
    NOT COALESCE(is_locked, false)
    OR public.is_admin(auth.uid())
  )
)
WITH CHECK (
  can_update('trainees')
  AND deleted_at IS NULL
  AND (
    NOT COALESCE(is_locked, false)
    OR public.is_admin(auth.uid())
  )
);

ALTER POLICY trainees_delete
ON public.trainees
USING (
  can_delete('trainees')
  AND deleted_at IS NULL
);

-- 4) Child tables with trainee_id: hide deleted trainees + block edit when locked (except admin)

-- education_history
ALTER POLICY education_history_select ON public.education_history
USING (can_view('trainees') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY education_history_insert ON public.education_history
WITH CHECK (can_insert('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY education_history_update ON public.education_history
USING (can_update('trainees') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY education_history_delete ON public.education_history
USING (can_delete('trainees') AND public.can_modify_trainee_record(trainee_id));

-- family_members
ALTER POLICY family_members_select ON public.family_members
USING (can_view('trainees') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY family_members_insert ON public.family_members
WITH CHECK (can_insert('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY family_members_update ON public.family_members
USING (can_update('trainees') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY family_members_delete ON public.family_members
USING (can_delete('trainees') AND public.can_modify_trainee_record(trainee_id));

-- japan_relatives
ALTER POLICY japan_relatives_select ON public.japan_relatives
USING (can_view('trainees') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY japan_relatives_insert ON public.japan_relatives
WITH CHECK (can_insert('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY japan_relatives_update ON public.japan_relatives
USING (can_update('trainees') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY japan_relatives_delete ON public.japan_relatives
USING (can_delete('trainees') AND public.can_modify_trainee_record(trainee_id));

-- work_history
ALTER POLICY work_history_select ON public.work_history
USING (can_view('trainees') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY work_history_insert ON public.work_history
WITH CHECK (can_insert('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY work_history_update ON public.work_history
USING (can_update('trainees') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY work_history_delete ON public.work_history
USING (can_delete('trainees') AND public.can_modify_trainee_record(trainee_id));

-- interview_history
ALTER POLICY interview_history_select ON public.interview_history
USING (can_view('trainees') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY interview_history_insert ON public.interview_history
WITH CHECK (can_insert('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY interview_history_update ON public.interview_history
USING (can_update('trainees') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('trainees') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY interview_history_delete ON public.interview_history
USING (can_delete('trainees') AND public.can_modify_trainee_record(trainee_id));

-- attendance
ALTER POLICY attendance_select ON public.attendance
USING (can_view('education') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY attendance_insert ON public.attendance
WITH CHECK (can_insert('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY attendance_update ON public.attendance
USING (can_update('education') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY attendance_delete ON public.attendance
USING (can_delete('education') AND public.can_modify_trainee_record(trainee_id));

-- enrollment_history
ALTER POLICY enrollment_history_select ON public.enrollment_history
USING (can_view('education') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY enrollment_history_insert ON public.enrollment_history
WITH CHECK (can_insert('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY enrollment_history_update ON public.enrollment_history
USING (can_update('education') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY enrollment_history_delete ON public.enrollment_history
USING (can_delete('education') AND public.can_modify_trainee_record(trainee_id));

-- test_scores
ALTER POLICY test_scores_select ON public.test_scores
USING (can_view('education') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY test_scores_insert ON public.test_scores
WITH CHECK (can_insert('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY test_scores_update ON public.test_scores
USING (can_update('education') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY test_scores_delete ON public.test_scores
USING (can_delete('education') AND public.can_modify_trainee_record(trainee_id));

-- trainee_reviews
ALTER POLICY trainee_reviews_select ON public.trainee_reviews
USING (can_view('education') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY trainee_reviews_insert ON public.trainee_reviews
WITH CHECK (can_insert('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY trainee_reviews_update ON public.trainee_reviews
USING (can_update('education') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('education') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY trainee_reviews_delete ON public.trainee_reviews
USING (can_delete('education') AND public.can_modify_trainee_record(trainee_id));

-- dormitory_residents
ALTER POLICY dormitory_residents_select ON public.dormitory_residents
USING (can_view('dormitory') AND public.can_view_trainee_record(trainee_id));
ALTER POLICY dormitory_residents_insert ON public.dormitory_residents
WITH CHECK (can_insert('dormitory') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY dormitory_residents_update ON public.dormitory_residents
USING (can_update('dormitory') AND public.can_modify_trainee_record(trainee_id))
WITH CHECK (can_update('dormitory') AND public.can_modify_trainee_record(trainee_id));
ALTER POLICY dormitory_residents_delete ON public.dormitory_residents
USING (can_delete('dormitory') AND public.can_modify_trainee_record(trainee_id));