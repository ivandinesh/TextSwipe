import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/hooks/use-auth";

interface AuthDialogProps {
  triggerLabel?: string;
  defaultTab?: "login" | "register";
}

export function AuthDialog({
  triggerLabel = appCopy.auth.trigger,
  defaultTab = "login",
}: AuthDialogProps) {
  const { forgotPassword, login, register } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"tabs" | "forgot">("tabs");
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await login.mutateAsync({ email: loginEmail, password: loginPassword });
    setLoginPassword("");
    setOpen(false);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    await register.mutateAsync({
      email: registerEmail,
      password: registerPassword,
    });
    setRegisterPassword("");
    setOpen(false);
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await forgotPassword.mutateAsync(forgotEmail);
    setForgotSuccess(response?.message || appCopy.auth.forgotSuccess);
  };

  const getFriendlyError = (error: unknown, fallback: string) => {
    if (!(error instanceof Error)) {
      return fallback;
    }

    const message = error.message.trim();
    if (!message) {
      return fallback;
    }

    return message
      .replace(/^\d{3}:\s*/, "")
      .replace(/^\{"error":"?/, "")
      .replace(/"\}$/, "");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setMode("tabs");
          setActiveTab(defaultTab);
          setForgotSuccess("");
        }
      }}
    >
      <DialogTrigger
        asChild
        onClick={() => {
          setMode("tabs");
          setActiveTab(defaultTab);
        }}
      >
        <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-foreground">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[rgba(13,18,34,0.96)] text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "forgot" ? appCopy.auth.forgotTitle : appCopy.auth.title}
          </DialogTitle>
          <DialogDescription>
            {mode === "forgot" ? appCopy.auth.forgotDescription : appCopy.auth.description}
          </DialogDescription>
        </DialogHeader>
        {mode === "forgot" ? (
          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <Input
              type="email"
              placeholder={appCopy.auth.placeholders.email}
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
            />
            {forgotSuccess && <p className="text-sm text-emerald-300">{forgotSuccess}</p>}
            {forgotPassword.error && !forgotSuccess && (
              <p className="text-sm text-red-300">
                {getFriendlyError(forgotPassword.error, appCopy.auth.forgotFallbackError)}
              </p>
            )}
            <Button type="submit" className="w-full">
              {forgotPassword.isPending ? appCopy.auth.forgotPending : appCopy.auth.forgotIdle}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode("tabs");
                setForgotSuccess("");
              }}
            >
              {appCopy.auth.backToLogin}
            </Button>
          </form>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
              <TabsTrigger value="login">{appCopy.auth.tabs.login}</TabsTrigger>
              <TabsTrigger value="register">{appCopy.auth.tabs.register}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <Input
                  type="email"
                  placeholder={appCopy.auth.placeholders.email}
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder={appCopy.auth.placeholders.password}
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary transition hover:text-primary/80"
                    onClick={() => {
                      setMode("forgot");
                      setForgotEmail(loginEmail);
                    }}
                  >
                    {appCopy.auth.forgotTrigger}
                  </button>
                </div>
                {login.error && (
                  <p className="text-sm text-red-300">
                    {getFriendlyError(login.error, appCopy.auth.loginFallbackError)}
                  </p>
                )}
                <Button type="submit" className="w-full">
                  {login.isPending ? appCopy.auth.loginPending : appCopy.auth.loginIdle}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form className="space-y-4" onSubmit={handleRegister}>
                <Input
                  type="email"
                  placeholder={appCopy.auth.placeholders.email}
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder={appCopy.auth.placeholders.password}
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                />
                {register.error && (
                  <p className="text-sm text-red-300">
                    {getFriendlyError(register.error, appCopy.auth.registerFallbackError)}
                  </p>
                )}
                <Button type="submit" className="w-full">
                  {register.isPending ? appCopy.auth.registerPending : appCopy.auth.registerIdle}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
