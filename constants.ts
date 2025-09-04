
import { QuizQuestion, Meme, DeveloperProfile } from './types';

export const MEME_BASE_URL = (import.meta as any).env?.VITE_MEME_BASE_URL || '/memes/';

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Preferred work schedule",
    type: "cards",
    options: [
      "Morning",
      "Night", 
      "Flexible"
    ]
  },
  {
    id: 2,
    question: "Terminal preference",
    type: "cards",
    options: [
      "Customized Zsh/Fish",
      "Default Bash",
      "Modern GUI terminal"
    ]
  },
  {
    id: 3,
    question: "Debugging stress level (0–100)",
    type: "slider",
    min: 0,
    max: 100,
    default: 50
  },
  {
    id: 4,
    question: "Tabs or spaces",
    type: "toggle",
    options: ["Tabs", "Spaces"]
  },
  {
    id: 5,
    question: "Project management style",
    type: "cards",
    options: [
      "Kanban board",
      "GitHub Issues", 
      "Documentation-first"
    ]
  },
  {
    id: 6,
    question: "Preferred state management",
    type: "cards",
    options: [
      "Context API",
      "Zustand/Jotai",
      "Redux/Redux-Saga"
    ]
  },
  {
    id: 7,
    question: "Theme preference",
    type: "toggle",
    options: ["Light", "Dark"]
  },
  {
    id: 8,
    question: "Naming convention",
    type: "cards",
    options: [
      "camelCase",
      "PascalCase",
      "snake_case"
    ]
  },
  {
    id: 9,
    question: "Documentation importance (0–100)",
    type: "slider",
    min: 0,
    max: 100,
    default: 50
  },
  {
    id: 10,
    question: "Ideal work environment",
    type: "cards",
    options: [
      "Single laptop",
      "Multi‑monitor desk",
      "Coffee shop/Co‑working"
    ]
  }
];

export const MEMES = [
  {
    id: "f12-hacker",
    imageUrl: "/memes/f12-hacker.png",
    fallbackUrl: "/memes/f12-hacker.png"
  },
  {
    id: "gandalf-software",
    imageUrl: "/memes/gandalf-software.jpg",
    fallbackUrl: "/memes/gandalf-software.jpg"
  },
  {
    id: "sql-shirt",
    imageUrl: "/memes/sql-shirt.jpg",
    fallbackUrl: "/memes/sql-shirt.jpg"
  },
  {
    id: "cloud-storage",
    imageUrl: "/memes/cloud-storage.png",
    fallbackUrl: "/memes/cloud-storage.png"
  },
  {
    id: "password-incorrect",
    imageUrl: "/memes/password-incorrect.jpg",
    fallbackUrl: "/memes/password-incorrect.jpg"
  },
  {
    id: "tech-support-cookies",
    imageUrl: "/memes/tech-support-cookies.jpg",
    fallbackUrl: "/memes/tech-support-cookies.jpg"
  },
  {
    id: "apple-juice",
    imageUrl: "/memes/apple-juice.jpg",
    fallbackUrl: "/memes/apple-juice.jpg"
  },
  {
    id: "family-engineer",
    imageUrl: "/memes/family-engineer.png",
    fallbackUrl: "/memes/family-engineer.png"
  }
];

// Mock profiles removed - now using real database matching
