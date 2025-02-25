
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CitySelection from "./pages/CitySelection";
import CrewInvite from "./pages/CrewInvite";
import ProfileSetup from "./pages/ProfileSetup";
import SwipeScreen from "./pages/SwipeScreen";
import ChatScreen from "./pages/ChatScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/city-selection" element={<CitySelection />} />
          <Route path="/crew-invite" element={<CrewInvite />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/swipe" element={<SwipeScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
