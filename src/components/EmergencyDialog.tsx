import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Loader2,
  MapPin,
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
import { buildEmergencyMessage, getCurrentCoords, kakaoMapRouteUrl, kakaoMapUrl, type Coords } from "@/lib/geo";
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
  const [form, setForm] = useState({ name: "", relation: "엄마", phone: "", kakao_uuid: "" });

  const mapUrl = coords ? kakaoMapUrl(coords, `${userName ?? "환자"} 위치`) : null;

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
      toast.success("현재 위치를 확인했습니다.");
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

  const sendAlerts = async () => {
    const receivers = contacts.filter((c) => c.enabled);
    if (receivers.length === 0) {
      toast.error("알림을 보낼 연락처를 먼저 등록해 주세요.");
      return;
    }
    setSending(true);
    let current = coords;
    try {
      if (!current) {
        try {
          current = await getCurrentCoords();
          setCoords(current);
        } catch {
          current = null;
        }
      }
      const url = current ? kakaoMapUrl(current, `${userName ?? "환자"} 위치`) : null;
      const message = buildEmergencyMessage({
        name: userName,
        coords: current,
        mapUrl: url,
        keywords,
      });

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="gap-2">
          <Siren className="size-4" /> 비상 알림
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>응급 상황 알림</DialogTitle>
          <DialogDescription>
            현재 위치를 카카오맵 링크로 만들어 등록된 보호자·선생님께 동시에 전송합니다.
          </DialogDescription>
        </DialogHeader>

        <Card className="gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">1. 내 위치 확인</p>
            <Button variant="secondary" size="sm" onClick={() => void locate()} disabled={locating}>
              {locating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              위치 가져오기
            </Button>
          </div>
          {coords ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                위도 {coords.latitude.toFixed(6)} / 경도 {coords.longitude.toFixed(6)}
                {coords.accuracy ? ` (오차 약 ${Math.round(coords.accuracy)}m)` : ""}
              </p>
              <p className="break-all rounded-xl bg-muted p-2 text-xs">{mapUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={mapUrl ?? "#"} target="_blank" rel="noreferrer">
                    카카오맵 열기
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={coords ? kakaoMapRouteUrl(coords) : "#"} target="_blank" rel="noreferrer">
                    길찾기
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(mapUrl ?? "");
                    toast.success("링크를 복사했습니다.");
                  }}
                >
                  <Copy className="size-3.5" /> 링크 복사
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 위치를 확인하지 않았습니다. 전송 시 자동으로 다시 시도합니다.
            </p>
          )}
        </Card>

        <Card className="gap-3 p-4">
          <p className="font-semibold">2. 수신자 등록</p>
          <div className="grid grid-cols-2 gap-2">
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
          <Button onClick={() => void addContact()} className="w-full">
            <Plus className="size-4" /> 연락처 추가
          </Button>

          <div className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">불러오는 중…</p>}
            {!loading && contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">등록된 비상 연락처가 없습니다.</p>
            )}
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-2 rounded-2xl border border-border p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {contact.relation} · {contact.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contact.phone ?? "전화번호 없음"}
                    {contact.kakao_uuid ? " · 카카오 연결됨" : ""}
                  </p>
                </div>
                {contact.phone && (
                  <Button asChild size="icon" variant="ghost" aria-label="전화 걸기">
                    <a href={`tel:${contact.phone}`}>
                      <PhoneCall className="size-4" />
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={contact.enabled ? "secondary" : "outline"}
                  onClick={() => void toggleContact(contact)}
                >
                  {contact.enabled ? "알림 켜짐" : "알림 꺼짐"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="삭제"
                  onClick={() => void removeContact(contact.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            disabled={sending}
            onClick={() => void sendAlerts()}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            위치와 함께 비상 알림 보내기
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href="tel:119">
              <PhoneCall className="size-4" /> 119 전화하기
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
