import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { appCopy } from "@/content/copy";
import Home from "@/pages/Home";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CoursesPage = lazy(() => import("@/pages/Courses"));
const CoursePlayerPage = lazy(() => import("@/pages/CoursePlayer"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/not-found"));

function RouteFallback() {
  return (
    <div className="editorial-shell neon-grid flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] px-6 py-4 text-center backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
          {appCopy.home.badge}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Loading your next screen...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/courses" component={CoursesPage} />
        <Route path="/courses/:courseId" component={CoursePlayerPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ErrorFallback({error, resetErrorBoundary}: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">{appCopy.errors.appCrashTitle}</h2>
      <div className="bg-red-50 p-4 rounded-lg max-w-md mx-auto">
        <pre className="text-sm text-red-800 whitespace-pre-wrap">{error.message}</pre>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {appCopy.errors.appCrashRetry}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
