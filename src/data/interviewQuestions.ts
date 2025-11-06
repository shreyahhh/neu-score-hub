export interface InterviewQuestion {
  id: number;
  text: string;
  competency: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    text: "Tell me about a time when you had to work under tight deadlines. How did you manage your time and priorities?",
    competency: "Time Management"
  },
  {
    id: 2,
    text: "Describe a situation where you had to explain a complex technical concept to a non-technical audience. How did you approach it?",
    competency: "Communication"
  },
  {
    id: 3,
    text: "Tell me about a challenging problem you faced at work. How did you approach solving it?",
    competency: "Problem Solving"
  },
  {
    id: 4,
    text: "Describe a situation where you had to work with a difficult team member. How did you handle it?",
    competency: "Teamwork"
  },
  {
    id: 5,
    text: "Tell me about a time when you failed. What did you learn from the experience?",
    competency: "Self-Awareness"
  }
];
