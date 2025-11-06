import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScoringConfigProvider } from "@/context/ScoringConfigContext";
import { Sidebar } from "@/components/Sidebar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Game pages
import MentalMathEasy from "./pages/games/MentalMathEasy";
import FaceNameMatchEasy from "./pages/games/FaceNameMatchEasy";
import SignSudokuEasy from "./pages/games/SignSudokuEasy";
import StroopTestStandard from "./pages/games/StroopTestStandard";
import CardFlipEasy from "./pages/games/CardFlipEasy";
import ScenarioChallenge from "./pages/games/ScenarioChallenge";
import DebateMode from "./pages/games/DebateMode";
import CreativeUses from "./pages/games/CreativeUses";
import Interview from "./pages/games/Interview";
import PatternSudoku from "./pages/games/PatternSudoku";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ScoringConfigProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen w-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Game Routes */}
                <Route path="/games/mental-math-easy" element={<MentalMathEasy />} />
                <Route path="/games/face-name-match-easy" element={<FaceNameMatchEasy />} />
                <Route path="/games/sign-sudoku-easy" element={<SignSudokuEasy />} />
                <Route path="/games/stroop-test-standard" element={<StroopTestStandard />} />
                <Route path="/games/card-flip-easy" element={<CardFlipEasy />} />
                <Route path="/games/scenario-challenge" element={<ScenarioChallenge />} />
                <Route path="/games/debate-mode" element={<DebateMode />} />
                <Route path="/games/creative-uses" element={<CreativeUses />} />
                <Route path="/games/interview" element={<Interview />} />
                <Route path="/games/pattern-sudoku" element={<PatternSudoku />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ScoringConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
