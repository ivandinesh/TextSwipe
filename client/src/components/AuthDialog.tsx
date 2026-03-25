import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/hooks/use-auth";

interface AuthDialogProps {
  triggerLabel?: string;
}

export function AuthDialog({ triggerLabel = appCopy.auth.trigger }: AuthDialogProps) {
  const { login, register } = useAuth();
  const [open, setOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-foreground">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[rgba(13,18,34,0.96)] text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{appCopy.auth.title}</DialogTitle>
          <DialogDescription>
            {appCopy.auth.description}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
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
      </DialogContent>
    </Dialog>
  );
}
