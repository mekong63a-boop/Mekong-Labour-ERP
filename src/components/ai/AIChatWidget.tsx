import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Trash2, Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useCanAccessMenu } from "@/hooks/useMenuPermissions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AI_ENABLED_KEY = "mekong_ai_enabled";

export function AIChatWidget() {
  const { canView, isLoading: permLoading } = useCanAccessMenu("ai_assistant");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(() => {
    const saved = localStorage.getItem(AI_ENABLED_KEY);
    return saved !== null ? saved === "true" : true;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load history on open
  useEffect(() => {
    if (!open || !user?.id) return;
    
    const loadHistory = async () => {
      const { data } = await supabase
        .from("ai_chat_messages")
        .select("role, content, session_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
        setSessionId(data[0].session_id);
      }
    };
    loadHistory();
  }, [open, user?.id]);

  const toggleAiEnabled = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem(AI_ENABLED_KEY, String(enabled));
    toast.success(enabled ? "Đã bật Trợ lý AI" : "Đã tắt Trợ lý AI");
    if (!enabled) setOpen(false);
  };

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: newMessages, sessionId }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Có lỗi xảy ra");
        setMessages(messages); // revert
        return;
      }

      setMessages([...newMessages, { role: "assistant", content: result.reply }]);
      if (result.sessionId) setSessionId(result.sessionId);
    } catch {
      toast.error("Không thể kết nối đến AI");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId]);

  const clearHistory = async () => {
    if (!user?.id) return;
    await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    setSessionId(null);
    toast.success("Đã xóa lịch sử chat");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if no permission
  if (permLoading || !canView) return null;

  // AI is disabled - don't show anything
  if (!aiEnabled) {
    return (
      <button
        onClick={() => toggleAiEnabled(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-muted text-muted-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center opacity-50 hover:opacity-100"
        aria-label="Bật trợ lý AI"
        title="AI đang tắt - Nhấn để bật"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Mở trợ lý AI"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Trợ lý AI Mekong</span>
            </div>
            <div className="flex items-center gap-1">
              {/* AI On/Off Toggle */}
              <div className="flex items-center gap-1 mr-1" title="Bật/tắt AI">
                <Power className="h-3.5 w-3.5" />
                <Switch
                  checked={aiEnabled}
                  onCheckedChange={toggleAiEnabled}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 scale-75"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={clearHistory}
                title="Xóa lịch sử"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Xin chào! Tôi là trợ lý AI.</p>
                <p className="mt-1">Hãy hỏi tôi về hệ thống Mekong ERP.</p>
              </div>
            )}
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi..."
                className="min-h-[40px] max-h-[80px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="shrink-0 h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
