import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import AuthForm from "./components/AuthForm";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import SMTPSetupGuide from "./components/SMTPSetupGuide";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Debug auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Global auth state change:', event, session?.user?.email);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <Router>
              <Routes>
                <Route path="/login" element={<AuthForm />} />
                <Route path="/smtp-setup" element={<SMTPSetupGuide />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Header />
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Header />
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<AuthForm />} />
              </Routes>
            </Router>
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;