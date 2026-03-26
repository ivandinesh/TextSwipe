import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { appCopy } from "@/content/copy";
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/AdminDashboard";
import CoursePlayerPage from "@/pages/CoursePlayer";
import CoursesPage from "@/pages/Courses";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import ResetPassword from "@/pages/ResetPassword";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/courses/:courseId" component={CoursePlayerPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
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
