import React from "react";
import { Link } from "wouter";
import { Game } from "../../../drizzle/schema";
import { Play, Heart, Eye, User, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_NAMES: Record<string, string> = {
  action: "アクション",
  puzzle: "パズル",
  retro: "レトロ・アーケード",
  rpg: "RPG",
  casual: "カジュアル",
  strategy: "ストラテジー",
};

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div className="glow-card group flex flex-col rounded-xl overflow-hidden bg-card border border-border/80 hover:border-primary/50 transition-all duration-300">
      {/* Thumbnail */}
      <Link href={`/games/${game.slug}`} className="relative aspect-video w-full overflow-hidden bg-secondary block">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-none text-[11px] font-semibold">
            {CATEGORY_NAMES[game.category] || game.category}
          </Badge>
          {game.isFeatured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none text-[11px] font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              注目
            </Badge>
          )}
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-white/90">
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" /> {game.playCount}
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <Heart className="w-3 h-3 fill-rose-500" /> {game.favoriteCount}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/games/${game.slug}`}>
            <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">
              {game.title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <User className="w-3.5 h-3.5 text-primary" />
            {game.authorName}
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            {new Date(game.createdAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </div>
    </div>
  );
}
