import React, { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Gamepad2, 
  Users, 
  Check, 
  X, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  AlertTriangle,
  UserCheck
} from "lucide-react";

export default function AdminDashboard() {
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "rejected">("all");

  const utils = trpc.useUtils();

  const { data: gamesData, isLoading: gamesLoading } = trpc.admin.listAllGames.useQuery({
    status: filterStatus,
  });

  const { data: usersData, isLoading: usersLoading } = trpc.admin.listUsers.useQuery();

  const updateStatusMutation = trpc.admin.updateGameStatus.useMutation({
    onSuccess: () => {
      toast.success("ゲームのステータスを更新しました！");
      utils.admin.listAllGames.invalidate();
      utils.games.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "更新に失敗しました。");
    },
  });

  const deleteGameMutation = trpc.admin.deleteGame.useMutation({
    onSuccess: () => {
      toast.success("ゲームを削除しました。");
      utils.admin.listAllGames.invalidate();
      utils.games.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "削除に失敗しました。");
    },
  });

  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("ユーザー権限を更新しました！");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "権限の変更に失敗しました。");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="container py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="container py-24 text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">管理者権限が必要です</h2>
          <p className="text-xs text-muted-foreground mt-2">
            このページは管理者（admin）アカウントのみアクセス可能です。管理者アカウントでログインしてください。
          </p>
          <Link href="/">
            <Button className="mt-6 bg-primary text-primary-foreground text-xs">トップに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="container py-8 max-w-6xl flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-xs font-bold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              管理者コントロールパネル
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">サイト総合管理</h1>
            <p className="text-xs text-muted-foreground">
              投稿されたゲームの審査・公開ステータス変更、おすすめ登録、ユーザーの権限設定を一元管理できます。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border text-xs py-1 px-3">
              ログイン中: {user.name} (@{user.username})
            </Badge>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="games" className="mt-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="games" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gamepad2 className="w-4 h-4" /> 投稿ゲーム管理 ({gamesData?.total ?? 0})
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" /> ユーザー・権限管理 ({usersData?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GAMES MODERATION */}
          <TabsContent value="games" className="mt-6 space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {(["all", "approved", "pending", "rejected"] as const).map((st) => (
                <Button
                  key={st}
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterStatus(st)}
                  className={`text-xs h-8 capitalize ${
                    filterStatus === st ? "bg-primary text-primary-foreground font-bold border-primary" : "bg-card border-border"
                  }`}
                >
                  {st === "all" ? "すべて" : st === "approved" ? "承認済み" : st === "pending" ? "審査待ち" : "却下"}
                </Button>
              ))}
            </div>

            {/* Games Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/70 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3">ゲーム</th>
                      <th className="p-3">投稿者</th>
                      <th className="p-3">カテゴリー</th>
                      <th className="p-3">状態</th>
                      <th className="p-3">おすすめ</th>
                      <th className="p-3 text-right">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {gamesLoading ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          読み込み中...
                        </td>
                      </tr>
                    ) : gamesData && gamesData.items.length > 0 ? (
                      gamesData.items.map((g) => (
                        <tr key={g.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={g.thumbnailUrl}
                                alt={g.title}
                                className="w-12 h-8 rounded object-cover bg-secondary"
                              />
                              <div>
                                <div className="font-bold text-foreground hover:text-primary">
                                  <Link href={`/games/${g.slug}`}>{g.title}</Link>
                                </div>
                                <div className="text-[10px] text-muted-foreground">slug: {g.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-foreground">{g.authorName}</td>
                          <td className="p-3 uppercase text-[11px] text-muted-foreground">{g.category}</td>
                          <td className="p-3">
                            {g.status === "approved" ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                承認済み
                              </Badge>
                            ) : g.status === "pending" ? (
                              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                                審査待ち
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]">
                                却下
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  gameId: g.id,
                                  status: g.status,
                                  isFeatured: !g.isFeatured,
                                })
                              }
                              className={`h-7 text-xs ${
                                g.isFeatured ? "text-amber-400 font-bold" : "text-muted-foreground"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              {g.isFeatured ? "注目中" : "通常"}
                            </Button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {g.status !== "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      gameId: g.id,
                                      status: "approved",
                                    })
                                  }
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" /> 承認
                                </Button>
                              )}
                              {g.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      gameId: g.id,
                                      status: "rejected",
                                    })
                                  }
                                  className="h-7 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-950/30"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" /> 却下
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`本当に「${g.title}」を削除しますか？`)) {
                                    deleteGameMutation.mutate({ gameId: g.id });
                                  }
                                }}
                                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          ゲームがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: USERS & ROLES */}
          <TabsContent value="users" className="mt-6 space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/70 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3">ユーザー</th>
                      <th className="p-3">ユーザー名</th>
                      <th className="p-3">現在のロール (権限)</th>
                      <th className="p-3">ログイン方式</th>
                      <th className="p-3">登録日</th>
                      <th className="p-3 text-right">権限切り替え</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          読み込み中...
                        </td>
                      </tr>
                    ) : usersData && usersData.length > 0 ? (
                      usersData.map((u) => (
                        <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username || u.name}`}
                                alt={u.name || "avatar"}
                                className="w-7 h-7 rounded-full bg-secondary"
                              />
                              <span className="font-bold text-foreground">{u.name || "未設定"}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">@{u.username || "oauth"}</td>
                          <td className="p-3">
                            {u.role === "admin" ? (
                              <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                                管理者 (admin)
                              </Badge>
                            ) : (
                              <Badge className="bg-secondary text-secondary-foreground text-[10px]">
                                利用者 (user)
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 capitalize text-muted-foreground">{u.loginMethod || "password"}</td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("ja-JP")}
                          </td>
                          <td className="p-3 text-right">
                            {u.role === "admin" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRoleMutation.mutate({ userId: u.id, role: "user" })}
                                className="h-7 text-xs border-border"
                                disabled={u.id === user.id} // prevent self-demotion
                              >
                                利用者に変更
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => updateUserRoleMutation.mutate({ userId: u.id, role: "admin" })}
                                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1" /> 管理者に昇格
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          ユーザーが存在しません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
