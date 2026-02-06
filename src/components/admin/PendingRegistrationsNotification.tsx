import { useState } from "react";
import { Bell, UserPlus, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePendingRegistrations } from "@/hooks/usePendingRegistrations";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export function PendingRegistrationsNotification() {
  const { registrations, unreadCount, isPrimaryAdmin, isLoading } =
    usePendingRegistrations();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Chỉ hiển thị cho Primary Admin
  if (!isPrimaryAdmin) {
    return null;
  }

  const handleGoToAdmin = () => {
    setOpen(false);
    navigate("/admin");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Chờ cấp quyền</h4>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} tài khoản
            </Badge>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Không có tài khoản chờ cấp quyền
            </div>
          ) : (
            <div className="divide-y">
              {registrations.map((reg) => (
                <div
                  key={reg.user_id}
                  className="p-3 hover:bg-muted/50 transition-colors bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {reg.full_name || "Chưa có tên"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {reg.user_email}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Xác thực{" "}
                          {formatDistanceToNow(new Date(reg.email_confirmed_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center gap-2 text-sm"
            onClick={handleGoToAdmin}
          >
            <ExternalLink className="h-4 w-4" />
            Quản lý phân quyền
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
