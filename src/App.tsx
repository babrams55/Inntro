
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CitySelection from "./pages/CitySelection";
import ProfileSetup from "./pages/ProfileSetup";
import SwipeScreen from "./pages/SwipeScreen";
import ChatScreen from "./pages/ChatScreen";
import CrewInvite from "./pages/CrewInvite";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  console.log("Current pathname:", window.location.pathname);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/city-selection" element={<CitySelection />} />
        <Route path="/crew-invite" element={<CrewInvite />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/swipe" element={<SwipeScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
