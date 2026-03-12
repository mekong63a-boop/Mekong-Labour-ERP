import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PresenceUser } from '@/hooks/usePresence';
import { Users } from 'lucide-react';

interface PresenceIndicatorProps {
  onlineUsers: PresenceUser[];
}

export function PresenceIndicator({ onlineUsers }: PresenceIndicatorProps) {
  if (onlineUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-lg border border-accent">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">
          {onlineUsers.length} người đang xem
        </span>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((user) => {
            const initials = (user.email?.split('@')[0] || '?').slice(0, 2).toUpperCase();
            return (
              <Tooltip key={user.userId}>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{user.email}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {onlineUsers.length > 5 && (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                +{onlineUsers.length - 5}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
