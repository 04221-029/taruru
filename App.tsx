import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Home from "./pages/Home";
import GameDetail from "./pages/GameDetail";
import SubmitGame from "./pages/SubmitGame";
import AdminDashboard from "./pages/AdminDashboard";
import MyGames from "./pages/MyGames";
import Favorites from "./pages/Favorites";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games/:slug" component={GameDetail} />
      <Route path="/submit" component={SubmitGame} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/my-games" component={MyGames} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/category/:category" component={Home} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
