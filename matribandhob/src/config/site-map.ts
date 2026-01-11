export const SiteMap = {
  home: {
    url: "/patient/dashboard",
    description: "Main dashboard with baby growth, kicks, and vitals."
  },
  care: {
    url: "/patient/care",
    description: "Find doctors, specialists, and book appointments."
  },
  sos: {
    url: "/patient/care/sos",
    description: "Emergency SOS page for immediate help."
  },
  wellness: {
    url: "/patient/wellness",
    description: "Yoga, nutrition, and mental health resources."
  },
  profile: {
    url: "/patient/profile",
    description: "User settings, medical history, and personal info."
  },
  onboarding: {
    url: "/patient/onboarding",
    description: "Initial setup for pregnancy details."
  },
  chat: {
    url: "#chat",
    description: "The AI companion chat interface."
  }
};

export type PageKey = keyof typeof SiteMap;