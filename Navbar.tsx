import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";
import { 
  Gamepad2, 
  Upload, 
  ShieldCheck, 
  User, 
  LogOut, 
  LogIn, 
  Heart, 
  Layers, 
  Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");

  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("ログアウトしました。");
      utils.auth.me.invalidate();
      setLocation("/");
    },
  });

  const openAuth = (tab: "login" | "register") => {
    setAuthDefaultTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-indigo-200 to-sky-300 bg-clip-text text-transparent">
                GAME HUB
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium -mt-1 tracking-wide">
                インディーゲーム投稿ポータル
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link 
              href="/" 
              className={`transition-colors hover:text-primary ${
                location === "/" ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              ゲームを探す
            </Link>
            <Link 
              href="/category/action" 
              className={`transition-colors hover:text-primary ${
                location.startsWith("/category") ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              カテゴリー
            </Link>
            {user && (
              <Link 
                href="/favorites" 
                className={`flex items-center gap-1.5 transition-colors hover:text-primary ${
                  location === "/favorites" ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                <Heart className="w-4 h-4 text-rose-500" />
                お気に入り
              </Link>
            )}
            {user?.role === "admin" && (
              <Link 
                href="/admin" 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors ${
                  location.startsWith("/admin") ? "ring-1 ring-indigo-400 font-bold" : ""
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                管理者パネル
              </Link>
            )}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {/* Submit Game Button */}
            <Button
              onClick={() => {
                if (!user) {
                  toast.info("ゲームを投稿するにはログインが必要です。");
                  openAuth("login");
                } else {
                  setLocation("/submit");
                }
              }}
              className="bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-semibold shadow-md shadow-indigo-500/20 text-xs sm:text-sm h-9 px-3 sm:px-4"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              ゲームを投稿
            </Button>

            {/* User Profile / Login */}
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-secondary animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-border">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.name}`}
                      alt={user.name || "ユーザー"}
                      className="h-full w-full rounded-full object-cover bg-secondary"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border text-card-foreground" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user.name || user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground flex items-center gap-1 mt-1">
                        @{user.username || "oauth"}
                        {user.role === "admin" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            管理者
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                            利用者
                          </span>
                        )}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  
                  <DropdownMenuItem onClick={() => setLocation("/my-games")} className="cursor-pointer">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    投稿したゲーム管理
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setLocation("/favorites")} className="cursor-pointer">
                    <Heart className="w-4 h-4 mr-2 text-rose-500" />
                    お気に入り一覧
                  </DropdownMenuItem>

                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer text-indigo-400 focus:text-indigo-300">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      管理者ダッシュボード
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openAuth("login")}
                  className="h-9 text-xs border-border bg-secondary/60 hover:bg-secondary text-foreground"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  ログイン
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openAuth("register")}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                >
                  新規登録
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultTab={authDefaultTab}
      />
    </>
  );
}
