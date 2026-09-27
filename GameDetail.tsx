import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Heart, 
  RotateCcw, 
  Maximize2, 
  User, 
  Star, 
  Share2, 
  Calendar, 
  Sparkles,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function GameDetail() {
  const [, params] = useRoute("/games/:slug");
  const slug = params?.slug || "";

  const [isPlaying, setIsPlaying] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const { data: game, isLoading, error } = trpc.games.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { data: reviews } = trpc.reviews.list.useQuery(
    { gameId: game?.id || 0 },
    { enabled: !!game?.id }
  );

  const { data: favData } = trpc.games.isFavorited.useQuery(
    { gameId: game?.id || 0 },
    { enabled: !!game?.id && !!user }
  );

  const incrementPlayMutation = trpc.games.incrementPlay.useMutation();
  const toggleFavoriteMutation = trpc.games.toggleFavorite.useMutation({
    onSuccess: (data) => {
      toast.success(data.isFavorited ? "お気に入りに追加しました！" : "お気に入りを解除しました。");
      utils.games.isFavorited.invalidate({ gameId: game?.id || 0 });
      utils.games.getBySlug.invalidate({ slug });
    },
  });

  const addReviewMutation = trpc.reviews.add.useMutation({
    onSuccess: () => {
      toast.success("レビューを投稿しました！");
      setComment("");
      utils.reviews.list.invalidate({ gameId: game?.id || 0 });
    },
    onError: (err) => {
      toast.error(err.message || "レビューの投稿に失敗しました。");
    },
  });

  const handleStartPlay = () => {
    setIsPlaying(true);
    if (game?.id) {
      incrementPlayMutation.mutate({ gameId: game.id });
    }
  };

  const handleResetGame = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = game?.gameCode || "";
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("ゲームのURLをクリップボードにコピーしました！");
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("レビューを投稿するにはログインが必要です。");
      return;
    }
    if (!game?.id) return;
    addReviewMutation.mutate({
      gameId: game.id,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="container py-16 flex justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-xl font-bold">ゲームが見つかりませんでした</h2>
          <Link href="/">
            <Button className="mt-4 bg-primary text-primary-foreground">トップに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="container py-8 flex-1 max-w-5xl">
        {/* Back link */}
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" />
            ゲーム一覧に戻る
          </Link>
        </div>

        {/* GAME HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase bg-secondary text-secondary-foreground border-border">
                {game.category}
              </Badge>
              {game.isFeatured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> おすすめ作品
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              {game.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                {game.authorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(game.createdAt).toLocaleDateString("ja-JP")}
              </span>
              <span>プレイ回数: {game.playCount}回</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!user) {
                  toast.error("お気に入り登録にはログインが必要です。");
                  return;
                }
                toggleFavoriteMutation.mutate({ gameId: game.id });
              }}
              className={`h-9 text-xs border-border ${
                favData?.isFavorited ? "bg-rose-950/40 border-rose-500/50 text-rose-300" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 mr-1.5 ${favData?.isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
              {favData?.isFavorited ? "お気に入り済み" : "お気に入り"} ({game.favoriteCount})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 text-xs border-border bg-secondary text-secondary-foreground"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              共有
            </Button>
          </div>
        </div>

        {/* GAME PLAY AREA */}
        <div className="mt-6 rounded-2xl overflow-hidden bg-card border border-border shadow-2xl relative">
          {!isPlaying ? (
            <div className="relative aspect-video w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
              <img
                src={game.thumbnailUrl}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs"
              />
              <div className="relative z-10 text-center space-y-4 px-4">
                <div className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/50 hover:scale-110 transition-transform cursor-pointer" onClick={handleStartPlay}>
                  <Play className="w-10 h-10 fill-white ml-1.5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">今すぐプレイ</h2>
                  <p className="text-xs text-slate-300 mt-1">クリックしてゲーム画面を起動します</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Play toolbar */}
              <div className="bg-secondary/90 px-4 py-2 border-b border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ゲーム起動中
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleResetGame} className="h-7 text-xs">
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> リセット
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleFullscreen} className="h-7 text-xs">
                    <Maximize2 className="w-3.5 h-3.5 mr-1" /> 全画面
                  </Button>
                </div>
              </div>

              {/* Iframe */}
              <div className="w-full aspect-video bg-black">
                {game.gameType === "html5" && game.gameCode ? (
                  <iframe
                    ref={iframeRef}
                    title={game.title}
                    srcDoc={game.gameCode}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                  />
                ) : game.externalUrl ? (
                  <iframe
                    title={game.title}
                    src={game.externalUrl}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    ゲームコードが設定されていません
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DETAILS & INSTRUCTIONS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card p-6 rounded-xl border border-border/80">
              <h2 className="text-base font-bold text-foreground">作品説明</h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                {game.description}
              </p>
            </div>

            {game.instructions && (
              <div className="bg-card p-6 rounded-xl border border-border/80">
                <h2 className="text-base font-bold text-foreground">操作方法・ルール</h2>
                <div className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap bg-secondary/50 p-4 rounded-lg border border-border/40 font-mono text-xs">
                  {game.instructions}
                </div>
              </div>
            )}

            {/* REVIEWS SECTION */}
            <div className="bg-card p-6 rounded-xl border border-border/80 space-y-6">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                プレイヤーレビュー ({reviews ? reviews.length : 0})
              </h2>

              {/* Add Review Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-3 p-4 bg-secondary/40 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">評価をつける:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? "fill-amber-400" : "text-muted"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder={user ? "ゲームを遊んだ感想や応援メッセージを入力..." : "レビューを投稿するにはログインしてください"}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!user || addReviewMutation.isPending}
                  className="bg-input border-border text-xs min-h-[70px]"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!user || addReviewMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                  >
                    {addReviewMutation.isPending ? "送信中..." : "レビューを投稿"}
                  </Button>
                </div>
              </form>

              {/* Review list */}
              <div className="space-y-3">
                {reviews && reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-secondary/30 rounded-lg border border-border/50 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{rev.userName}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-muted-foreground">{rev.comment}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70">
                        {new Date(rev.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    まだレビューはありません。最初のレビューを投稿してみましょう！
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR CREATOR INFO */}
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-xl border border-border/80 space-y-4">
              <h3 className="text-sm font-bold text-foreground">クリエイター</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-lg text-primary">
                  {game.authorName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{game.authorName}</div>
                  <div className="text-xs text-muted-foreground">公認クリエイター</div>
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border/80 space-y-3 text-xs text-muted-foreground">
              <h3 className="text-sm font-bold text-foreground">作品情報</h3>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>形式</span>
                <span className="text-foreground uppercase font-mono">{game.gameType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>カテゴリー</span>
                <span className="text-foreground">{game.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>公開状態</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 承認済み
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
