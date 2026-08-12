import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type KakaoAddress = {
  documents?: Array<{
    address?: { address_name?: string; region_3depth_name?: string; main_address_no?: string; sub_address_no?: string } | null;
    road_address?: { address_name?: string; building_name?: string } | null;
  }>;
};

export const Route = createFileRoute("/api/geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const restKey = process.env["KAKAO_REST_API_KEY"];
        if (!restKey) {
          return Response.json({ error: "카카오 REST 키가 설정되지 않았습니다." }, { status: 500 });
        }
        const url = new URL(request.url);
        const parsed = Query.safeParse({ lat: url.searchParams.get("lat"), lng: url.searchParams.get("lng") });
        if (!parsed.success) {
          return Response.json({ error: "좌표가 올바르지 않습니다." }, { status: 400 });
        }

        const api = new URL("https://dapi.kakao.com/v2/local/geo/coord2address.json");
        api.searchParams.set("x", String(parsed.data.lng));
        api.searchParams.set("y", String(parsed.data.lat));
        api.searchParams.set("input_coord", "WGS84");

        const res = await fetch(api, { headers: { Authorization: `KakaoAK ${restKey}` } });
        if (!res.ok) {
          return Response.json({ error: "주소 조회에 실패했습니다." }, { status: 502 });
        }
        const data = (await res.json()) as KakaoAddress;
        const doc = data.documents?.[0];
        const jibun = doc?.address?.address_name ?? null;
        const road = doc?.road_address?.address_name ?? null;
        const building = doc?.road_address?.building_name || null;

        return Response.json({
          jibun,
          road,
          building,
          display: jibun ?? road ?? null,
        });
      },
    },
  },
});
