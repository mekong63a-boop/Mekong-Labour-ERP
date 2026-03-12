
-- Function to generate full schema dump as SQL text
CREATE OR REPLACE FUNCTION public.generate_schema_dump()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dump_text text := '';
  rec RECORD;
  col_rec RECORD;
  col_defs text;
BEGIN
  dump_text := '-- ============================================' || E'\n';
  dump_text := dump_text || '-- Mekong Labour ERP - Full Database Dump' || E'\n';
  dump_text := dump_text || '-- Generated at: ' || now()::text || E'\n';
  dump_text := dump_text || '-- ============================================' || E'\n\n';

  -- 1. ENUM TYPES
  dump_text := dump_text || '-- ========================' || E'\n';
  dump_text := dump_text || '-- ENUM TYPES' || E'\n';
  dump_text := dump_text || '-- ========================' || E'\n\n';
  
  FOR rec IN
    SELECT t.typname, 
           string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  LOOP
    dump_text := dump_text || 'DO $do$ BEGIN CREATE TYPE public.' || quote_ident(rec.typname) 
      || ' AS ENUM (' || rec.enum_values || '); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;' || E'\n';
  END LOOP;
  dump_text := dump_text || E'\n';

  -- 2. TABLES
  dump_text := dump_text || '-- ========================' || E'\n';
  dump_text := dump_text || '-- TABLES' || E'\n';
  dump_text := dump_text || '-- ========================' || E'\n\n';

  FOR rec IN
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    dump_text := dump_text || 'CREATE TABLE IF NOT EXISTS public.' || quote_ident(rec.table_name) || ' (' || E'\n';
    
    col_defs := '';
    FOR col_rec IN
      SELECT column_name, data_type, udt_name, is_nullable, column_default, 
             character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = rec.table_name
      ORDER BY ordinal_position
    LOOP
      IF col_defs != '' THEN
        col_defs := col_defs || ',' || E'\n';
      END IF;
      
      col_defs := col_defs || '  ' || quote_ident(col_rec.column_name) || ' ';
      
      IF col_rec.data_type = 'USER-DEFINED' THEN
        col_defs := col_defs || 'public.' || quote_ident(col_rec.udt_name);
      ELSIF col_rec.data_type = 'character varying' AND col_rec.character_maximum_length IS NOT NULL THEN
        col_defs := col_defs || 'varchar(' || col_rec.character_maximum_length || ')';
      ELSIF col_rec.data_type = 'ARRAY' THEN
        col_defs := col_defs || col_rec.udt_name;
      ELSE
        col_defs := col_defs || col_rec.data_type;
      END IF;
      
      IF col_rec.is_nullable = 'NO' THEN
        col_defs := col_defs || ' NOT NULL';
      END IF;
      
      IF col_rec.column_default IS NOT NULL THEN
        col_defs := col_defs || ' DEFAULT ' || col_rec.column_default;
      END IF;
    END LOOP;
    
    -- Primary key
    FOR col_rec IN
      SELECT string_agg(quote_ident(kcu.column_name), ', ' ORDER BY kcu.ordinal_position) AS pk_cols
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' AND tc.table_name = rec.table_name AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.constraint_name
    LOOP
      col_defs := col_defs || ',' || E'\n' || '  PRIMARY KEY (' || col_rec.pk_cols || ')';
    END LOOP;
    
    dump_text := dump_text || col_defs || E'\n);\n\n';
  END LOOP;

  -- 3. VIEWS
  dump_text := dump_text || '-- ========================' || E'\n';
  dump_text := dump_text || '-- VIEWS' || E'\n';
  dump_text := dump_text || '-- ========================' || E'\n\n';

  FOR rec IN
    SELECT viewname, definition
    FROM pg_views
    WHERE schemaname = 'public'
    ORDER BY viewname
  LOOP
    dump_text := dump_text || 'CREATE OR REPLACE VIEW public.' || quote_ident(rec.viewname) 
      || ' AS ' || rec.definition || E'\n\n';
  END LOOP;

  -- 4. FUNCTIONS
  dump_text := dump_text || '-- ========================' || E'\n';
  dump_text := dump_text || '-- FUNCTIONS' || E'\n';
  dump_text := dump_text || '-- ========================' || E'\n\n';

  FOR rec IN
    SELECT pg_get_functiondef(p.oid) AS func_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
    ORDER BY p.proname
  LOOP
    dump_text := dump_text || rec.func_def || ';' || E'\n\n';
  END LOOP;

  -- 5. TRIGGERS
  dump_text := dump_text || '-- ========================' || E'\n';
  dump_text := dump_text || '-- TRIGGERS' || E'\n';
  dump_text := dump_text || '-- ========================' || E'\n\n';

  FOR rec IN
    SELECT pg_get_triggerdef(t.oid, true) AS trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  LOOP
    dump_text := dump_text || rec.trigger_def || ';' || E'\n';
  END LOOP;
  dump_text := dump_text || E'\n';

  -- 6. RLS POLICIES
  dump_text := dump_text || '-- ========================' || E'\n';
  dump_text := dump_text || '-- RLS POLICIES' || E'\n';
  dump_text := dump_text || '-- ========================' || E'\n\n';

  FOR rec IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    dump_text := dump_text || 'CREATE POLICY ' || quote_ident(rec.policyname) 
      || ' ON public.' || quote_ident(rec.tablename);
    
    IF rec.permissive = 'PERMISSIVE' THEN
      dump_text := dump_text || ' AS PERMISSIVE';
    ELSE
      dump_text := dump_text || ' AS RESTRICTIVE';
    END IF;
    
    dump_text := dump_text || ' FOR ' || rec.cmd;
    dump_text := dump_text || ' TO ' || array_to_string(rec.roles, ', ');
    
    IF rec.qual IS NOT NULL THEN
      dump_text := dump_text || ' USING (' || rec.qual || ')';
    END IF;
    IF rec.with_check IS NOT NULL THEN
      dump_text := dump_text || ' WITH CHECK (' || rec.with_check || ')';
    END IF;
    
    dump_text := dump_text || ';' || E'\n';
  END LOOP;

  -- 7. RLS ENABLE
  FOR rec IN
    SELECT relname
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relrowsecurity = true AND c.relkind = 'r'
    ORDER BY relname
  LOOP
    dump_text := dump_text || 'ALTER TABLE public.' || quote_ident(rec.relname) || ' ENABLE ROW LEVEL SECURITY;' || E'\n';
  END LOOP;

  RETURN dump_text;
END;
$$;

-- Function to generate INSERT statements for a single table
CREATE OR REPLACE FUNCTION public.generate_table_inserts(_table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dump_text text := '';
  col_names text;
  row_rec RECORD;
  row_values text;
  col_rec RECORD;
  val text;
  col_type text;
BEGIN
  -- Get column names
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO col_names
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = _table_name;

  IF col_names IS NULL THEN
    RETURN '';
  END IF;

  dump_text := '-- Data for table: ' || _table_name || E'\n';
  dump_text := dump_text || 'DELETE FROM public.' || quote_ident(_table_name) || ' WHERE true;' || E'\n';

  -- Use dynamic SQL to iterate rows
  FOR row_rec IN EXECUTE format('SELECT row_to_json(t.*) AS jdata FROM public.%I t', _table_name)
  LOOP
    row_values := '';
    FOR col_rec IN
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = _table_name
      ORDER BY ordinal_position
    LOOP
      IF row_values != '' THEN
        row_values := row_values || ', ';
      END IF;
      
      val := row_rec.jdata ->> col_rec.column_name;
      
      IF val IS NULL THEN
        row_values := row_values || 'NULL';
      ELSIF col_rec.data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision') THEN
        row_values := row_values || val;
      ELSIF col_rec.data_type = 'boolean' THEN
        row_values := row_values || val;
      ELSIF col_rec.data_type = 'ARRAY' THEN
        -- Handle arrays: stored as JSON array in row_to_json, need to cast
        row_values := row_values || quote_literal(val) || '::' || col_rec.udt_name;
      ELSIF col_rec.data_type = 'USER-DEFINED' THEN
        row_values := row_values || quote_literal(val) || '::public.' || quote_ident(col_rec.udt_name);
      ELSIF col_rec.data_type = 'jsonb' OR col_rec.data_type = 'json' THEN
        row_values := row_values || quote_literal(val) || '::' || col_rec.data_type;
      ELSE
        row_values := row_values || quote_literal(val);
      END IF;
    END LOOP;
    
    dump_text := dump_text || 'INSERT INTO public.' || quote_ident(_table_name) 
      || ' (' || col_names || ') VALUES (' || row_values || ') ON CONFLICT DO NOTHING;' || E'\n';
  END LOOP;

  dump_text := dump_text || E'\n';
  RETURN dump_text;
END;
$$;
