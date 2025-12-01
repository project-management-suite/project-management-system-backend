-- Complete Database Export Script
-- This script exports all tables, columns, constraints, indexes, policies, and functions
-- Execute this in your PostgreSQL/Supabase SQL editor and copy the result to a JSON file

WITH 
-- Get all table information
table_info AS (
  SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
  FROM pg_tables 
  WHERE schemaname IN ('public', 'auth')
),

-- Get all column information
column_info AS (
  SELECT 
    table_schema,
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_identity,
    identity_generation,
    is_generated,
    generation_expression
  FROM information_schema.columns
  WHERE table_schema IN ('public', 'auth')
),

-- Get all constraints
constraint_info AS (
  SELECT 
    tc.constraint_schema,
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule,
    cc.check_clause
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  LEFT JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
  LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
    AND tc.table_schema = cc.constraint_schema
  WHERE tc.table_schema IN ('public', 'auth')
),

-- Get all indexes
index_info AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname IN ('public', 'auth')
),

-- Get all policies
policy_info AS (
  SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    pol.polname AS policy_name,
    pol.polcmd AS policy_command,
    pol.polpermissive AS policy_permissive,
    pol.polroles::regrole[] AS policy_roles,
    pg_get_expr(pol.polqual, pol.polrelid) AS policy_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS policy_with_check
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname IN ('public', 'auth')
),

-- Get all functions and triggers
function_info AS (
  SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS function_definition,
    l.lanname AS language
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname IN ('public', 'auth')
    AND p.prokind IN ('f', 't')  -- functions and trigger functions
),

-- Get all triggers
trigger_info AS (
  SELECT 
    t.trigger_schema,
    t.trigger_name,
    t.event_object_table AS table_name,
    t.action_timing,
    t.event_manipulation,
    t.action_statement,
    t.action_orientation,
    t.action_condition
  FROM information_schema.triggers t
  WHERE t.trigger_schema IN ('public', 'auth')
),

-- Get sequences
sequence_info AS (
  SELECT 
    sequence_schema,
    sequence_name,
    data_type,
    numeric_precision,
    increment,
    minimum_value,
    maximum_value,
    start_value,
    cycle_option
  FROM information_schema.sequences
  WHERE sequence_schema IN ('public', 'auth')
)

-- Main query combining all information
SELECT json_build_object(
  'export_timestamp', now(),
  'database_name', current_database(),
  'schemas', json_build_object(
    'public', json_build_object(
      'tables', (
        SELECT json_object_agg(
          tablename, 
          json_build_object(
            'owner', tableowner,
            'has_indexes', hasindexes,
            'has_rules', hasrules,
            'has_triggers', hastriggers,
            'row_security', rowsecurity,
            'columns', (
              SELECT json_object_agg(
                column_name,
                json_build_object(
                  'position', ordinal_position,
                  'default', column_default,
                  'nullable', is_nullable,
                  'type', data_type,
                  'max_length', character_maximum_length,
                  'precision', numeric_precision,
                  'scale', numeric_scale,
                  'is_identity', is_identity,
                  'identity_generation', identity_generation,
                  'is_generated', is_generated,
                  'generation_expression', generation_expression
                )
              )
              FROM column_info c 
              WHERE c.table_schema = 'public' 
                AND c.table_name = t.tablename
            ),
            'constraints', (
              SELECT json_agg(
                json_build_object(
                  'name', constraint_name,
                  'type', constraint_type,
                  'column', column_name,
                  'foreign_table', foreign_table_name,
                  'foreign_column', foreign_column_name,
                  'update_rule', update_rule,
                  'delete_rule', delete_rule,
                  'check_clause', check_clause
                )
              )
              FROM constraint_info con
              WHERE con.table_schema = 'public' 
                AND con.table_name = t.tablename
            ),
            'indexes', (
              SELECT json_agg(
                json_build_object(
                  'name', indexname,
                  'definition', indexdef
                )
              )
              FROM index_info idx
              WHERE idx.schemaname = 'public' 
                AND idx.tablename = t.tablename
            ),
            'policies', (
              SELECT json_agg(
                json_build_object(
                  'name', policy_name,
                  'command', policy_command,
                  'permissive', policy_permissive,
                  'roles', policy_roles::text[],
                  'expression', policy_expression,
                  'with_check', policy_with_check
                )
              )
              FROM policy_info pol
              WHERE pol.schema_name = 'public' 
                AND pol.table_name = t.tablename
            ),
            'triggers', (
              SELECT json_agg(
                json_build_object(
                  'name', trigger_name,
                  'timing', action_timing,
                  'event', event_manipulation,
                  'statement', action_statement,
                  'orientation', action_orientation,
                  'condition', action_condition
                )
              )
              FROM trigger_info trig
              WHERE trig.trigger_schema = 'public' 
                AND trig.table_name = t.tablename
            )
          )
        ) 
        FROM table_info t 
        WHERE t.schemaname = 'public'
      ),
      'functions', (
        SELECT json_object_agg(
          function_name,
          json_build_object(
            'return_type', return_type,
            'arguments', arguments,
            'definition', function_definition,
            'language', language
          )
        )
        FROM function_info f
        WHERE f.schema_name = 'public'
      ),
      'sequences', (
        SELECT json_object_agg(
          sequence_name,
          json_build_object(
            'data_type', data_type,
            'precision', numeric_precision,
            'increment', increment,
            'minimum', minimum_value,
            'maximum', maximum_value,
            'start', start_value,
            'cycle', cycle_option
          )
        )
        FROM sequence_info s
        WHERE s.sequence_schema = 'public'
      )
    ),
    'auth', json_build_object(
      'tables', (
        SELECT json_object_agg(
          tablename, 
          json_build_object(
            'owner', tableowner,
            'has_indexes', hasindexes,
            'has_rules', hasrules,
            'has_triggers', hastriggers,
            'row_security', rowsecurity,
            'columns', (
              SELECT json_object_agg(
                column_name,
                json_build_object(
                  'position', ordinal_position,
                  'default', column_default,
                  'nullable', is_nullable,
                  'type', data_type,
                  'max_length', character_maximum_length,
                  'precision', numeric_precision,
                  'scale', numeric_scale
                )
              )
              FROM column_info c 
              WHERE c.table_schema = 'auth' 
                AND c.table_name = t.tablename
            ),
            'policies', (
              SELECT json_agg(
                json_build_object(
                  'name', policy_name,
                  'command', policy_command,
                  'permissive', policy_permissive,
                  'roles', policy_roles::text[],
                  'expression', policy_expression,
                  'with_check', policy_with_check
                )
              )
              FROM policy_info pol
              WHERE pol.schema_name = 'auth' 
                AND pol.table_name = t.tablename
            )
          )
        ) 
        FROM table_info t 
        WHERE t.schemaname = 'auth'
      )
    )
  ),
  'summary', json_build_object(
    'total_tables', (SELECT count(*) FROM table_info),
    'total_columns', (SELECT count(*) FROM column_info),
    'total_constraints', (SELECT count(DISTINCT constraint_name) FROM constraint_info),
    'total_indexes', (SELECT count(*) FROM index_info),
    'total_policies', (SELECT count(*) FROM policy_info),
    'total_functions', (SELECT count(*) FROM function_info),
    'total_triggers', (SELECT count(*) FROM trigger_info),
    'total_sequences', (SELECT count(*) FROM sequence_info)
  )
) AS complete_database_export;