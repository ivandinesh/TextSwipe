export interface AppCopy {
  voice: {
    principles: string[];
    avoid: string[];
  };
  home: {
    badge: string;
    utilityBadge: string;
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
    heroChips: string[];
    footerEmpty: string;
    footerSaved: (count: number) => string;
    dashboardButton: string;
    adminButton: string;
    signOutButton: string;
  };
  topicInput: {
    eyebrow: string;
    title: string;
    placeholder: string;
    submitIdle: string;
    submitLoading: string;
    surprise: string;
    popularLabel: string;
  };
  loading: {
    defaultMessage: string;
    customMessage: (topic: string) => string;
    eyebrow: string;
    title: string;
    helper: string;
  };
  card: {
    topicEyebrow: string;
    loadingBadge: string;
    styleHint: string;
    styleHintDesktop: string;
    previousHint: string;
    nextHint: string;
    helper: string;
    saveLabel: string;
    unsaveLabel: string;
    cardLabel: (index: number, total: number) => string;
    controlsTitle: string;
    controlsDescription: string;
    controlsCloseHint: string;
    controls: {
      backdropTitle: string;
      typeTitle: string;
      contrastTitle: string;
      themes: Record<"midnight" | "aurora" | "ember" | "petal" | "sage", string>;
      fonts: Record<"sans" | "display" | "mono", string>;
      textTones: Record<"default" | "soft" | "high-contrast", string>;
    };
  };
  options: {
    eyebrow: string;
    title: (topic: string) => string;
    description: string;
    followUpsCount: (count: number) => string;
    noFollowUps: string;
    mobileHint: string;
    selectCta: string;
    regenerate: string;
    explore: string;
    empty: string;
  };
  auth: {
    trigger: string;
    title: string;
    description: string;
    tabs: {
      login: string;
      register: string;
    };
    placeholders: {
      email: string;
      password: string;
    };
    loginPending: string;
    loginIdle: string;
    registerPending: string;
    registerIdle: string;
    loginFallbackError: string;
    registerFallbackError: string;
  };
  dashboard: {
    signedOutTitle: string;
    signedOutDescription: string;
    signedOutCta: string;
    eyebrow: string;
    title: (email: string) => string;
    description: string;
    primaryCta: string;
    adminCta: string;
    signOutCta: string;
    metrics: {
      totalMinutes: string;
      currentStreak: string;
      sessionsThisWeek: string;
      cardsCompleted: string;
    };
    weekTitle: string;
    likedSaved: (count: number) => string;
    recommendedTitle: string;
    recentTitle: string;
    likedTitle: string;
    likedEmpty: string;
  };
  admin: {
    signedOutTitle: string;
    signedOutDescription: string;
    signedOutCta: string;
    forbiddenTitle: string;
    forbiddenDescription: string;
    backCta: string;
    eyebrow: string;
    title: string;
    description: string;
    sections: {
      overview: string;
      content: string;
      users: string;
    };
    metrics: {
      totalUsers: string;
      adminUsers: string;
      runsToday: string;
      savedHits: string;
      contentRuns: string;
      generatedCards: string;
    };
    topTopics: string;
    recentAudit: string;
    recentSessions: string;
    hotTopics: string;
    recentCards: string;
    usersTitle: string;
    makeAdmin: string;
    removeAdmin: string;
    noAudit: string;
    noCards: string;
  };
  errors: {
    appCrashTitle: string;
    appCrashRetry: string;
    missingPageTitle: string;
    missingPageDescription: string;
    noCards: string;
    generateFailureCard: string;
    rateLimit: string;
    genericGenerate: string;
  };
  future: {
    onboarding: Array<{ title: string; description: string }>;
    streaks: string[];
    notifications: string[];
    share: {
      card: string[];
      invite: string[];
    };
  };
}

export const appCopy: AppCopy = {
  voice: {
    principles: [
      "Keep every line short, punchy, and scroll-native.",
      "Favor reward, momentum, curiosity, and low effort.",
      "Sound confident and modern without tipping into cringe.",
    ],
    avoid: [
      "Avoid classroom language like learn, study, lesson, course, or education.",
      "Avoid long setup text and product-jargon filler.",
      "Avoid over-celebrating every action with noisy gamification.",
    ],
  },
  home: {
    badge: "FocusFeed",
    utilityBadge: "Scroll smarter",
    heroEyebrow: "Better than doomscrolling",
    heroTitle: "One more swipe. One more win.",
    heroDescription:
      "Pick a topic and drop into a fast, rewarding feed that actually gives you something back.",
    heroChips: ["Quick-hit card feed", "Fresh angles every round"],
    footerEmpty: "Pick a lane and start rolling.",
    footerSaved: (count) => `${count} saved hits waiting for a replay`,
    dashboardButton: "Your recap",
    adminButton: "Admin",
    signOutButton: "Sign out",
  },
  topicInput: {
    eyebrow: "Start here",
    title: "What are we scrolling into?",
    placeholder: "Try lucid dreaming, dark matter, biohacking...",
    submitIdle: "Start scrolling smarter",
    submitLoading: "Loading your feed...",
    surprise: "Hit me with one",
    popularLabel: "Hot right now",
  },
  loading: {
    defaultMessage: "Stacking your next run...",
    customMessage: (topic) => `Lining up a fresh run on ${topic}...`,
    eyebrow: "Feed is warming up",
    title: "Your next stack is almost here",
    helper: "Fresh cards, quick turns, and a clean flow are loading now.",
  },
  card: {
    topicEyebrow: "Now spinning",
    loadingBadge: "Loading",
    styleHint: "Swipe up for the vibe",
    styleHintDesktop: "Theme the vibe",
    previousHint: "Swipe left for the last one",
    nextHint: "Swipe right for the next hit",
    helper: "One clean hit at a time. Double tap to save it.",
    saveLabel: "Save hit",
    unsaveLabel: "Saved",
    cardLabel: (index, total) => `Hit ${index} of ${total}`,
    controlsTitle: "Pick your vibe",
    controlsDescription: "Tweak the look without breaking the run.",
    controlsCloseHint: "Tap anywhere to close",
    controls: {
      backdropTitle: "Backdrop",
      typeTitle: "Type mood",
      contrastTitle: "Text pop",
      themes: {
        midnight: "Midnight",
        aurora: "Aurora",
        ember: "Ember",
        petal: "Petal",
        sage: "Sage",
      },
      fonts: {
        sans: "Sans",
        display: "Display",
        mono: "Mono",
      },
      textTones: {
        default: "Default",
        soft: "Soft",
        "high-contrast": "Sharp",
      },
    },
  },
  options: {
    eyebrow: "Keep it moving",
    title: (topic) => `Pick the next lane for ${topic}`,
    description:
      "Take a fresh angle, spin the topic again, or jump into a different branch.",
    followUpsCount: (count) => `${count} next-up picks`,
    noFollowUps: "More picks coming up",
    mobileHint: "Scroll for more lanes.",
    selectCta: "Jump into this lane",
    regenerate: "Run this topic again",
    explore: "Show me fresh lanes",
    empty: "No side paths showed up this round. Spin it again or switch lanes.",
  },
  auth: {
    trigger: "Keep your streak",
    title: "Keep your run alive",
    description: "Save your hits, hold your streak, and come back to your recap anytime.",
    tabs: {
      login: "Sign in",
      register: "Create account",
    },
    placeholders: {
      email: "Email",
      password: "Password",
    },
    loginPending: "Signing you in...",
    loginIdle: "Jump back in",
    registerPending: "Setting you up...",
    registerIdle: "Start your streak",
    loginFallbackError: "Couldn't sign you in.",
    registerFallbackError: "Couldn't create your account.",
  },
  dashboard: {
    signedOutTitle: "Sign in to see your recap.",
    signedOutDescription: "Your streak, saved hits, and favorite lanes will show up here.",
    signedOutCta: "Back to the feed",
    eyebrow: "Your recap",
    title: (email) => `You're back, ${email}`,
    description: "A quick run today keeps the streak alive.",
    primaryCta: "Back to the feed",
    adminCta: "Open admin",
    signOutCta: "Sign out",
    metrics: {
      totalMinutes: "Time stacked",
      currentStreak: "Streak",
      sessionsThisWeek: "Runs this week",
      cardsCompleted: "Hits cleared",
    },
    weekTitle: "This week",
    likedSaved: (count) => `${count} saved hits`,
    recommendedTitle: "Next lanes",
    recentTitle: "Recent lanes",
    likedTitle: "Saved hits",
    likedEmpty: "Save a few hits in the feed and they’ll land here.",
  },
  admin: {
    signedOutTitle: "Sign in to open admin.",
    signedOutDescription: "Admin tools only show up once your account is signed in and approved.",
    signedOutCta: "Back to the feed",
    forbiddenTitle: "This lane is admin-only.",
    forbiddenDescription: "Your account is live, but it doesn't have admin access on the server.",
    backCta: "Back to the feed",
    eyebrow: "Admin",
    title: "Control room",
    description: "Track the feed, inspect users, and keep an eye on what is moving.",
    sections: {
      overview: "Overview",
      content: "Content",
      users: "Users",
    },
    metrics: {
      totalUsers: "Users",
      adminUsers: "Admins",
      runsToday: "Active today",
      savedHits: "Saved hits",
      contentRuns: "Total runs",
      generatedCards: "Generated cards",
    },
    topTopics: "Top topics",
    recentAudit: "Recent admin moves",
    recentSessions: "Latest runs",
    hotTopics: "Hot topics",
    recentCards: "Recent generated cards",
    usersTitle: "User access",
    makeAdmin: "Make admin",
    removeAdmin: "Remove admin",
    noAudit: "No admin activity yet.",
    noCards: "No generated cards have been stored yet.",
  },
  errors: {
    appCrashTitle: "The feed hit a snag",
    appCrashRetry: "Reload the vibe",
    missingPageTitle: "That page slipped away",
    missingPageDescription: "Head back and pick up the scroll from there.",
    noCards: "Nothing queued up yet.",
    generateFailureCard: "Couldn't load this run. Check your connection and give it another go.",
    rateLimit: "Too many fresh pulls at once. Give it a second.",
    genericGenerate: "Couldn't load that run. Try again.",
  },
  future: {
    onboarding: [
      {
        title: "Pick your lane",
        description: "Drop into anything you’re curious about.",
      },
      {
        title: "Swipe for quick hits",
        description: "Fast cards, no heavy setup.",
      },
      {
        title: "Save the good ones",
        description: "Keep your best hits and build a streak.",
      },
    ],
    streaks: [
      "Still rolling.",
      "Your streak looks good.",
      "One quick run keeps it alive.",
    ],
    notifications: [
      "Your next stack is waiting.",
      "A quick run beats a doomscroll.",
      "Come back for one more hit.",
    ],
    share: {
      card: [
        "Found this on FocusFeed. Better than a dead scroll.",
        "Quick hit from FocusFeed.",
      ],
      invite: [
        "Trade your doomscroll for something better.",
        "Come try FocusFeed for a smarter scroll.",
      ],
    },
  },
};
