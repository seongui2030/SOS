import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "로그인 · 말벗 케어" },
      {
        name: "description",
        content:
          "말벗 케어에 로그인하면 음성 대화 기록이 안전하게 저장되어 언제든 다시 보고 검색할 수 있습니다.",
      },
      {
        property: "og:title",
        content: "로그인 · 말벗 케어",
      },
      {
        property: "og:description",
        content:
          "로그인하면 음성 건강 상담 기록이 저장되고 검색할 수 있습니다.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void navigate({ to: "/" });
      }
    });
  }, [navigate]);

  const recordUser = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) return;

    const table = (supabase.from as unknown as (name: string) => {
      upsert: (values: Record<string, unknown>, options: { onConflict: string }) => Promise<unknown>;
    })("users");
    await table.upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: (user.user_metadata?.["full_name"] as string | undefined) ?? null,
      },
      { onConflict: "id" },
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        await recordUser();

        toast.success("가입이 완료되었습니다.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await recordUser();

        toast.success("로그인되었습니다.");
      }

      void navigate({ to: "/" });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "로그인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <HeartPulse className="mx-auto mb-4 h-12 w-12 text-primary" />

          <h1 className="text-3xl font-bold">말벗 케어</h1>

          <p className="mt-2 text-muted-foreground">
            로그인하면 음성 상담 기록이 저장되어 언제든 다시 듣고
            검색할 수 있어요.
          </p>
        </div>

        <Card className="gap-5 p-6">
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>

              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>

              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signup"
                    ? "new-password"
                    : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {mode === "signup"
                ? "가입하고 시작하기"
                : "로그인"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-full gap-2"
            disabled={loading}
            onClick={() => void google()}
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>

            구글 계정으로 계속하기
          </Button>

          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() =>
              setMode(
                mode === "signin"
                  ? "signup"
                  : "signin",
              )
            }
          >
            {mode === "signin"
              ? "처음이신가요? 새로 가입하기"
              : "이미 계정이 있어요, 로그인하기"}
          </button>
        </Card>
      </div>
    </main>
  );
}
