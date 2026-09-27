import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, User, ShieldCheck, Mail, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<"user" | "admin">("user");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.user.name || data.user.username} としてログインしました！`);
      utils.auth.me.invalidate();
      onClose();
      // Reset
      setLoginUsername("");
      setLoginPassword("");
    },
    onError: (err) => {
      toast.error(err.message || "ログインに失敗しました。");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`アカウントを作成しログインしました！ (${data.user.role === 'admin' ? '管理者' : '利用者'})`);
      utils.auth.me.invalidate();
      onClose();
      // Reset
      setRegUsername("");
      setRegPassword("");
      setRegName("");
      setRegEmail("");
    },
    onError: (err) => {
      toast.error(err.message || "登録に失敗しました。");
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast.error("ユーザー名とパスワードを入力してください。");
      return;
    }
    loginMutation.mutate({
      username: loginUsername.trim(),
      password: loginPassword,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regName) {
      toast.error("ユーザー名、パスワード、表示名を入力してください。");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("パスワードは6文字以上で設定してください。");
      return;
    }
    registerMutation.mutate({
      username: regUsername.trim(),
      password: regPassword,
      name: regName.trim(),
      email: regEmail.trim() || undefined,
      role: regRole,
    });
  };

  const fillQuickAccount = (type: "admin" | "user") => {
    if (type === "admin") {
      setLoginUsername("admin");
      setLoginPassword("admin1234");
    } else {
      setLoginUsername("player1");
      setLoginPassword("user1234");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            アカウント認証 (管理者 / 利用者)
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            ゲームの投稿や管理、レビュー、お気に入り機能にはパスワード認証が必要です。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="login" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LogIn className="w-4 h-4" /> ログイン
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="w-4 h-4" /> 新規登録
            </TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login" className="space-y-4 pt-3">
            {/* Quick Demo Credentials Banner */}
            <div className="p-3 bg-secondary/80 rounded-lg border border-border text-xs space-y-2">
              <p className="font-semibold text-accent-foreground flex items-center gap-1 text-sky-400">
                <ShieldCheck className="w-4 h-4" /> クイックテスト用初期アカウント
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickAccount("admin")}
                  className="h-7 text-xs bg-indigo-950/40 border-indigo-500/50 hover:bg-indigo-900/60 text-indigo-300"
                >
                  管理者 (admin) 入力
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickAccount("user")}
                  className="h-7 text-xs bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
                >
                  利用者 (player1) 入力
                </Button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="login-username" className="text-xs">ユーザー名</Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    id="login-username"
                    placeholder="例: admin または player1"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="pl-9 bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-password" className="text-xs">パスワード</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-9 bg-input border-border"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "認証中..." : "ログインする"}
              </Button>
            </form>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register" className="space-y-3 pt-2">
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="reg-username" className="text-xs">ユーザー名 (半角英数)</Label>
                  <Input
                    id="reg-username"
                    placeholder="例: dev_taro"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="bg-input border-border"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-name" className="text-xs">表示名</Label>
                  <Input
                    id="reg-name"
                    placeholder="例: 太郎ゲームス"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="bg-input border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email" className="text-xs">メールアドレス (任意)</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="sample@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="pl-9 bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-password" className="text-xs">パスワード (6文字以上)</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="******"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-9 bg-input border-border"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <Label className="text-xs">アカウント権限の選択</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole("user")}
                    className={`p-2 rounded border text-left flex flex-col gap-0.5 transition-all ${
                      regRole === "user"
                        ? "border-sky-400 bg-sky-950/40 text-sky-200"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> 利用者 (一般)
                    </span>
                    <span className="text-[10px] text-muted-foreground">ゲームの投稿・プレイ・評価</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole("admin")}
                    className={`p-2 rounded border text-left flex flex-col gap-0.5 transition-all ${
                      regRole === "admin"
                        ? "border-indigo-400 bg-indigo-950/40 text-indigo-200"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 管理者
                    </span>
                    <span className="text-[10px] text-muted-foreground">全ゲームの審査・削除・権限管理</span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "登録中..." : "アカウントを登録してログイン"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
