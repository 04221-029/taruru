import React from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";

export default function Favorites() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: favoriteGames, isLoading } = trpc.games.myFavorites.useQuery(
    undefined,
    { enabled: !!user }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="container py-8 max-w-6xl flex-1">
        <div className="pb-6 border-b border-border/60">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> トップに戻る
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            お気に入りゲーム一覧
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            あなたがブックマークしたお気に入りのゲームをいつでもすぐに遊べます。
          </p>
        </div>

        <div className="pt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : favoriteGames && favoriteGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border max-w-md mx-auto">
              <Heart className="w-12 h-12 text-rose-500/40 mx-auto mb-3" />
              <h3 className="text-base font-bold">お気に入りのゲームがありません</h3>
              <p className="text-xs text-muted-foreground mt-1">
                気になるゲームの詳細ページで「お気に入り」ボタンを押して登録してみましょう！
              </p>
              <Link href="/">
                <Button className="mt-5 bg-primary text-primary-foreground text-xs">ゲームを探しに行く</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
