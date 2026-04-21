import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

// Lazy load pages for performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Leads = lazy(() => import("@/pages/Leads"));
const LeadDetail = lazy(() => import("@/pages/LeadDetail"));
const CrmBoard = lazy(() => import("@/pages/CrmBoard"));
const Outreach = lazy(() => import("@/pages/Outreach"));
const Search = lazy(() => import("@/pages/Search"));
const Admin = lazy(() => import("@/pages/Admin"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <Switch>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/register">
          <Register />
        </Route>
        <Route path="*">
          <Layout>
            <Switch>
              <Route path="/">
                <ProtectedRoute component={Dashboard} />
              </Route>
              <Route path="/leads/:id">
                {(params) => (
                  <ProtectedRoute component={LeadDetail} id={params.id} />
                )}
              </Route>
              <Route path="/leads">
                <ProtectedRoute component={Leads} />
              </Route>
              <Route path="/search">
                <ProtectedRoute component={Search} />
              </Route>
              <Route path="/admin">
                <ProtectedRoute component={Admin} />
              </Route>
              <Route path="/crm">
                <ProtectedRoute component={CrmBoard} />
              </Route>
              <Route path="/outreach">
                <ProtectedRoute component={Outreach} />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
