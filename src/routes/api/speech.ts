import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ text: z.string().min(1).max(2000) });

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["OPENAI_API_KEY"];
        
        // 1. 키가 없을 때 클라이언트가 깨지지 않도록 JSON 형태로 에러 응답
        if (!apiKey) {
          return Response.json(
            { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
            { status: 500 }
          );
        }

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
        }

        // 2. OpenAI 공식 규격에 맞춘 요청 설정
        const res = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1", // 공식 TTS 모델 사용 (또는 tts-1-hd)
            input: parsed.data.text,
            voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer 중 선택
            response_format: "mp3",
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return Response.json(
            { error: `음성 생성 실패 (${res.status})`, detail },
            { status: res.status },
          );
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
// import { createFileRoute } from "@tanstack/react-router";
// import { z } from "zod";

// const Body = z.object({ text: z.string().min(1).max(2000) });

// export const Route = createFileRoute("/api/speech")({
//   server: {
//     handlers: {
//       POST: async ({ request }) => {
//         const apiKey = process.env["OPENAI_API_KEY"];
//         if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

//         const parsed = Body.safeParse(await request.json().catch(() => null));
//         if (!parsed.success) {
//           return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
//         }
//  // const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
//         const res = await fetch("https://api.openai.com/v1/audio/speech", {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${apiKey}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             model: "openai/gpt-4o-mini-tts",
//             input: parsed.data.text,
//             voice: "alloy",
//             response_format: "mp3",
//             instructions:
//               "따뜻하고 차분하게, 어르신이 알아듣기 쉽도록 조금 느리게 한국어로 읽어 주세요.",
//           }),
//         });

//         if (!res.ok) {
//           const detail = await res.text().catch(() => "");
//           return Response.json(
//             { error: `음성 생성 실패 (${res.status})`, detail },
//             { status: res.status },
//           );
//         }

//         return new Response(res.body, {
//           headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
//         });
//       },
//     },
//   },
// });
