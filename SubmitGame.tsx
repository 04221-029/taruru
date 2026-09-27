import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Gamepad2, Code2, Link as LinkIcon, Eye, Sparkles, CheckCircle2 } from "lucide-react";

const TEMPLATES: Record<string, { title: string; category: string; description: string; instructions: string; gameCode: string }> = {
  clicker: {
    title: "クリック・クリッカー (Cyber Clicker)",
    category: "casual",
    description: "画面の中心にあるエネルギークリスタルをクリックしてパワーを蓄積するクリッカーゲーム！アップグレードを購入して自動クリックを加速させよう！",
    instructions: "【操作方法】\nクリスタルをクリック：エネルギー獲得\nショップのアップグレードボタンをクリック：自動生成量アップ！",
    gameCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #0f172a; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; user-select: none; }
    #crystal { width: 140px; height: 140px; background: radial-gradient(circle, #38bdf8, #6366f1); border-radius: 50%; box-shadow: 0 0 35px rgba(56, 189, 248, 0.7); cursor: pointer; transition: transform 0.08s ease; display: flex; align-items: center; justify-content: center; font-size: 40px; }
    #crystal:active { transform: scale(0.92); }
    .score { font-size: 28px; font-weight: bold; margin-bottom: 20px; color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.5); }
    .btn { background: #1e293b; border: 1px solid #38bdf8; color: #fff; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 15px; }
    .btn:hover { background: #38bdf8; color: #000; }
  </style>
</head>
<body>
  <div class="score">⚡ エネルギー: <span id="val">0</span></div>
  <div id="crystal">💎</div>
  <button class="btn" id="upgrade">アップグレード購入 (コスト: 20) [+1/秒]</button>
  <script>
    let energy = 0, perSec = 0, cost = 20;
    const crystal = document.getElementById("crystal");
    const val = document.getElementById("val");
    const btn = document.getElementById("upgrade");

    crystal.onclick = () => {
      energy += 1;
      val.innerText = Math.floor(energy);
    };

    btn.onclick = () => {
      if(energy >= cost) {
        energy -= cost;
        perSec += 1;
        cost = Math.floor(cost * 1.5);
        btn.innerText = "アップグレード購入 (コスト: " + cost + ") [+" + (perSec+1) + "/秒]";
        val.innerText = Math.floor(energy);
      } else {
        alert("エネルギーが足りません！");
      }
    };

    setInterval(() => {
      energy += perSec;
      val.innerText = Math.floor(energy);
    }, 1000);
  </script>
</body>
</html>`
  },
  pong: {
    title: "シンプル・ピンポン (Retro Pong)",
    category: "retro",
    description: "AI対戦相手と戦うクラシックピンポンゲーム！相手の隙を突いてゴールを決めよう！",
    instructions: "【操作方法】\nマウスを上下に動かして左側のパドルを操作します。",
    gameCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #020617; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { background: #090d16; border: 2px solid #6366f1; border-radius: 6px; box-shadow: 0 0 20px rgba(99,102,241,0.4); }
  </style>
</head>
<body>
  <canvas id="c" width="500" height="320"></canvas>
  <script>
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    let p1 = 120, p2 = 120, bx = 250, by = 160, bdx = 3.5, bdy = 2.5;
    let s1 = 0, s2 = 0;

    c.addEventListener('mousemove', e => {
      const rect = c.getBoundingClientRect();
      p1 = e.clientY - rect.top - 30;
    });

    function loop() {
      // AI
      if(by > p2 + 30) p2 += 2.5;
      else if(by < p2 + 30) p2 -= 2.5;

      bx += bdx; by += bdy;
      if(by < 0 || by > c.height) bdy = -bdy;

      // collision p1
      if(bx < 20 && by > p1 && by < p1 + 60) { bdx = Math.abs(bdx); }
      // collision p2
      if(bx > c.width - 20 && by > p2 && by < p2 + 60) { bdx = -Math.abs(bdx); }

      if(bx < 0) { s2++; bx = 250; by = 160; bdx = 3.5; }
      if(bx > c.width) { s1++; bx = 250; by = 160; bdx = -3.5; }

      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(10, p1, 10, 60);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(c.width - 20, p2, 10, 60);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI*2); ctx.fill();

      ctx.font = 'bold 20px monospace';
      ctx.fillText(s1 + " : " + s2, c.width/2 - 25, 30);
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
  }
};

export default function SubmitGame() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("action");
  const [thumbnailUrl, setThumbnailUrl] = useState("https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80");
  const [gameType, setGameType] = useState<"html5" | "embed" | "external">("html5");
  const [gameCode, setGameCode] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  const createGameMutation = trpc.games.create.useMutation({
    onSuccess: (game) => {
      toast.success("ゲームが正常に投稿されました！");
      setLocation(`/games/${game.slug}`);
    },
    onError: (err) => {
      toast.error(err.message || "ゲームの投稿に失敗しました。");
    },
  });

  const handleApplyTemplate = (key: string) => {
    const tmpl = TEMPLATES[key];
    if (tmpl) {
      setTitle(tmpl.title);
      setCategory(tmpl.category);
      setDescription(tmpl.description);
      setInstructions(tmpl.instructions);
      setGameCode(tmpl.gameCode);
      setGameType("html5");
      toast.info(`「${tmpl.title}」テンプレートを適用しました！`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("タイトルと説明文を入力してください。");
      return;
    }
    if (gameType === "html5" && !gameCode) {
      toast.error("HTML5ゲームのコードを入力してください。テンプレートを使用することも可能です。");
      return;
    }
    if ((gameType === "embed" || gameType === "external") && !externalUrl) {
      toast.error("ゲームのURLを入力してください。");
      return;
    }

    createGameMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim() || undefined,
      category,
      thumbnailUrl,
      gameType,
      gameCode: gameType === "html5" ? gameCode : undefined,
      externalUrl: (gameType === "embed" || gameType === "external") ? externalUrl.trim() : undefined,
    });
  };

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
          <p className="text-xs text-muted-foreground mt-2">
            ゲームを投稿するには、利用者または管理者アカウントでログインしてください。
          </p>
          <Button onClick={() => setLocation("/")} className="mt-6 bg-primary text-primary-foreground">
            トップに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="container py-10 max-w-4xl flex-1">
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Upload className="w-3.5 h-3.5" />
            クリエイター向け投稿フォーム
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">新しいゲームを投稿する</h1>
          <p className="text-xs text-muted-foreground">
            HTML5/Canvasゲームのコードを貼り付けるか、外部URLを指定して公開できます。
          </p>
        </div>

        {/* Quick Templates Bar */}
        <div className="p-4 bg-card rounded-xl border border-border/80 mb-8 space-y-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            すぐ試せるサンプルテンプレートから作成：
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyTemplate("clicker")}
              className="text-xs bg-secondary border-border"
            >
              💎 クリッカーゲーム テンプレート
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyTemplate("pong")}
              className="text-xs bg-secondary border-border"
            >
              🏓 ピンポン対戦 テンプレート
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-2xl border border-border/80">
          {/* Game Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">ゲームのタイトル *</Label>
            <Input
              id="title"
              placeholder="例: サイバー・ブレイクアウト"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">カテゴリー *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="action">アクション</SelectItem>
                  <SelectItem value="puzzle">パズル</SelectItem>
                  <SelectItem value="retro">レトロ・アーケード</SelectItem>
                  <SelectItem value="casual">カジュアル</SelectItem>
                  <SelectItem value="rpg">RPG</SelectItem>
                  <SelectItem value="strategy">ストラテジー</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Game Format */}
            <div className="space-y-1.5">
              <Label htmlFor="gameType" className="text-xs font-semibold">提供形式 *</Label>
              <Select value={gameType} onValueChange={(val: any) => setGameType(val)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="形式を選択" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="html5">HTML5コード (直接実行)</SelectItem>
                  <SelectItem value="embed">外部iframe埋め込みURL</SelectItem>
                  <SelectItem value="external">外部リンクのみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1.5">
            <Label htmlFor="thumbnailUrl" className="text-xs font-semibold">サムネイル画像URL *</Label>
            <Input
              id="thumbnailUrl"
              placeholder="https://images.unsplash.com/..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="bg-input border-border"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              ゲームカードや詳細ヘッダーに表示される画像のURLを指定します。
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">作品の紹介文 *</Label>
            <Textarea
              id="description"
              placeholder="ゲームの特徴、ストーリー、見どころなどを入力してください..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-input border-border min-h-[90px] text-xs"
              required
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="instructions" className="text-xs font-semibold">操作方法・ルール (任意)</Label>
            <Textarea
              id="instructions"
              placeholder="【キー操作】矢印キーで移動、スペースでジャンプ..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="bg-input border-border min-h-[80px] text-xs font-mono"
            />
          </div>

          {/* HTML5 Game Code OR Embed URL */}
          {gameType === "html5" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gameCode" className="text-xs font-semibold flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-primary" />
                  HTML5 / JavaScript / CSS ゲームコード *
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewTab("edit")}
                    className={`h-7 text-xs ${previewTab === "edit" ? "bg-secondary font-bold" : ""}`}
                  >
                    エディタ
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewTab("preview")}
                    className={`h-7 text-xs ${previewTab === "preview" ? "bg-secondary font-bold" : ""}`}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> プレビュー
                  </Button>
                </div>
              </div>

              {previewTab === "edit" ? (
                <Textarea
                  id="gameCode"
                  placeholder="<!DOCTYPE html><html><head>...</head><body><canvas></canvas><script>...</script></body></html>"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  className="bg-slate-950 font-mono text-xs min-h-[220px] text-emerald-400 border-border"
                />
              ) : (
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
                  <iframe
                    title="Preview"
                    srcDoc={gameCode}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="externalUrl" className="text-xs font-semibold flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-primary" />
                ゲームの公開URL *
              </Label>
              <Input
                id="externalUrl"
                placeholder="https://..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
              className="text-xs border-border"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={createGameMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-6"
            >
              {createGameMutation.isPending ? "投稿中..." : "ゲームを投稿して公開する"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
