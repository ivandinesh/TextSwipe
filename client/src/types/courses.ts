export interface CourseCard {
  id: string;
  content: string;
}

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  order: number;
  cards: CourseCard[];
}

export interface CourseData {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  cover: {
    eyebrow: string;
    accent: "midnight" | "aurora" | "ember" | "petal" | "sage";
    art?: string;
  };
  metadata: {
    estimatedMinutes: number;
    level: string;
    category: string;
  };
  modules: CourseModule[];
}

export interface CourseProgressSummary {
  courseId: string;
  completedModulesCount: number;
  totalModules: number;
  isCompleted: boolean;
  lastModuleIndex: number;
  lastCardIndex: number;
  nextUnlockedIndex: number;
  modules: Array<{
    moduleId: string;
    title: string;
    summary: string;
    order: number;
    highestCardIndex: number;
    completedAt: string | null;
    isUnlocked: boolean;
  }>;
}

