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
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

const queryClient = new QueryClient();

function App() {
  const dashboardRef = useRef<any>(null);

  useEffect(() => {
    // Debug auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Global auth state change:", event, session?.user?.email);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SessionContextProvider supabaseClient={supabase}>
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
                        <Header fetchAllData={dashboardRef.current?.fetchAllData} />
                        <Dashboard ref={dashboardRef} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Header fetchAllData={dashboardRef.current?.fetchAllData} />
                        <Dashboard ref={dashboardRef} />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<AuthForm />} />
                </Routes>
              </Router>
            </AppProvider>
          </SessionContextProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
