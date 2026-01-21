-- Create RPC function to export trainees report with dynamic columns and filters
-- This function checks permissions and builds dynamic query

CREATE OR REPLACE FUNCTION public.export_trainees_report(
  selected_columns jsonb,
  filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  sql_query text;
  column_list text;
  where_clause text := 'WHERE 1=1';
  has_pii_columns boolean := false;
  can_view_pii boolean;
  col text;
  pii_columns text[] := ARRAY['phone', 'cccd_number', 'passport_number', 'email', 'parent_phone_1', 'parent_phone_2'];
BEGIN
  -- Check menu permission for reports
  IF NOT public.has_menu_permission(auth.uid(), 'reports', 'view') THEN
    RAISE EXCEPTION 'Không có quyền truy cập báo cáo';
  END IF;

  -- Check if any PII columns are selected
  FOR col IN SELECT jsonb_array_elements_text(selected_columns)
  LOOP
    IF col = ANY(pii_columns) THEN
      has_pii_columns := true;
      EXIT;
    END IF;
  END LOOP;

  -- Check PII permission if needed
  IF has_pii_columns THEN
    can_view_pii := public.can_view_trainee_pii();
    IF NOT can_view_pii THEN
      RAISE EXCEPTION 'Không có quyền xem thông tin nhạy cảm (PII)';
    END IF;
  END IF;

  -- Build column list from selected_columns
  SELECT string_agg(
    CASE 
      -- Trainee basic columns
      WHEN col_name = 'trainee_code' THEN 't.trainee_code'
      WHEN col_name = 'full_name' THEN 't.full_name'
      WHEN col_name = 'furigana' THEN 't.furigana'
      WHEN col_name = 'birth_date' THEN 't.birth_date'
      WHEN col_name = 'gender' THEN 't.gender'
      WHEN col_name = 'birthplace' THEN 't.birthplace'
      WHEN col_name = 'ethnicity' THEN 't.ethnicity'
      WHEN col_name = 'marital_status' THEN 't.marital_status'
      WHEN col_name = 'education_level' THEN 't.education_level'
      WHEN col_name = 'trainee_type' THEN 't.trainee_type'
      
      -- Contact info (PII)
      WHEN col_name = 'phone' THEN 't.phone'
      WHEN col_name = 'email' THEN 't.email'
      WHEN col_name = 'parent_phone_1' THEN 't.parent_phone_1'
      WHEN col_name = 'parent_phone_2' THEN 't.parent_phone_2'
      
      -- ID documents (PII)
      WHEN col_name = 'cccd_number' THEN 't.cccd_number'
      WHEN col_name = 'cccd_date' THEN 't.cccd_date'
      WHEN col_name = 'cccd_place' THEN 't.cccd_place'
      WHEN col_name = 'passport_number' THEN 't.passport_number'
      WHEN col_name = 'passport_date' THEN 't.passport_date'
      
      -- Address
      WHEN col_name = 'current_address' THEN 't.current_address'
      WHEN col_name = 'permanent_address' THEN 't.permanent_address'
      WHEN col_name = 'household_address' THEN 't.household_address'
      
      -- Health info
      WHEN col_name = 'height' THEN 't.height'
      WHEN col_name = 'weight' THEN 't.weight'
      WHEN col_name = 'blood_group' THEN 't.blood_group'
      WHEN col_name = 'vision_left' THEN 't.vision_left'
      WHEN col_name = 'vision_right' THEN 't.vision_right'
      WHEN col_name = 'health_status' THEN 't.health_status'
      WHEN col_name = 'dominant_hand' THEN 't.dominant_hand'
      WHEN col_name = 'smoking' THEN 't.smoking'
      WHEN col_name = 'drinking' THEN 't.drinking'
      WHEN col_name = 'tattoo' THEN 't.tattoo'
      
      -- Dates
      WHEN col_name = 'entry_date' THEN 't.entry_date'
      WHEN col_name = 'registration_date' THEN 't.registration_date'
      WHEN col_name = 'interview_pass_date' THEN 't.interview_pass_date'
      WHEN col_name = 'document_submission_date' THEN 't.document_submission_date'
      WHEN col_name = 'otit_entry_date' THEN 't.otit_entry_date'
      WHEN col_name = 'nyukan_entry_date' THEN 't.nyukan_entry_date'
      WHEN col_name = 'coe_date' THEN 't.coe_date'
      WHEN col_name = 'visa_date' THEN 't.visa_date'
      WHEN col_name = 'departure_date' THEN 't.departure_date'
      WHEN col_name = 'return_date' THEN 't.return_date'
      WHEN col_name = 'expected_return_date' THEN 't.expected_return_date'
      WHEN col_name = 'contract_end_date' THEN 't.contract_end_date'
      WHEN col_name = 'absconded_date' THEN 't.absconded_date'
      WHEN col_name = 'early_return_date' THEN 't.early_return_date'
      WHEN col_name = 'early_return_reason' THEN 't.early_return_reason'
      
      -- Status
      WHEN col_name = 'progression_stage' THEN 't.progression_stage'
      WHEN col_name = 'simple_status' THEN 't.simple_status'
      WHEN col_name = 'enrollment_status' THEN 't.enrollment_status'
      WHEN col_name = 'current_situation' THEN 't.current_situation'
      
      -- Workflow
      WHEN col_name = 'current_stage' THEN 'tw.current_stage'
      WHEN col_name = 'sub_status' THEN 'tw.sub_status'
      
      -- Contract
      WHEN col_name = 'contract_term' THEN 't.contract_term'
      WHEN col_name = 'interview_count' THEN 't.interview_count'
      
      -- Company/Union info
      WHEN col_name = 'company_name' THEN 'c.name'
      WHEN col_name = 'company_code' THEN 'c.code'
      WHEN col_name = 'union_name' THEN 'u.name'
      WHEN col_name = 'union_code' THEN 'u.code'
      WHEN col_name = 'job_category_name' THEN 'jc.name'
      WHEN col_name = 'job_category_code' THEN 'jc.code'
      
      -- Class info
      WHEN col_name = 'class_name' THEN 'cl.name'
      WHEN col_name = 'class_code' THEN 'cl.code'
      
      -- Other
      WHEN col_name = 'source' THEN 't.source'
      WHEN col_name = 'policy_category' THEN 't.policy_category'
      WHEN col_name = 'religion' THEN 't.religion'
      WHEN col_name = 'hobbies' THEN 't.hobbies'
      WHEN col_name = 'notes' THEN 't.notes'
      WHEN col_name = 'created_at' THEN 't.created_at'
      WHEN col_name = 'updated_at' THEN 't.updated_at'
      
      ELSE NULL
    END,
    ', '
  ) INTO column_list
  FROM jsonb_array_elements_text(selected_columns) AS col_name
  WHERE CASE 
    WHEN col_name = 'trainee_code' THEN true
    WHEN col_name = 'full_name' THEN true
    WHEN col_name = 'furigana' THEN true
    WHEN col_name = 'birth_date' THEN true
    WHEN col_name = 'gender' THEN true
    WHEN col_name = 'birthplace' THEN true
    WHEN col_name = 'ethnicity' THEN true
    WHEN col_name = 'marital_status' THEN true
    WHEN col_name = 'education_level' THEN true
    WHEN col_name = 'trainee_type' THEN true
    WHEN col_name = 'phone' THEN true
    WHEN col_name = 'email' THEN true
    WHEN col_name = 'parent_phone_1' THEN true
    WHEN col_name = 'parent_phone_2' THEN true
    WHEN col_name = 'cccd_number' THEN true
    WHEN col_name = 'cccd_date' THEN true
    WHEN col_name = 'cccd_place' THEN true
    WHEN col_name = 'passport_number' THEN true
    WHEN col_name = 'passport_date' THEN true
    WHEN col_name = 'current_address' THEN true
    WHEN col_name = 'permanent_address' THEN true
    WHEN col_name = 'household_address' THEN true
    WHEN col_name = 'height' THEN true
    WHEN col_name = 'weight' THEN true
    WHEN col_name = 'blood_group' THEN true
    WHEN col_name = 'vision_left' THEN true
    WHEN col_name = 'vision_right' THEN true
    WHEN col_name = 'health_status' THEN true
    WHEN col_name = 'dominant_hand' THEN true
    WHEN col_name = 'smoking' THEN true
    WHEN col_name = 'drinking' THEN true
    WHEN col_name = 'tattoo' THEN true
    WHEN col_name = 'entry_date' THEN true
    WHEN col_name = 'registration_date' THEN true
    WHEN col_name = 'interview_pass_date' THEN true
    WHEN col_name = 'document_submission_date' THEN true
    WHEN col_name = 'otit_entry_date' THEN true
    WHEN col_name = 'nyukan_entry_date' THEN true
    WHEN col_name = 'coe_date' THEN true
    WHEN col_name = 'visa_date' THEN true
    WHEN col_name = 'departure_date' THEN true
    WHEN col_name = 'return_date' THEN true
    WHEN col_name = 'expected_return_date' THEN true
    WHEN col_name = 'contract_end_date' THEN true
    WHEN col_name = 'absconded_date' THEN true
    WHEN col_name = 'early_return_date' THEN true
    WHEN col_name = 'early_return_reason' THEN true
    WHEN col_name = 'progression_stage' THEN true
    WHEN col_name = 'simple_status' THEN true
    WHEN col_name = 'enrollment_status' THEN true
    WHEN col_name = 'current_situation' THEN true
    WHEN col_name = 'current_stage' THEN true
    WHEN col_name = 'sub_status' THEN true
    WHEN col_name = 'contract_term' THEN true
    WHEN col_name = 'interview_count' THEN true
    WHEN col_name = 'company_name' THEN true
    WHEN col_name = 'company_code' THEN true
    WHEN col_name = 'union_name' THEN true
    WHEN col_name = 'union_code' THEN true
    WHEN col_name = 'job_category_name' THEN true
    WHEN col_name = 'job_category_code' THEN true
    WHEN col_name = 'class_name' THEN true
    WHEN col_name = 'class_code' THEN true
    WHEN col_name = 'source' THEN true
    WHEN col_name = 'policy_category' THEN true
    WHEN col_name = 'religion' THEN true
    WHEN col_name = 'hobbies' THEN true
    WHEN col_name = 'notes' THEN true
    WHEN col_name = 'created_at' THEN true
    WHEN col_name = 'updated_at' THEN true
    ELSE false
  END;

  IF column_list IS NULL OR column_list = '' THEN
    column_list := 't.trainee_code, t.full_name';
  END IF;

  -- Build WHERE clause from filters
  -- Year filter
  IF filters ? 'year' AND filters->>'year' IS NOT NULL AND filters->>'year' != '' THEN
    where_clause := where_clause || ' AND EXTRACT(YEAR FROM t.created_at) = ' || (filters->>'year')::int;
  END IF;

  -- Month filter  
  IF filters ? 'month' AND filters->>'month' IS NOT NULL AND filters->>'month' != '' THEN
    where_clause := where_clause || ' AND EXTRACT(MONTH FROM t.created_at) = ' || (filters->>'month')::int;
  END IF;

  -- Date range filter
  IF filters ? 'date_from' AND filters->>'date_from' IS NOT NULL AND filters->>'date_from' != '' THEN
    where_clause := where_clause || ' AND t.created_at >= ' || quote_literal(filters->>'date_from');
  END IF;
  
  IF filters ? 'date_to' AND filters->>'date_to' IS NOT NULL AND filters->>'date_to' != '' THEN
    where_clause := where_clause || ' AND t.created_at <= ' || quote_literal(filters->>'date_to');
  END IF;

  -- Workflow stage filter
  IF filters ? 'current_stage' AND filters->>'current_stage' IS NOT NULL AND filters->>'current_stage' != '' THEN
    where_clause := where_clause || ' AND tw.current_stage = ' || quote_literal(filters->>'current_stage');
  END IF;

  -- Simple status filter
  IF filters ? 'simple_status' AND filters->>'simple_status' IS NOT NULL AND filters->>'simple_status' != '' THEN
    where_clause := where_clause || ' AND t.simple_status = ' || quote_literal(filters->>'simple_status');
  END IF;

  -- Company filter
  IF filters ? 'company_id' AND filters->>'company_id' IS NOT NULL AND filters->>'company_id' != '' THEN
    where_clause := where_clause || ' AND t.receiving_company_id = ' || quote_literal(filters->>'company_id');
  END IF;

  -- Union filter
  IF filters ? 'union_id' AND filters->>'union_id' IS NOT NULL AND filters->>'union_id' != '' THEN
    where_clause := where_clause || ' AND t.union_id = ' || quote_literal(filters->>'union_id');
  END IF;

  -- Job category filter
  IF filters ? 'job_category_id' AND filters->>'job_category_id' IS NOT NULL AND filters->>'job_category_id' != '' THEN
    where_clause := where_clause || ' AND t.job_category_id = ' || quote_literal(filters->>'job_category_id');
  END IF;

  -- Trainee type filter
  IF filters ? 'trainee_type' AND filters->>'trainee_type' IS NOT NULL AND filters->>'trainee_type' != '' THEN
    where_clause := where_clause || ' AND t.trainee_type = ' || quote_literal(filters->>'trainee_type');
  END IF;

  -- Gender filter
  IF filters ? 'gender' AND filters->>'gender' IS NOT NULL AND filters->>'gender' != '' THEN
    where_clause := where_clause || ' AND t.gender = ' || quote_literal(filters->>'gender');
  END IF;

  -- Departure date filter
  IF filters ? 'departure_from' AND filters->>'departure_from' IS NOT NULL AND filters->>'departure_from' != '' THEN
    where_clause := where_clause || ' AND t.departure_date >= ' || quote_literal(filters->>'departure_from');
  END IF;
  
  IF filters ? 'departure_to' AND filters->>'departure_to' IS NOT NULL AND filters->>'departure_to' != '' THEN
    where_clause := where_clause || ' AND t.departure_date <= ' || quote_literal(filters->>'departure_to');
  END IF;

  -- Interview pass date filter
  IF filters ? 'interview_pass_from' AND filters->>'interview_pass_from' IS NOT NULL AND filters->>'interview_pass_from' != '' THEN
    where_clause := where_clause || ' AND t.interview_pass_date >= ' || quote_literal(filters->>'interview_pass_from');
  END IF;
  
  IF filters ? 'interview_pass_to' AND filters->>'interview_pass_to' IS NOT NULL AND filters->>'interview_pass_to' != '' THEN
    where_clause := where_clause || ' AND t.interview_pass_date <= ' || quote_literal(filters->>'interview_pass_to');
  END IF;

  -- Build final query
  sql_query := format(
    'SELECT jsonb_agg(row_to_json(subq)) FROM (
      SELECT %s
      FROM trainees t
      LEFT JOIN trainee_workflow tw ON t.id = tw.trainee_id
      LEFT JOIN companies c ON t.receiving_company_id = c.id
      LEFT JOIN unions u ON t.union_id = u.id
      LEFT JOIN job_categories jc ON t.job_category_id = jc.id
      LEFT JOIN classes cl ON t.class_id = cl.id
      %s
      ORDER BY t.created_at DESC
      LIMIT 10000
    ) subq',
    column_list,
    where_clause
  );

  -- Execute query
  EXECUTE sql_query INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;