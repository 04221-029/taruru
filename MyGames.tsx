import React from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gamepad2, Upload, Trash2, Eye, Edit3, ArrowLeft } from "lucide-react";

export default function MyGames() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const { data: games, isLoading: gamesLoading } = trpc.games.myGames.useQuery(
    undefined,
    { enabled: !!user }
  );

  const deleteMutation = trpc.games.delete.useMutation({
    onSuccess: () => {
      toast.success("ゲームを削除しました。");
      utils.games.myGames.invalidate();
      utils.games.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "削除に失敗しました。");
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="container py-20 text-center max-w-md mx-auto">
          <Gamepad2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold">ログインが必要です</h2>
          <Button onClick={() => setLocation("/")} className="mt-4 bg-primary text-primary-foreground">
            トップに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="container py-8 max-w-5xl flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> トップに戻る
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">あなたが投稿したゲーム</h1>
            <p className="text-xs text-muted-foreground">
              これまでに投稿したゲームの公開状態やプレイ状況を確認・管理できます。
            </p>
          </div>

          <Link href="/submit">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9">
              <Upload className="w-4 h-4 mr-1.5" /> 新しいゲームを投稿
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          {gamesLoading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">読み込み中...</div>
          ) : games && games.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map((g) => (
                <div key={g.id} className="p-4 bg-card rounded-xl border border-border flex gap-4">
                  <img
                    src={g.thumbnailUrl}
                    alt={g.title}
                    className="w-28 h-20 rounded-lg object-cover bg-secondary flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {g.category}
                        </Badge>
                        <Badge
                          className={`text-[10px] ${
                            g.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : g.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {g.status === "approved" ? "公開中" : g.status === "pending" ? "審査中" : "非承認"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-foreground mt-1 line-clamp-1">{g.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        プレイ: {g.playCount}回 | お気に入り: {g.favoriteCount}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
                      <Link href={`/games/${g.slug}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2">
                          <Eye className="w-3.5 h-3.5 mr-1" /> プレイ画面
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`「${g.title}」を削除してもよろしいですか？`)) {
                            deleteMutation.mutate({ id: g.id });
                          }
                        }}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> 削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-card rounded-xl border border-dashed border-border max-w-md mx-auto">
              <Gamepad2 className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">まだ投稿したゲームがありません</p>
              <p className="text-xs text-muted-foreground mt-1">
                自作のゲームコードやURLを投稿して、たくさんのプレイヤーに遊んでもらいましょう！
              </p>
              <Link href="/submit">
                <Button className="mt-4 bg-primary text-primary-foreground text-xs">
                  最初の作品を投稿する
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
