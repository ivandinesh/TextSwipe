import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appCopy } from "@/content/copy";
import { apiRequest } from "@/lib/queryClient";

function useResetToken() {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("token") || "";
  }, []);
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const token = useResetToken();
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const validateQuery = useQuery<{ valid: boolean; error?: string }>({
    queryKey: ["/api/auth/reset-password/validate", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(
        `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
        {
          credentials: "include",
        },
      );

      return response.json();
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password,
      });
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const validationError =
    !token
      ? appCopy.auth.resetInvalid
      : validateQuery.data && !validateQuery.data.valid
        ? validateQuery.data.error || appCopy.auth.resetInvalid
        : validateQuery.error instanceof Error
          ? validateQuery.error.message
          : "";

  return (
    <div className="editorial-shell neon-grid min-h-screen bg-background px-5 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
          {appCopy.home.badge}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{appCopy.auth.resetPageTitle}</h1>
        <p className="mt-3 text-muted-foreground">{appCopy.auth.resetPageDescription}</p>

        {success ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="font-medium text-emerald-100">{appCopy.auth.resetSuccessTitle}</p>
              <p className="mt-2 text-sm text-emerald-200/90">
                {appCopy.auth.resetSuccessDescription}
              </p>
            </div>
            <Button onClick={() => setLocation("/")}>{appCopy.auth.loginIdle}</Button>
          </div>
        ) : validationError ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm text-red-100">{validationError}</p>
            </div>
            <Button onClick={() => setLocation("/")}>{appCopy.auth.resetRequestFresh}</Button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await resetMutation.mutateAsync();
            }}
          >
            <Input
              type="password"
              placeholder={appCopy.auth.placeholders.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {resetMutation.error && (
              <p className="text-sm text-red-300">
                {resetMutation.error instanceof Error
                  ? resetMutation.error.message
                  : appCopy.auth.resetFallbackError}
              </p>
            )}
            <Button type="submit" className="w-full">
              {resetMutation.isPending ? appCopy.auth.resetPending : appCopy.auth.resetIdle}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
