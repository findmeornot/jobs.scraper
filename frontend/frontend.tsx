import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { queryClient } from "@/lib/query-client";
import Layout from "@/components/templates/layout";
import Dashboard from "./pages/dashboard";
import AccountManagement from "./pages/account-management";
import RegionManagement from "./pages/region-management";
import LogsPage from "./pages/logs";
import ContentPage from "./pages/content";
import { Toaster } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<AccountManagement />} />
                <Route path="/regions" element={<RegionManagement />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/content" element={<ContentPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
          <Toaster />
        </ConfirmProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
