import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Gamepad2, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Layers, 
  Upload, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  { id: "all", label: "すべて", icon: Layers },
  { id: "action", label: "アクション", icon: Flame },
  { id: "puzzle", label: "パズル", icon: Sparkles },
  { id: "retro", label: "レトロ・アーケード", icon: Gamepad2 },
  { id: "casual", label: "カジュアル", icon: Zap },
  { id: "rpg", label: "RPG", icon: TrendingUp },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data, isLoading } = trpc.games.list.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: activeSearch || undefined,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-10 pb-12 sm:pt-16 sm:pb-20 border-b border-border/40">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-xs font-semibold text-indigo-300 shadow-sm animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                誰でも自作ゲームを投稿＆ブラウザで即プレイ！
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                ゲームをつくる、遊ぶ、広げる。<br />
                <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
                  新世代インディーゲーム投稿サイト
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                HTML5・CanvasゲームやWebゲームを自由にアップロード。管理者と利用者のセキュアなパスワード認証で、安心・快適なクリエイターコミュニティを提供します。
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                  <Input
                    placeholder="ゲーム名、説明文、クリエイター名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-card/80 backdrop-blur-md border-border text-sm focus:border-primary shadow-inner"
                  />
                </div>
                <Button type="submit" className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  検索
                </Button>
              </form>

              {/* Quick role explanation */}
              <div className="pt-3 flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <strong>利用者：</strong>ゲーム投稿・プレイ・評価・お気に入り登録
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <strong>管理者：</strong>投稿ゲームの審査・公開承認・管理権限
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* GAMES SECTION */}
        <section className="container pt-10">
          {/* Category Tabs */}
          <div className="flex items-center justify-between pb-6 flex-wrap gap-4 border-b border-border/50">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-indigo-500/30"
                        : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground">
              {data ? `全 ${data.total} 作品` : "読み込み中..."}
            </div>
          </div>

          {/* Games Grid */}
          <div className="pt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 rounded-xl bg-card border border-border animate-pulse" />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card/40 rounded-2xl border border-dashed border-border max-w-lg mx-auto">
                <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold">該当するゲームが見つかりませんでした</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  条件を変えて検索するか、あなたが新しいゲームを投稿してみましょう！
                </p>
                <div className="mt-5">
                  <Link href="/submit">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      最初のゲームを投稿する
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 bg-card/60 backdrop-blur-sm text-xs text-muted-foreground">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">GAME HUB</span>
            <span>— インディーゲーム投稿プラットフォーム</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/submit" className="hover:text-foreground">ゲーム投稿</Link>
            <Link href="/admin" className="hover:text-foreground">管理者用ポータル</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
