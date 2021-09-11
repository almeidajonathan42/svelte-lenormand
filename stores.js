import { writable, readable } from "svelte/store";

export const appState = writable("home");
export const numberOfCards = writable(2);
export const currentQuestion = writable(" ");
export const pastQuestions = writable([]);

export const cardData = readable([
  {
    number: 1,
    name: "Rider",
    "meaning-1": "News",
    "meaning-2": "Messages",
    "meaning-3": "Speed"
  },

  {
    number: 2,
    name: "Clover",
    "meaning-1": "Quick luck",
    "meaning-2": "Opportunity",
    "meaning-3": "Small joys"
  },

  {
    number: 3,
    name: "Ship",
    "meaning-1": "Distance",
    "meaning-2": "Travel",
    "meaning-3": "Adventure"
  },

  {
    number: 4,
    name: "House",
    "meaning-1": "Family",
    "meaning-2": "Safety",
    "meaning-3": "Tradition"
  },

  {
    number: 5,
    name: "Tree",
    "meaning-1": "Growth",
    "meaning-2": "Health",
    "meaning-3": "Spirituality"
  },

  {
    number: 6,
    name: "Cloud",
    "meaning-1": "Chaos",
    "meaning-2": "Confusion",
    "meaning-3": "Doubt"
  },

  {
    number: 7,
    name: "Snake",
    "meaning-1": "Seduction",
    "meaning-2": "Craving",
    "meaning-3": "Desire"
  },

  {
    number: 8,
    name: "Coffin",
    "meaning-1": "Ending",
    "meaning-2": "Grief",
    "meaning-3": "Sadness"
  },

  {
    number: 9,
    name: "Bouquet",
    "meaning-1": "Happiness",
    "meaning-2": "Gift",
    "meaning-3": "Cordiality"
  },

  {
    number: 10,
    name: "Scythe",
    "meaning-1": "Sudden end",
    "meaning-2": "Accident",
    "meaning-3": "Danger"
  },

  {
    number: 11,
    name: "Whip",
    "meaning-1": "Conflit",
    "meaning-2": "Debate",
    "meaning-3": "Fight"
  },

  {
    number: 12,
    name: "Birds",
    "meaning-1": "Communication",
    "meaning-2": "Chattering",
    "meaning-3": "Gossip"
  },

  {
    number: 13,
    name: "Child",
    "meaning-1": "Beginning",
    "meaning-2": "Innocence",
    "meaning-3": "Inexperience"
  },

  {
    number: 14,
    name: "Fox",
    "meaning-1": "Trickery",
    "meaning-2": "Suspicion",
    "meaning-3": "Selfishness"
  },

  {
    number: 15,
    name: "Bear",
    "meaning-1": "Boss",
    "meaning-2": "Strong personality",
    "meaning-3": "Power"
  },

  {
    number: 16,
    name: "Star",
    "meaning-1": "Hope",
    "meaning-2": "Optimism",
    "meaning-3": "Inspiration"
  },

  {
    number: 17,
    name: "Stork",
    "meaning-1": "Change",
    "meaning-2": "Migration",
    "meaning-3": "Movement"
  },

  {
    number: 18,
    name: "Dog",
    "meaning-1": "Loyalty",
    "meaning-2": "Friendship",
    "meaning-3": "Support"
  },

  {
    number: 19,
    name: "Tower",
    "meaning-1": "Loneliness",
    "meaning-2": "Authority",
    "meaning-3": "Hierarchy"
  },

  {
    number: 20,
    name: "Garden",
    "meaning-1": "Public affairs",
    "meaning-2": "Society",
    "meaning-3": "Social networks"
  },

  {
    number: 21,
    name: "Mountain",
    "meaning-1": "Obstacles",
    "meaning-2": "Problems",
    "meaning-3": "Challenges"
  },

  {
    number: 22,
    name: "Paths",
    "meaning-1": "Choices",
    "meaning-2": "Decisions",
    "meaning-3": "Many opportunities"
  },

  {
    number: 23,
    name: "Mouse",
    "meaning-1": "Reduction",
    "meaning-2": "Destruction",
    "meaning-3": "Deficiency"
  },

  {
    number: 24,
    name: "Heart",
    "meaning-1": "Love",
    "meaning-2": "Passion",
    "meaning-3": "Romance"
  },

  {
    number: 25,
    name: "Ring",
    "meaning-1": "Commitment",
    "meaning-2": "Contract",
    "meaning-3": "Cycles"
  },

  {
    number: 26,
    name: "Book",
    "meaning-1": "Secrets",
    "meaning-2": "Knowledge",
    "meaning-3": "Study"
  },

  {
    number: 27,
    name: "Letter",
    "meaning-1": "Document",
    "meaning-2": "Written communication",
    "meaning-3": "Email"
  },

  {
    number: 28,
    name: "Gentleman",
    "meaning-1": "A man",
    "meaning-2": "Masculinity",
    "meaning-3": "Male energies"
  },

  {
    number: 29,
    name: "Lady",
    "meaning-1": "A woman",
    "meaning-2": "Femininity",
    "meaning-3": "Female energies"
  },

  {
    number: 30,
    name: "Lily",
    "meaning-1": "Purity",
    "meaning-2": "Sensuality",
    "meaning-3": "Morality"
  },

  {
    number: 31,
    name: "Sun",
    "meaning-1": "Plenitude",
    "meaning-2": "Happiness",
    "meaning-3": "Victory"
  },

  {
    number: 32,
    name: "Moon",
    "meaning-1": "Subconscious",
    "meaning-2": "Intuition",
    "meaning-3": "Emotions"
  },

  {
    number: 33,
    name: "Key",
    "meaning-1": "Important",
    "meaning-2": "Unlocking",
    "meaning-3": "Achievement"
  },

  {
    number: 34,
    name: "Fish",
    "meaning-1": "Abundance",
    "meaning-2": "Wealth",
    "meaning-3": "Finances"
  },

  {
    number: 35,
    name: "Anchor",
    "meaning-1": "Stability",
    "meaning-2": "Security",
    "meaning-3": "Resilience"
  },

  {
    number: 36,
    name: "Cross",
    "meaning-1": "Karma",
    "meaning-2": "Burden",
    "meaning-3": "Duty"
  }
]);
