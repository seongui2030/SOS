import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `당신은 시니어 사용자를 돕는 한국어 음성 건강관리 AI 비서입니다.
- 건강관리 방법, 생활습관, 복약 정보(복용 시간, 주의사항, 일반적인 부작용)를 쉽고 친절하게 안내합니다.
- 답변은 3~5문장으로 짧고 명확하게, 음성으로 들었을 때 이해하기 쉽게 작성합니다. 목록 기호나 마크다운은 쓰지 않습니다.
- 진단이나 처방은 하지 않고, 필요하면 의사·약사 상담을 권합니다.
- 응급 징후(가슴 통증, 호흡곤란, 의식 저하, 말이 어눌해짐, 심한 출혈, 낙상 등)가 보이면 가장 먼저 119 신고와 즉시 도움 요청을 안내합니다.`;

export const Route = createFileRoute("/api/health-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.4-mini",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...parsed.data.messages],
            max_completion_tokens: 600,
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          const message =
            res.status === 429
              ? "요청이 많습니다. 잠시 후 다시 시도해 주세요."
              : res.status === 402
                ? "AI 사용 크레딧이 부족합니다."
                : `답변 생성 실패 (${res.status})`;
          return Response.json({ error: message, detail }, { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        return Response.json({ reply: data.choices?.[0]?.message?.content ?? "" });
      },
    },
  },
});
