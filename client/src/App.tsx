import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthenticated } from "./lib/auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import CompanyPortal from "@/pages/company-portal";
import CompanyLogin from "@/pages/company-login";
import CompanyDashboard from "@/pages/company-dashboard";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function CompanyPrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const companyToken = localStorage.getItem('companyToken');
  if (!companyToken) {
    return <Redirect to="/company-login" />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/company-portal" component={() => <PrivateRoute component={CompanyPortal} />} />
      <Route path="/company-login" component={CompanyLogin} />
      <Route path="/company-dashboard" component={() => <CompanyPrivateRoute component={CompanyDashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
