"use client";

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Brain, 
  Calculator, 
  Users, 
  Grid3x3, 
  Eye, 
  CreditCard, 
  MessageSquare, 
  Lightbulb,
  Settings,
  Home,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoringControlsModal } from './ScoringControlsModal';
import { cn } from '@/lib/utils';

const games = [
  { name: 'Mental Math Sprint', path: '/games/mental-math-easy', icon: Calculator },
  { name: 'Face-Name Match', path: '/games/face-name-match-easy', icon: Users },
  { name: 'Sign Sudoku', path: '/games/sign-sudoku-easy', icon: Grid3x3 },
  { name: 'Stroop Test', path: '/games/stroop-test-standard', icon: Eye },
  { name: 'Card Flip Challenge', path: '/games/card-flip-easy', icon: CreditCard },
  { name: 'Scenario Challenge', path: '/games/scenario-challenge', icon: MessageSquare },
  { name: 'Debate Mode', path: '/games/debate-mode', icon: MessageSquare },
  { name: 'Creative Uses', path: '/games/creative-uses', icon: Lightbulb },
];

export function Sidebar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">NeuRazor</h1>
              <p className="text-xs text-sidebar-foreground/60">Scoring Testbed</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'hover:bg-sidebar-accent/50'
              )
            }
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </NavLink>

          <div className="mt-6">
            <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              Cognitive Games
            </h2>
            <div className="space-y-1">
              {games.map((game) => {
                const Icon = game.icon;
                return (
                  <NavLink
                    key={game.path}
                    to={game.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm flex-1">{game.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer - Scoring Controls */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="w-full justify-start gap-2 border-sidebar-border hover:bg-sidebar-accent"
          >
            <Settings className="w-4 h-4" />
            Scoring Controls
          </Button>
        </div>
      </aside>

      <ScoringControlsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
