# Database Security Audit — Mekong Labour ERP
> Auto-generated: 2026-03-18 | Covers: RLS Policies, Functions, Views

## 1. RLS Policy Summary

### Pattern: Unified `can_*()` Functions
Most tables use standardized RLS via `can_view(menu_key)`, `can_insert(menu_key)`, `can_update(menu_key)`, `can_delete(menu_key)`.

| Table | SELECT | INSERT | UPDATE | DELETE | Menu Key |
|-------|--------|--------|--------|--------|----------|
| trainees | can_view | can_insert | can_update | can_delete | `trainees` |
| family_members | can_view | can_insert | can_update | can_delete | `trainees` |
| education_history | can_view | can_insert | can_update | can_delete | `trainees` |
| work_history | can_view | can_insert | can_update | can_delete | `trainees` |
| japan_relatives | can_view | can_insert | can_update | can_delete | `trainees` |
| interview_history | can_view | can_insert | can_update | can_delete | `trainees` |
| classes | can_view | can_insert | can_update | can_delete | `education` |
| class_teachers | can_view | can_insert | can_update | can_delete | `education` |
| attendance | can_view | can_insert | can_update | can_delete | `education` |
| test_scores | can_view | can_insert | can_update | can_delete | `education` |
| trainee_reviews | can_view | can_insert | can_update | can_delete | `education` |
| companies | can_view | can_insert | can_update | can_delete | `partners` |
| unions | can_view | can_insert | can_update | can_delete | `partners` |
| job_categories | can_view | can_insert | can_update | can_delete | `partners` |
| orders | can_view | can_insert | can_update | can_delete | `orders` |
| dormitories | can_view | can_insert | can_update | can_delete | `dormitory` |
| dormitory_residents | can_view | can_insert | can_update | can_delete | `dormitory` |
| handbook_entries | can_view | can_insert | can_update | can_delete | `handbook` |

### Pattern: Role-based
| Table | Policy | Condition |
|-------|--------|-----------|
| audit_logs | SELECT | `is_admin(auth.uid())` |
| audit_logs | INSERT | `auth.uid() = user_id AND has_any_role()` |
| audit_logs | UPDATE/DELETE | ❌ Blocked |
| login_attempts | SELECT | `is_admin(auth.uid())` |
| login_attempts | INSERT/UPDATE/DELETE | ❌ Blocked |
| department_members | SELECT | `user_id = auth.uid() OR is_admin() OR role='manager'` |
| department_members | INSERT/UPDATE/DELETE | `is_admin_check()` |
| departments | SELECT | `status='active' OR is_admin()` |
| departments | ALL (admin) | `is_admin()` |
| user_roles | INSERT/UPDATE | Admin only, with primary_admin protection trigger |
| profiles | SELECT | `auth.uid() = user_id OR is_admin()` |
| ai_chat_messages | ALL | `user_id = auth.uid()` |

### Pattern: Public/Glossary
| Table | SELECT | Write |
|-------|--------|-------|
| cccd_places | public | staff+ (insert/update), manager+ (delete) |
| hobbies | public | authenticated |
| passport_places | public | staff+ |
| religions | public | staff+ |
| referral_sources | public | staff+ |
| katakana_names | authenticated+role | staff+ (write), admin (delete) |

## 2. SECURITY DEFINER Functions (74 total)

### Critical Authorization Functions
| Function | Purpose | Auth Check |
|----------|---------|------------|
| `can_view(menu_key)` | Check view permission | Merges user + dept permissions |
| `can_insert(menu_key)` | Check create permission | Same merge logic |
| `can_update(menu_key)` | Check update permission | Same merge logic |
| `can_delete(menu_key)` | Check delete permission | Same merge logic |
| `is_admin(uid)` | Check admin role | Queries user_roles |
| `is_primary_admin(uid)` | Check primary admin | Queries user_roles.is_primary_admin |
| `has_role(uid, role)` | Check specific role | Queries user_roles |
| `can_view_trainee_pii()` | PII access check | Admin/Senior/update permission |

### Data Modification Functions
| Function | Auth Check | Notes |
|----------|------------|-------|
| `assign_first_admin()` | Checks no existing admin | One-time bootstrap only |
| `assign_manager(uid)` | `is_admin()` | |
| `assign_sub_admin(uid)` | `is_primary_admin()` | |
| `soft_delete_trainee(id)` | `is_admin() OR can_delete('trainees')` | Soft deletes trainee + related |
| `restore_trainee(id)` | `is_admin()` | Admin-only restore |
| `finalize_interview_draft()` | `can_update('trainees')` | |
| `save_department_menu_permissions()` | `is_admin_check()` | |
| `protect_primary_admin_role()` | Trigger: prevents non-primary from setting flag | |

### Utility Functions (SECURITY DEFINER — all set `search_path = public`)
- `handle_new_user` / `handle_new_user_registration` — Auth triggers
- `update_updated_at_column` — INVOKER (safe)
- `log_audit` / `log_sensitive_access` — Audit logging
- `mask_*` functions — INVOKER (safe)
- `check_login_rate_limit` / `record_login_attempt` — Rate limiting
- Various `get_*` functions — Read-only queries with auth checks

## 3. Views (all with `security_invoker = true`)
- `trainees_masked` — PII masking via `can_view_trainee_pii()`
- `companies_public` — Public company info only
- `dormitories_with_occupancy` — Joined occupancy count
- `teachers_public` — Public teacher info
- All `dashboard_*` views — Aggregated statistics
- All `legal_*` views — Legal department stats
- `education_*` views — Education statistics

## 4. Known Risks & Mitigations

| Risk | Status | Mitigation |
|------|--------|------------|
| PII plaintext in DB | ⚠️ Accepted | RLS + UI masking + `trainees_masked` view |
| 74 SECURITY DEFINER functions | ⚠️ Accepted | All have `search_path = public` + auth checks |
| Profile email visible to admin | ✅ By design | Admin needs email for user management |
| Edge functions manual JWT | ⚠️ Accepted | All 4 functions validate; shared util recommended |
| Soft delete bypass via direct SQL | ✅ Mitigated | RPC function with auth check; hard delete still blocked by RLS |

## 5. Recommendations for Future
1. **Column-level encryption** for CCCD/passport via `pgsodium`
2. **Shared auth middleware** for Edge Functions
3. **Attendance partitioning** by year when >100K records
4. **Regular audit** of SECURITY DEFINER functions quarterly
