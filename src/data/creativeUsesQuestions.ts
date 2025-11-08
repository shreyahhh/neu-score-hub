export interface CreativeUsesQuestion {
  id: number;
  object: string;
  description: string;
}

export const CREATIVE_USES_QUESTIONS: CreativeUsesQuestion[] = [
  {
    id: 1,
    object: "Brick",
    description: "How many possible uses can you think of for a brick?"
  },
  {
    id: 2,
    object: "Paperclip",
    description: "How many possible uses can you think of for a paperclip?"
  },
  {
    id: 3,
    object: "Plastic Bottle",
    description: "How many possible uses can you think of for a plastic bottle?"
  }
];
