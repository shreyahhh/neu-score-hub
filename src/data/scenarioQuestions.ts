export interface ScenarioQuestion {
  id: number;
  text: string;
  type: 'reasoning' | 'empathy' | 'imagination' | 'critique';
  competencies: string[];
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  questions: ScenarioQuestion[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Team Meeting Interruption',
    description: `You're leading an important project meeting with 6 team members when a colleague interrupts repeatedly with off-topic questions. The meeting is running late, and you still have critical decisions to make. Some team members look frustrated, while others seem disengaged.`,
    questions: [
      {
        id: 1,
        text: 'What would you do in this situation? Explain your reasoning.',
        type: 'reasoning',
        competencies: ['reasoning', 'decision-making'],
      },
      {
        id: 2,
        text: 'How would you address the colleague behavior while maintaining team morale?',
        type: 'empathy',
        competencies: ['empathy', 'communication'],
      },
      {
        id: 3,
        text: 'What creative solutions could prevent this situation in future meetings?',
        type: 'imagination',
        competencies: ['creativity'],
      },
      {
        id: 4,
        text: 'Evaluate your proposed approach. What are its strengths and potential weaknesses?',
        type: 'critique',
        competencies: ['reasoning', 'decision-making'],
      },
    ],
  },
];
