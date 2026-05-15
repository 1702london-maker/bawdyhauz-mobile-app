export type ExperienceAccessType = "invite only" | "application required" | "members only" | "waitlist";

export type Experience = {
  id: string;
  title: string;
  category: string;
  city: string;
  date: string;
  time: string;
  accessType: ExperienceAccessType;
  description: string;
  venueStyle: string;
  dressCode: string;
  guestTone: string;
};

export const experiences: Experience[] = [
  {
    id: "dinner-mayfair",
    title: "The Mayfair Table",
    category: "private dinners",
    city: "London",
    date: "Friday 31 May",
    time: "20:00",
    accessType: "invite only",
    description:
      "An intimate private dinner built around slow conversation, precise hosting and a quietly curated guest list.",
    venueStyle: "Private dining room, low light, seated service",
    dressCode: "Evening tailoring, understated elegance",
    guestTone: "Composed, warm, conversational"
  },
  {
    id: "salon-paris",
    title: "Paris Conversation Salon",
    category: "conversation salons",
    city: "Paris",
    date: "Thursday 6 June",
    time: "19:30",
    accessType: "application required",
    description:
      "A discreet salon for members interested in emotional intelligence, culture and serious connection.",
    venueStyle: "Apartment salon with hosted table service",
    dressCode: "Refined evening wear",
    guestTone: "Curious, emotionally literate, discreet"
  },
  {
    id: "wellness-evening",
    title: "Quiet Wellness Evening",
    category: "wellness evenings",
    city: "Bath",
    date: "Sunday 16 June",
    time: "17:00",
    accessType: "members only",
    description:
      "A restorative members evening centered on breath, reflection and calm social presence.",
    venueStyle: "Private wellness suite and lounge",
    dressCode: "Soft neutral loungewear",
    guestTone: "Calm, respectful, grounded"
  },
  {
    id: "mixer-dubai",
    title: "Dubai Members Mixer",
    category: "luxury social mixers",
    city: "Dubai",
    date: "Saturday 22 June",
    time: "21:00",
    accessType: "waitlist",
    description:
      "A hosted social mixer for travelling members and regional guests, with private concierge presence throughout.",
    venueStyle: "Members lounge, terrace arrival, private host desk",
    dressCode: "Evening resort elegance",
    guestTone: "Social, polished, discreet"
  }
];

export const experienceCategories = [
  "private dinners",
  "members lounges",
  "wellness evenings",
  "curated parties",
  "conversation salons",
  "luxury social mixers"
] as const;
