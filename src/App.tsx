
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CitySelection from "./pages/CitySelection";
import ProfileSetup from "./pages/ProfileSetup";
import SwipeScreen from "./pages/SwipeScreen";
import ChatScreen from "./pages/ChatScreen";
import CrewInvite from "./pages/CrewInvite";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/invite" element={<CrewInvite />} />
        <Route path="/crew-invite" element={<CrewInvite />} /> {/* Added this route as an alias */}
        <Route path="/city-selection" element={<CitySelection />} />
        <Route path="/swipe" element={<SwipeScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
