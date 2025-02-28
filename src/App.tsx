
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import ProfileSetup from "@/pages/ProfileSetup";
import CitySelection from "@/pages/CitySelection";
import SwipeScreen from "@/pages/SwipeScreen";
import ChatScreen from "@/pages/ChatScreen";
import CrewInvite from "@/pages/CrewInvite";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/city-selection" element={<CitySelection />} />
        <Route path="/swipe" element={<SwipeScreen />} />
        <Route path="/messages" element={<ChatScreen />} />
        <Route path="/crew-invite" element={<CrewInvite />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
