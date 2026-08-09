import { useEffect, useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Gender = "male" | "female";

type Latest = {
  height_cm: number;
  weight_kg: number;
  gender: string;
  age: number;
  bmi: number;
  bmr: number;
  created_at: string;
  updated_at: string;
};

export function calcBmi(heightCm: number, weightKg: number) {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function calcBmr(heightCm: number, weightKg: number, age: number, gender: Gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return "저체중";
  if (bmi < 23) return "정상";
  if (bmi < 25) return "과체중";
  return "비만";
}

export function HealthDialog() {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [saving, setSaving] = useState(false);
  const [latest, setLatest] = useState<Latest | null>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const { data } = await supabase
        .from("healths")
        .select("height_cm,weight_kg,gender,age,bmi,bmr,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (!row) return;
      setLatest(row as Latest);
      setHeight(String(row.height_cm));
      setWeight(String(row.weight_kg));
      setAge(String(row.age));
      setGender(row.gender === "female" ? "female" : "male");
    })();
  }, [open]);

  const h = Number(height);
  const w = Number(weight);
  const a = Number(age);
  const valid = h > 50 && h < 260 && w > 10 && w < 400 && a > 0 && a < 130;
  const bmi = valid ? calcBmi(h, w) : null;
  const bmr = valid ? calcBmr(h, w, a, gender) : null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || bmi === null || bmr === null) {
      toast.error("키, 몸무게, 나이를 올바르게 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("로그인이 필요합니다.");
      const { error } = await supabase.from("healths").insert({
        user_id: user.id,
        height_cm: h,
        weight_kg: w,
        gender,
        age: a,
        bmi,
        bmr,
      });
      if (error) throw error;
      toast.success(`저장했습니다. BMI ${bmi} (${bmiLabel(bmi)}) · BMR ${bmr}kcal`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="건강 정보 입력"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          <HeartPulse className="size-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>내 건강 정보</DialogTitle>
          <DialogDescription>
            키·몸무게·성별·나이를 입력하면 BMI와 기초대사량(BMR)을 계산해 기록에 저장합니다.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={save}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="height">키 (cm)</Label>
              <Input
                id="height"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="h-12"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">몸무게 (kg)</Label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="h-12"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">나이</Label>
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                className="h-12"
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={gender === "male" ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setGender("male")}
                >
                  남성
                </Button>
                <Button
                  type="button"
                  variant={gender === "female" ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setGender("female")}
                >
                  여성
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">BMI</span>
              <span className="font-semibold text-foreground">
                {bmi === null ? "-" : `${bmi} (${bmiLabel(bmi)})`}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">기초대사량 (BMR)</span>
              <span className="font-semibold text-foreground">
                {bmr === null ? "-" : `${bmr} kcal/일`}
              </span>
            </div>
          </div>

          {latest && (
            <p className="text-xs text-muted-foreground">
              최근 기록: {new Date(latest.created_at).toLocaleString("ko-KR")} · BMI {latest.bmi} ·
              BMR {latest.bmr}kcal
            </p>
          )}

          <Button type="submit" size="lg" className="h-12 w-full" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            저장하기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
