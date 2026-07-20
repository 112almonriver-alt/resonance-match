import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import Register from "./pages/Register";
import OnboardingGenres from "./pages/OnboardingGenres";
import OnboardingArtists from "./pages/OnboardingArtists";
import OnboardingSliders from "./pages/OnboardingSliders";
import Feed from "./pages/Feed";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Events from "./pages/Events";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />

      <Route
        path="/onboarding/*"
        element={
          <RequireAuth>
            <OnboardingProvider>
              <Routes>
                <Route path="genres" element={<OnboardingGenres />} />
                <Route path="artists" element={<OnboardingArtists />} />
                <Route path="sliders" element={<OnboardingSliders />} />
              </Routes>
            </OnboardingProvider>
          </RequireAuth>
        }
      />

      <Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
      <Route path="/matches" element={<RequireAuth><Matches /></RequireAuth>} />
      <Route path="/chat/:matchId" element={<RequireAuth><Chat /></RequireAuth>} />
      <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
    </Routes>
  );
}
