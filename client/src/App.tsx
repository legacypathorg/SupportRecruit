import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Apply from "./pages/Apply";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminApplicantDetail from "./pages/AdminApplicantDetail";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/apply"} component={Apply} />
      <Route path={"/admin"} component={AdminLogin} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/applicants/:id"} component={AdminApplicantDetail} />
      <Route path={"/admin/analytics"} component={AdminAnalytics} />
      <Route path={"/admin/emails"} component={AdminEmailTemplates} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
