import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { broadcastEmergency } from "@/lib/kakao-send.server";

const Body = z.object({
  accessToken: z.string().min(10),
  message: z.string().min(1).max(2000),
  mapUrl: z.string().url().nullable().optional(),
  receivers: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        relation: z.string().min(1).max(40),
        uuid: z.string().max(120).nullable().optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const Route = createFileRoute("/api/kakao-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
        }
        try {
          const results = await broadcastEmergency({
            accessToken: parsed.data.accessToken,
            receivers: parsed.data.receivers,
            message: parsed.data.message,
            mapUrl: parsed.data.mapUrl ?? null,
          });
          const sent = results.filter((r) => r.ok).length;
          return Response.json({ sent, total: results.length, results });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "전송에 실패했습니다." },
            { status: 502 },
          );
        }
      },
    },
  },
});
