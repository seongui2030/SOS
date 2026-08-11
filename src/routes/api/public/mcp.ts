import { createFileRoute } from "@tanstack/react-router";
import { broadcastEmergency, type Receiver } from "@/lib/kakao-send.server";

/**
 * MCP(Model Context Protocol) 스타일 JSON-RPC 엔드포인트.
 * 도구: get_kakao_map_link, send_emergency_alert
 * 인증: send_emergency_alert 는 헤더 `x-kakao-access-token` (카카오 사용자 토큰) 필요.
 */

const TOOLS = [
  {
    name: "get_kakao_map_link",
    description: "GPS 좌표(위도/경도)로 카카오맵 위치 링크와 길찾기 링크를 생성합니다.",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        label: { type: "string", description: "지도에 표시할 장소 이름" },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "send_emergency_alert",
    description:
      "등록된 다수 수신자(엄마, 아빠, 형제, 보건선생님, 담임선생님 등)에게 환자 위치와 응급 구조 요청 메시지를 카카오톡으로 동시에 전송합니다.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" },
        mapUrl: { type: "string" },
        receivers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              relation: { type: "string" },
              uuid: { type: "string" },
            },
            required: ["name", "relation"],
          },
        },
      },
      required: ["message", "receivers"],
    },
  },
];

function kakaoLinks(latitude: number, longitude: number, label = "환자 위치") {
  const name = encodeURIComponent(label);
  return {
    mapUrl: `https://map.kakao.com/link/map/${name},${latitude},${longitude}`,
    routeUrl: `https://map.kakao.com/link/to/${name},${latitude},${longitude}`,
  };
}

function rpc(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}
function rpcError(id: unknown, code: number, message: string, status = 200) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } }, { status });
}

export const Route = createFileRoute("/api/public/mcp")({
  server: {
    handlers: {
      GET: async () => Response.json({ name: "malbeot-care-emergency", tools: TOOLS }),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { id?: unknown; method?: string; params?: Record<string, unknown> }
          | null;
        if (!body?.method) return rpcError(null, -32600, "Invalid Request", 400);
        const { id, method, params } = body;

        if (method === "initialize") {
          return rpc(id, {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "malbeot-care-emergency", version: "1.0.0" },
          });
        }
        if (method === "tools/list") return rpc(id, { tools: TOOLS });
        if (method !== "tools/call") return rpcError(id, -32601, `Unknown method: ${method}`);

        const name = params?.["name"] as string | undefined;
        const args = (params?.["arguments"] ?? {}) as Record<string, unknown>;

        if (name === "get_kakao_map_link") {
          const latitude = Number(args["latitude"]);
          const longitude = Number(args["longitude"]);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return rpcError(id, -32602, "latitude/longitude 값이 필요합니다.");
          }
          const links = kakaoLinks(latitude, longitude, (args["label"] as string) ?? "환자 위치");
          return rpc(id, {
            content: [{ type: "text", text: JSON.stringify(links) }],
            structuredContent: links,
          });
        }

        if (name === "send_emergency_alert") {
          const accessToken = request.headers.get("x-kakao-access-token");
          if (!accessToken) return rpcError(id, -32001, "x-kakao-access-token 헤더가 필요합니다.", 401);
          const receivers = args["receivers"] as Receiver[] | undefined;
          const message = args["message"] as string | undefined;
          if (!Array.isArray(receivers) || receivers.length === 0 || !message) {
            return rpcError(id, -32602, "message와 receivers가 필요합니다.");
          }
          const results = await broadcastEmergency({
            accessToken,
            receivers,
            message,
            mapUrl: (args["mapUrl"] as string | undefined) ?? null,
          });
          const payload = { sent: results.filter((r) => r.ok).length, total: results.length, results };
          return rpc(id, {
            content: [{ type: "text", text: JSON.stringify(payload) }],
            structuredContent: payload,
          });
        }

        return rpcError(id, -32601, `Unknown tool: ${name}`);
      },
    },
  },
});
