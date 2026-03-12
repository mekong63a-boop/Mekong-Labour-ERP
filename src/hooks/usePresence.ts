import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PresenceUser {
  userId: string;
  email: string;
  joinedAt: string;
}

/**
 * Presence Hook - Hiển thị người dùng đang online trên cùng một trang
 * Sử dụng Supabase Realtime Presence để tránh xung đột dữ liệu
 * 
 * @param channelName - Tên channel duy nhất (ví dụ: `trainee-detail:${traineeId}`)
 */
export function usePresence(channelName: string | null) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!channelName || !user) return;

    const channel = supabase.channel(`presence:${channelName}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{
          userId: string;
          email: string;
          joinedAt: string;
        }>();

        const users: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            users.push({
              userId: presences[0].userId,
              email: presences[0].email,
              joinedAt: presences[0].joinedAt,
            });
          }
        }

        // Exclude current user from the list
        setOnlineUsers(users.filter(u => u.userId !== user.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            email: user.email || '',
            joinedAt: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, user]);

  return { onlineUsers };
}
