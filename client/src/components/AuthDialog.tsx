import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AuthDialogProps {
  triggerLabel?: string;
}

export function AuthDialog({ triggerLabel = "Sign in" }: AuthDialogProps) {
  const { login, register } = useAuth();
  const [open, setOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await login.mutateAsync({ email: loginEmail, password: loginPassword });
    setOpen(false);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    await register.mutateAsync({
      email: registerEmail,
      password: registerPassword,
    });
    setOpen(false);
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
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Save your likes, keep your streak, and unlock a personal dashboard.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
              {login.error && (
                <p className="text-sm text-red-300">
                  {login.error instanceof Error ? login.error.message : "Failed to sign in."}
                </p>
              )}
              <Button type="submit" className="w-full">
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form className="space-y-4" onSubmit={handleRegister}>
              <Input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
              />
              {register.error && (
                <p className="text-sm text-red-300">
                  {register.error instanceof Error ? register.error.message : "Failed to create account."}
                </p>
              )}
              <Button type="submit" className="w-full">
                {register.isPending ? "Creating..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
