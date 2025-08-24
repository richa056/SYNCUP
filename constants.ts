
import { QuizQuestion, Meme, DeveloperProfile } from './types';

export const MEME_BASE_URL = (import.meta as any).env?.VITE_MEME_BASE_URL || '/memes/';

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What's your preferred work schedule?",
    type: "cards",
    options: [
      "☀️ Morning Maverick",
      "🌙 Night Owl Ninja", 
      "🌅 Flexible Fighter"
    ]
  },
  {
    id: 2,
    question: "How do you customize your terminal?",
    type: "cards",
    options: [
      "🎨 Zsh/Fish Customizer",
      " Bash Purist",
      "🚀 Warp/Fig Magician"
    ]
  },
  {
    id: 3,
    question: "Rate your debugging stress level (0 = Zen, 100 = Panic)",
    type: "slider",
    min: 0,
    max: 100,
    default: 50
  },
  {
    id: 4,
    question: "Tabs or Spaces?",
    type: "toggle",
    options: ["Tabs", "Spaces"]
  },
  {
    id: 5,
    question: "Your project management style?",
    type: "cards",
    options: [
      "Kanban King",
      "Git Guru", 
      "Notion Nerd"
    ]
  },
  {
    id: 6,
    question: "Preferred state management?",
    type: "cards",
    options: [
      "⚛️ Context API",
      "🐻 Zustand/Jotai",
      "🔄 Redux Saga"
    ]
  },
  {
    id: 7,
    question: "Light or Dark theme?",
    type: "toggle",
    options: ["Light", "Dark"]
  },
  {
    id: 8,
    question: "Naming convention preference?",
    type: "cards",
    options: [
      "camelCaseChampion",
      "PascalCasePioneer",
      "snake_case_selector"
    ]
  },
  {
    id: 9,
    question: "Documentation importance (0 = Essential, 100 = Optional)",
    type: "slider",
    min: 0,
    max: 100,
    default: 50
  },
  {
    id: 10,
    question: "Your ideal work environment?",
    type: "cards",
    options: [
      "💻 Minimalist Laptop",
      "🏙️ Multi-Monitor Command Center",
      "☕ Cozy Coffee Shop"
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
