import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./components/layout";
import Dashboard from "./pages/Dashboard";
import AccountManagement from "./pages/AccountManagement";
import RegionManagement from "./pages/RegionManagement";
import LogsPage from "./pages/Logs";
import ContentPage from "./pages/Content";
import { Toaster } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ScrapeStatusProvider } from "@/hooks/use-scrape-status";

function App() {
  return (
    <StrictMode>
      <ConfirmProvider>
        <ScrapeStatusProvider>
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
        </ScrapeStatusProvider>
      </ConfirmProvider>
    </StrictMode>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
