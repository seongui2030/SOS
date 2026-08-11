import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Mic,
  PhoneCall,
  Pill,
  Send,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { startRecording, type Recorder } from "@/lib/recorder";
import { detectEmergency } from "@/lib/emergency";
import { supabase } from "@/integrations/supabase/client";
import { EmergencyDialog } from "@/components/EmergencyDialog";

export type Turn = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  emergency_keywords?: string[];
};

type Stage = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "대기 중",
  recording: "듣고 있어요…",
  transcribing: "음성을 글로 바꾸는 중…",
  thinking: "답변을 만드는 중…",
  speaking: "음성으로 말하는 중…",
};

const SUGGESTIONS = [
  "혈압약은 언제 먹는 게 좋아요?",
  "무릎이 아플 때 할 수 있는 운동 알려줘",
  "당뇨에 좋은 아침 식사가 뭐예요?",
  "약을 깜빡 잊고 안 먹었어요",
];

type Props = {
  conversationId: string;
  userId: string;
  initialTurns: Turn[];
  onSaved?: () => void;
};

export function VoiceAssistant({ conversationId, userId, initialTurns, onSaved }: Props) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [stage, setStage] = useState<Stage>("idle");
  const [typed, setTyped] = useState("");
  const [emergency, setEmergency] = useState<string[]>([]);
  const recorderRef = useRef<Recorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const busy = stage !== "idle" && stage !== "recording";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, stage]);

  useEffect(() => {
    if (stage === "idle") inputRef.current?.focus();
  }, [stage, conversationId]);

  const persist = useCallback(
    async (turn: Turn) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        role: turn.role,
        content: turn.content,
        emergency_keywords: turn.emergency_keywords ?? [],
      });
      if (error) {
        toast.error("대화 기록 저장에 실패했습니다.");
        return;
      }
      onSaved?.();
    },
    [conversationId, userId, onSaved],
  );

  const speak = useCallback(async (text: string) => {
    setStage("speaking");
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tts");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play().catch(() => {});
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
      URL.revokeObjectURL(url);
    } catch {
      toast.error("음성 재생에 실패했습니다. 글로 표시된 답변을 확인해 주세요.");
    } finally {
      setStage("idle");
    }
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const found = detectEmergency(question);
      setEmergency(found);
      const history: Turn[] = [
        ...turns,
        { role: "user", content: question, emergency_keywords: found },
      ];
      setTurns(history);
      setStage("thinking");
      void persist({ role: "user", content: question, emergency_keywords: found });
      try {
        const res = await fetch("/api/health-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.slice(-10).map((t) => ({ role: t.role, content: t.content })),
          }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        if (!res.ok || !data.reply) throw new Error(data.error ?? "답변 생성 실패");
        setTurns([...history, { role: "assistant", content: data.reply }]);
        void persist({ role: "assistant", content: data.reply });
        await speak(data.reply);
      } catch (error) {
        setStage("idle");
        toast.error(error instanceof Error ? error.message : "답변 생성에 실패했습니다.");
      }
    },
    [turns, speak, persist],
  );

  const toggleMic = useCallback(async () => {
    if (stage === "recording") {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (!recorder) return;
      setStage("transcribing");
      try {
        const blob = await recorder.stop();
        if (blob.size < 4000) {
          setStage("idle");
          toast.error("소리가 거의 없었어요. 다시 말씀해 주세요.");
          return;
        }
        const form = new FormData();
        form.append("file", blob, "recording.wav");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || !data.text?.trim()) throw new Error(data.error ?? "음성을 알아듣지 못했어요.");
        await ask(data.text.trim());
      } catch (error) {
        setStage("idle");
        toast.error(error instanceof Error ? error.message : "음성 인식에 실패했습니다.");
      }
      return;
    }

    try {
      audioRef.current?.pause();
      recorderRef.current = await startRecording();
      setStage("recording");
    } catch {
      toast.error("마이크를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.");
    }
  }, [stage, ask]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {emergency.length > 0 && (
        <Card className="mb-4 gap-3 border-emergency/40 bg-emergency/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-emergency" />
            <div className="space-y-1">
              <p className="font-semibold text-emergency">응급 상황이 감지되었습니다</p>
              <p className="text-sm text-foreground/80">
                감지된 표현: {emergency.join(", ")} · 즉시 119에 신고하거나 주변에 도움을 요청하세요.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="destructive" size="lg">
              <a href="tel:119">
                <PhoneCall className="size-4" /> 119 전화하기
              </a>
            </Button>
            <EmergencyDialog keywords={emergency} />
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                void speak(
                  "응급 상황일 수 있습니다. 지금 바로 119에 전화하시고, 주변에 계신 분께 도움을 요청하세요.",
                )
              }
            >
              <Volume2 className="size-4" /> 안내 다시 듣기
            </Button>
          </div>
        </Card>
      )}

      <div
        ref={scrollRef}
        className="min-h-[240px] flex-1 space-y-3 overflow-y-auto rounded-3xl bg-card p-5 shadow-soft"
      >
        {turns.length === 0 && (
          <div className="space-y-4 py-6 text-center">
            <Pill className="mx-auto size-8 text-primary" />
            <p className="text-base text-muted-foreground">
              아래 마이크 버튼을 누르고 궁금한 점이나 건강 이야기를 말씀해 주세요.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="secondary"
                  className="h-auto justify-start whitespace-normal py-3 text-left text-sm"
                  disabled={busy}
                  onClick={() => void ask(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, index) => (
          <div
            key={turn.id ?? index}
            className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                turn.role === "user"
                  ? "max-w-[85%] rounded-3xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground"
                  : "max-w-[90%] space-y-2 rounded-3xl rounded-bl-md bg-secondary px-4 py-3 text-secondary-foreground"
              }
            >
              <p className="text-[15px] leading-relaxed">{turn.content}</p>
              {turn.role === "assistant" && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  onClick={() => void speak(turn.content)}
                >
                  <Volume2 className="size-3.5" /> 다시 듣기
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center gap-4">
        <button
          type="button"
          aria-label={stage === "recording" ? "녹음 정지" : "말하기 시작"}
          disabled={busy}
          onClick={() => void toggleMic()}
          className={`flex size-20 items-center justify-center rounded-full text-primary-foreground shadow-lift transition-transform active:scale-95 disabled:opacity-60 ${
            stage === "recording" ? "mic-pulse bg-emergency" : "bg-primary"
          }`}
        >
          {busy ? (
            <Loader2 className="size-8 animate-spin" />
          ) : stage === "recording" ? (
            <Square className="size-7" />
          ) : (
            <Mic className="size-8" />
          )}
        </button>
        <p className="text-sm font-medium text-muted-foreground">{STAGE_LABEL[stage]}</p>

        <form
          className="flex w-full gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const question = typed.trim();
            if (!question || busy) return;
            setTyped("");
            void ask(question);
          }}
        >
          <Input
            ref={inputRef}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="글로 물어보기"
            className="h-12 rounded-2xl bg-card"
          />
          <Button type="submit" size="lg" className="h-12" disabled={busy || !typed.trim()}>
            <Send className="size-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          이 안내는 참고용입니다. 진단과 처방은 반드시 의사·약사와 상담하세요.
        </p>
      </div>
    </div>
  );
}
