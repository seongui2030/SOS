import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartPulse, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "말벗 케어 · 음성 건강관리 AI 비서" },
      {
        name: "description",
        content:
          "말로 묻고 음성으로 듣는 건강관리 비서. 음성 인식(STT)과 음성 합성(TTS)을 결합해 복약 정보와 건강관리 방법을 안내하고 대화 기록을 저장·검색합니다.",
      },
      { property: "og:title", content: "말벗 케어 · 음성 건강관리 AI 비서" },
      {
        property: "og:description",
        content: "음성으로 묻고 음성으로 듣는 건강관리·복약 안내 AI 비서. 대화 기록 저장과 검색 지원.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gateway,
});

function Gateway() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (cancelled) return;
      if (!user) {
        void navigate({ to: "/auth" });
        return;
      }

      const { data: latest } = await supabase
        .from("conversations")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (cancelled) return;
      const existing = latest?.[0]?.id;
      if (existing) {
        void navigate({ to: "/c/$conversationId", params: { conversationId: existing } });
        return;
      }

      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (cancelled) return;
      if (error || !created) {
        toast.error("대화를 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      void navigate({ to: "/c/$conversationId", params: { conversationId: created.id } });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <HeartPulse className="size-7" />
      </span>
      <h1 className="text-xl font-bold text-foreground">말벗 케어</h1>
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </main>
  );
}
