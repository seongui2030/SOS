import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  FileDown,
  FileText,
  HeartPulse,
  History,
  LogOut,
  MessageSquarePlus,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAssistant, type Turn } from "@/components/VoiceAssistant";
import { exportRowsToCsv, exportRowsToPdf, type ExportRow } from "@/lib/export";


export const Route = createFileRoute("/_authenticated/c/$conversationId")({
  head: () => ({
    meta: [
      { title: "음성 상담 · 말벗 케어" },
      {
        name: "description",
        content:
          "음성으로 건강과 복약을 상담하고 대화 기록을 저장·검색하세요. 응급 키워드가 감지되면 즉시 119 안내를 제공합니다.",
      },
      { property: "og:title", content: "음성 상담 · 말벗 케어" },
      {
        property: "og:description",
        content: "음성 건강 상담과 저장된 대화 기록 검색.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConversationPage,
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">대화를 불러오지 못했습니다. 새로고침해 주세요.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">대화를 찾을 수 없습니다.</p>
    </main>
  ),
});

type Conversation = { id: string; title: string; updated_at: string };
type SearchHit = {
  id: string;
  content: string;
  role: string;
  created_at: string;
  conversation_id: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConversationPage() {
  const { conversationId } = useParams({ from: "/_authenticated/c/$conversationId" });
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("대화 목록을 불러오지 못했습니다.");
      return;
    }
    setConversations(data ?? []);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let cancelled = false;
    setTurns(null);
    void supabase
      .from("messages")
      .select("id, role, content, emergency_keywords")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("대화 기록을 불러오지 못했습니다.");
          setTurns([]);
          return;
        }
        setTurns(
          (data ?? []).map((row) => ({
            id: row.id,
            role: row.role as "user" | "assistant",
            content: row.content,
            emergency_keywords: row.emergency_keywords ?? [],
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const runSearch = useCallback(async (term: string) => {
    const value = term.trim();
    if (!value) {
      setHits(null);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, role, created_at, conversation_id")
      .ilike("content", `%${value}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    setSearching(false);
    if (error) {
      toast.error("검색에 실패했습니다.");
      return;
    }
    setHits(data ?? []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const newConversation = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("새 대화를 만들 수 없습니다.");
      return;
    }
    setPanelOpen(false);
    await loadConversations();
    void navigate({ to: "/c/$conversationId", params: { conversationId: data.id } });
  };

  const removeConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("대화를 삭제할 수 없습니다.");
      return;
    }
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (id === conversationId) {
      setPanelOpen(false);
      void navigate({ to: "/" });
    }
  };

  const titleFor = (id: string) =>
    conversations.find((c) => c.id === id)?.title ?? "저장된 대화";

  const fetchExportRows = useCallback(
    async (scope: "current" | "all"): Promise<ExportRow[] | null> => {
      let request = supabase
        .from("messages")
        .select("role, content, created_at, emergency_keywords, conversation_id")
        .order("created_at", { ascending: true });
      if (scope === "current") request = request.eq("conversation_id", conversationId);
      const { data, error } = await request;
      if (error) {
        toast.error("기록을 불러오지 못했습니다.");
        return null;
      }
      const titles = new Map(conversations.map((c) => [c.id, c.title]));
      return (data ?? []).map((row) => ({
        conversation: titles.get(row.conversation_id) ?? "저장된 대화",
        role: row.role,
        content: row.content,
        created_at: row.created_at,
        emergency_keywords: row.emergency_keywords ?? [],
      }));
    },
    [conversationId, conversations],
  );

  const handleExport = async (format: "csv" | "pdf", scope: "current" | "all") => {
    setExporting(`${format}-${scope}`);
    const rows = await fetchExportRows(scope);
    setExporting(null);
    if (!rows) return;
    if (rows.length === 0) {
      toast.error("내보낼 대화 기록이 없습니다.");
      return;
    }
    const label = scope === "current" ? titleFor(conversationId) : "전체 대화 기록";
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      exportRowsToCsv(rows, `말벗케어_${scope === "current" ? "대화" : "전체"}_${stamp}.csv`);
      toast.success("CSV 파일을 저장했습니다.");
      return;
    }
    const opened = exportRowsToPdf(rows, `말벗 케어 · ${label}`);
    if (!opened) {
      toast.error("팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.");
      return;
    }
    toast.success("인쇄 창에서 'PDF로 저장'을 선택하세요.");
  };

  const titleFor = (id: string) =>
    conversations.find((c) => c.id === id)?.title ?? "저장된 대화";

  // Give a saved conversation a readable title from its first question.
  const maybeTitle = useCallback(async () => {
    await loadConversations();
    const current = conversations.find((c) => c.id === conversationId);
    if (current && current.title !== "새 대화") return;
    const { data } = await supabase
      .from("messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .eq("role", "user")
      .order("created_at", { ascending: true })
      .limit(1);
    const first = data?.[0]?.content;
    if (!first) return;
    const title = first.length > 30 ? `${first.slice(0, 30)}…` : first;
    await supabase.from("conversations").update({ title }).eq("id", conversationId);
    await loadConversations();
  }, [conversationId, conversations, loadConversations]);

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-6">
        <header className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <HeartPulse className="size-6" />
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">말벗 케어</h1>
            <p className="text-xs text-muted-foreground">{titleFor(conversationId)}</p>
          </div>

          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="lg" className="h-11">
                <History className="size-4" /> 기록
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[92vw] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b p-5">
                <SheetTitle>대화 기록</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 overflow-y-auto p-5">
                <Button className="h-12 w-full" onClick={() => void newConversation()}>
                  <MessageSquarePlus className="size-4" /> 새 대화 시작
                </Button>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="기록 검색 (예: 혈압약)"
                    className="h-12 pl-9"
                  />
                </div>

                {searching && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> 검색 중…
                  </p>
                )}

                {hits !== null ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      검색 결과 {hits.length}건
                    </p>
                    {hits.map((hit) => (
                      <button
                        key={hit.id}
                        type="button"
                        className="w-full rounded-2xl bg-secondary p-3 text-left"
                        onClick={() => {
                          setPanelOpen(false);
                          void navigate({
                            to: "/c/$conversationId",
                            params: { conversationId: hit.conversation_id },
                          });
                        }}
                      >
                        <p className="text-xs text-muted-foreground">
                          {hit.role === "user" ? "내 질문" : "AI 답변"} · {formatDate(hit.created_at)}
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm text-secondary-foreground">
                          {hit.content}
                        </p>
                      </button>
                    ))}
                    {hits.length === 0 && (
                      <p className="text-sm text-muted-foreground">일치하는 기록이 없습니다.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">저장된 대화</p>
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`flex items-center gap-2 rounded-2xl p-3 ${
                          conversation.id === conversationId ? "bg-primary/10" : "bg-secondary"
                        }`}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            setPanelOpen(false);
                            void navigate({
                              to: "/c/$conversationId",
                              params: { conversationId: conversation.id },
                            });
                          }}
                        >
                          <p className="truncate text-sm font-medium text-foreground">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(conversation.updated_at)}
                          </p>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="대화 삭제"
                          onClick={() => void removeConversation(conversation.id)}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-sm text-muted-foreground">저장된 대화가 없습니다.</p>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    void navigate({ to: "/auth" });
                  }}
                >
                  <LogOut className="size-4" /> 로그아웃
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
            음성 입력
          </span>
          → <span className="rounded-full bg-secondary px-2.5 py-1">STT</span>
          → <span className="rounded-full bg-secondary px-2.5 py-1">AI 답변 생성</span>
          → <span className="rounded-full bg-secondary px-2.5 py-1">TTS</span>
          →{" "}
          <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
            음성 출력
          </span>
        </p>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {turns === null || !userId ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl bg-card p-10 shadow-soft">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <VoiceAssistant
              key={conversationId}
              conversationId={conversationId}
              userId={userId}
              initialTurns={turns}
              onSaved={() => void maybeTitle()}
            />
          )}
        </div>
      </div>
    </main>
  );
}
