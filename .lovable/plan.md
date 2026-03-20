

## Sửa 4 views thiếu security_invoker

### Migration SQL

Tạo migration để thêm `security_invoker = true` cho 4 views:

```sql
ALTER VIEW public.union_stats SET (security_invoker = true);
ALTER VIEW public.dashboard_trainee_kpis SET (security_invoker = true);
ALTER VIEW public.order_stats SET (security_invoker = true);
ALTER VIEW public.dashboard_trainee_by_company SET (security_invoker = true);
```

### Ảnh hưởng
- Các view sẽ tuân thủ RLS của bảng gốc
- User có quyền `can_view` tương ứng vẫn thấy dữ liệu bình thường
- User không có quyền sẽ bị chặn đúng cách

### Sau migration
- Chạy lại security scan để xác nhận 0 findings

