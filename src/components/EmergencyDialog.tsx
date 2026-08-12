import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Loader2,
  MapPin,
  MessageSquare,
  PhoneCall,
  Plus,
  Send,
  Siren,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildEmergencyMessage,
  getCurrentCoords,
  kakaoMapRouteUrl,
  kakaoMapUrl,
  reverseGeocode,
  type Coords,
  type ResolvedAddress,
} from "@/lib/geo";
import { kakaoLogin, kakaoShareFallback } from "@/lib/kakao";

const RELATIONS = ["엄마", "아빠", "형제", "보건선생님", "담임선생님", "기타"] as const;

type Contact = {
  id: string;
  name: string;
  relation: string;
  phone: string | null;
  kakao_uuid: string | null;
  enabled: boolean;
};

type Props = { userName?: string | null; keywords?: string[] };

export function EmergencyDialog({ userName, keywords = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<ResolvedAddress | null>(null);
  const [form, setForm] = useState({ name: "", relation: "엄마", phone: "", kakao_uuid: "" });

  // 지도 링크 라벨에 정확한 지번 주소를 사용합니다.
  const placeLabel = address?.jibun ?? address?.road ?? `${userName ?? "환자"} 위치`;
  const mapUrl = coords ? kakaoMapUrl(coords, placeLabel) : null;
  const routeUrl = coords ? kakaoMapRouteUrl(coords, placeLabel) : null;

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("id, name, relation, phone, kakao_uuid, enabled")
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error("비상 연락처를 불러오지 못했습니다.");
      return;
    }
    setContacts((data ?? []) as Contact[]);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const next = await getCurrentCoords();
      setCoords(next);
      const resolved = await reverseGeocode(next);
      setAddress(resolved);
      toast.success(resolved?.display ? `현재 위치: ${resolved.display}` : "현재 위치를 확인했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "위치 확인에 실패했습니다.");
    } finally {
      setLocating(false);
    }
  }, []);

  const addContact = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("이름을 입력해 주세요.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: auth.user.id,
      name,
      relation: form.relation,
      phone: form.phone.trim() || null,
      kakao_uuid: form.kakao_uuid.trim() || null,
    });
    if (error) {
      toast.error("연락처 저장에 실패했습니다.");
      return;
    }
    setForm({ name: "", relation: "엄마", phone: "", kakao_uuid: "" });
    toast.success("비상 연락처를 추가했습니다.");
    void load();
  };

  const removeContact = async (id: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) {
      toast.error("삭제에 실패했습니다.");
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleContact = async (contact: Contact) => {
    const { error } = await supabase
      .from("emergency_contacts")
      .update({ enabled: !contact.enabled })
      .eq("id", contact.id);
    if (error) {
      toast.error("변경에 실패했습니다.");
      return;
    }
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, enabled: !c.enabled } : c)),
    );
  };

  /** 현재 좌표·주소를 확보해 알림 문구를 만듭니다. */
  const prepareMessage = async () => {
    let current = coords;
    let resolved = address;
    if (!current) {
      try {
        current = await getCurrentCoords();
        setCoords(current);
        resolved = await reverseGeocode(current);
        setAddress(resolved);
      } catch {
        current = null;
      }
    }
    const label = resolved?.jibun ?? resolved?.road ?? `${userName ?? "환자"} 위치`;
    const url = current ? kakaoMapUrl(current, label) : null;
    const message = buildEmergencyMessage({
      name: userName,
      coords: current,
      mapUrl: url,
      keywords,
      address: resolved?.jibun ?? resolved?.road ?? null,
    });
    return { current, url, message };
  };

  /** 보호자에게 문자(SMS) 발송 – 기기 메시지 앱으로 위치 문구를 채워 엽니다. */
  const sendSms = async (targets: Contact[]) => {
    const phones = targets.map((c) => c.phone).filter(Boolean) as string[];
    if (phones.length === 0) {
      toast.error("전화번호가 등록된 연락처가 없습니다.");
      return;
    }
    const { message } = await prepareMessage();
    const href = `sms:${phones.join(",")}?&body=${encodeURIComponent(message)}`;
    window.location.href = href;
  };

  const callContact = (contact: Contact) => {
    if (!contact.phone) {
      toast.error("전화번호가 없습니다.");
      return;
    }
    window.location.href = `tel:${contact.phone}`;
  };

  const sendAlerts = async () => {
    const receivers = contacts.filter((c) => c.enabled);
    if (receivers.length === 0) {
      toast.error("알림을 보낼 연락처를 먼저 등록해 주세요.");
      return;
    }
    setSending(true);
    try {
      const { current, url, message } = await prepareMessage();

      let sent = 0;
      try {
        const accessToken = await kakaoLogin();
        const res = await fetch("/api/kakao-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            message,
            mapUrl: url,
            receivers: receivers.map((c) => ({
              name: c.name,
              relation: c.relation,
              uuid: c.kakao_uuid,
            })),
          }),
        });
        const data = (await res.json()) as { sent?: number; error?: string };
        if (!res.ok) throw new Error(data.error ?? "카카오 전송 실패");
        sent = data.sent ?? 0;
        toast.success(`${receivers.length}명 중 ${sent}명에게 카카오톡 알림을 보냈습니다.`);
      } catch (error) {
        toast.error(
          `${error instanceof Error ? error.message : "카카오 전송 실패"} — 공유창으로 직접 보내주세요.`,
        );
        await kakaoShareFallback(message, url).catch(() => {});
      }

      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("emergency_alerts").insert({
          user_id: auth.user.id,
          latitude: current?.latitude ?? null,
          longitude: current?.longitude ?? null,
          map_url: url,
          message,
          recipient_count: receivers.length,
          results: [{ sent }],
        });
      }
    } finally {
      setSending(false);
    }
  };

  const enabled = contacts.filter((c) => c.enabled);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          aria-label="비상 알림"
          className="size-10 shrink-0 rounded-full sm:h-11 sm:w-auto sm:gap-2 sm:rounded-md sm:px-4"
        >
          <Siren className="size-5 sm:size-4" />
          <span className="hidden sm:inline">비상 알림</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] w-[95vw] gap-3 overflow-y-auto rounded-2xl p-4 sm:max-w-lg sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base sm:text-lg">응급 상황 알림</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            현재 위치의 지번 주소와 카카오맵 링크를 만들어 보호자·선생님께 동시에 전달합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 빠른 실행: 전화 · 문자 */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="h-12 justify-center"
            onClick={() => {
              const first = enabled.find((c) => c.phone) ?? contacts.find((c) => c.phone);
              if (!first) {
                toast.error("전화번호가 등록된 보호자가 없습니다.");
                return;
              }
              callContact(first);
            }}
          >
            <PhoneCall className="size-4" /> 보호자 전화
          </Button>
          <Button
            variant="secondary"
            className="h-12 justify-center"
            onClick={() => void sendSms(enabled.length > 0 ? enabled : contacts)}
          >
            <MessageSquare className="size-4" /> 문자 발송
          </Button>
        </div>

        <Card className="gap-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold sm:text-base">1. 내 위치 확인</p>
            <Button variant="secondary" size="sm" onClick={() => void locate()} disabled={locating}>
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              위치 가져오기
            </Button>
          </div>
          {coords ? (
            <div className="space-y-2 text-sm">
              <div className="rounded-xl bg-secondary/60 p-2.5">
                <p className="text-xs text-muted-foreground">지번 주소</p>
                <p className="text-sm font-medium break-words">
                  {address?.jibun ?? "주소를 확인하지 못했습니다."}
                </p>
                {address?.road && (
                  <p className="mt-1 text-xs text-muted-foreground break-words">
                    도로명: {address.road}
                    {address.building ? ` (${address.building})` : ""}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                위도 {coords.latitude.toFixed(6)} / 경도 {coords.longitude.toFixed(6)}
                {coords.accuracy ? ` (오차 약 ${Math.round(coords.accuracy)}m)` : ""}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button asChild size="sm" variant="outline">
                  <a href={mapUrl ?? "#"} target="_blank" rel="noreferrer">
                    카카오맵 열기
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={routeUrl ?? "#"} target="_blank" rel="noreferrer">
                    길찾기
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-2 sm:col-span-1"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `${address?.jibun ?? ""}\n${mapUrl ?? ""}`.trim(),
                    );
                    toast.success("주소와 링크를 복사했습니다.");
                  }}
                >
                  <Copy className="size-3.5" /> 주소·링크 복사
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground sm:text-sm">
              아직 위치를 확인하지 않았습니다. 전송 시 자동으로 다시 시도합니다.
            </p>
          )}
        </Card>

        <Card className="gap-3 p-3 sm:p-4">
          <p className="text-sm font-semibold sm:text-base">2. 수신자 등록</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">관계</Label>
              <Select
                value={form.relation}
                onValueChange={(value) => setForm((f) => ({ ...f, relation: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이름</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">전화번호 (선택)</Label>
              <Input
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="010-0000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">카카오 친구 UUID (선택)</Label>
              <Input
                value={form.kakao_uuid}
                onChange={(e) => setForm((f) => ({ ...f, kakao_uuid: e.target.value }))}
                placeholder="카카오 친구 uuid"
              />
            </div>
          </div>
          <Button onClick={() => void addContact()} className="h-11 w-full">
            <Plus className="size-4" /> 연락처 추가
          </Button>

          <div className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">불러오는 중…</p>}
            {!loading && contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">등록된 비상 연락처가 없습니다.</p>
            )}
            {contacts.map((contact) => (
              <div key={contact.id} className="rounded-2xl border border-border p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {contact.relation} · {contact.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {contact.phone ?? "전화번호 없음"}
                      {contact.kakao_uuid ? " · 카카오 연결됨" : ""}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="삭제"
                    onClick={() => void removeContact(contact.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!contact.phone}
                    onClick={() => callContact(contact)}
                  >
                    <PhoneCall className="size-3.5" /> 전화
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!contact.phone}
                    onClick={() => void sendSms([contact])}
                  >
                    <MessageSquare className="size-3.5" /> 문자
                  </Button>
                  <Button
                    size="sm"
                    variant={contact.enabled ? "secondary" : "outline"}
                    onClick={() => void toggleContact(contact)}
                  >
                    {contact.enabled ? "알림 켜짐" : "알림 꺼짐"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            size="lg"
            className="h-12 w-full"
            disabled={sending}
            onClick={() => void sendAlerts()}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            위치와 함께 비상 알림 보내기
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 w-full">
            <a href="tel:119">
              <PhoneCall className="size-4" /> 119 전화하기
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
