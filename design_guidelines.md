# FocusFeed Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from TikTok and Instagram Reels for the mobile-first vertical scrolling experience, with additional influences from Duolingo for educational content presentation, and focus apps like Forest and Freedom for concentration enhancement.

## Core Design Principles
- **Mobile-First**: Optimized for vertical mobile interaction with desktop adaptations
- **Deep Focus**: Full viewport cards that eliminate distractions and enhance concentration
- **Effortless Navigation**: Intuitive swipe gestures with clear visual feedback
- **Content-Centric**: Typography and readability as primary design elements
- **Concentration-First**: Design elements that minimize cognitive load and maximize focus

## Color Palette
**Focus Mode Primary** (default):
- Background: 12 8% 12% (deep charcoal)
- Cards: 240 6% 18% (dark gray-blue)
- Primary text: 0 0% 95% (off-white)
- Secondary text: 0 0% 70% (muted gray)
- Accent: 260 90% 65% (vibrant purple)

**Relaxed Mode**:
- Background: 220 15% 96% (soft white-blue)
- Cards: 0 0% 100% (pure white)
- Primary text: 220 15% 15% (dark blue-gray)
- Secondary text: 220 10% 45% (medium gray)
- Accent: 260 90% 55% (deeper purple)

## Typography
**Primary Font**: Inter (Google Fonts)
- Headings: 600-700 weight, 24-32px
- Body text: 400-500 weight, 18-20px for optimal mobile readability
- UI elements: 500 weight, 14-16px

**Spacing System**
Tailwind units: 2, 4, 6, 8, 12, 16 (focusing on 4, 8, 16 for consistency)

## Layout & Components

### Full-Screen Focus Cards
- 100vh height with subtle rounded corners (8px) on mobile
- Generous padding (p-8 on mobile, p-12 on desktop)
- Central content alignment with proper text hierarchy
- Smooth snap scrolling between cards
- Minimalist design to reduce visual clutter

### Navigation Elements
- **Mobile**: Swipe gestures as primary interaction
- **Desktop**: Arrow buttons (↑↓) positioned on right side, semi-transparent with blur backdrop
- **Progress Indicator**: Subtle dots on bottom-right showing current position

### Input & Controls
- **Topic Input**: Clean, rounded input field with subtle shadow
- **Action Buttons**: Rounded buttons with the accent color, adequate touch targets (44px minimum)
- **Surprise Me Button**: Secondary action for discovering new topics
- **Focus Controls**: Minimal controls to reduce decision fatigue

### Content Presentation
- **Text Snippets**: Large, readable typography with optimal line spacing (1.6-1.8)
- **Learning Cards**: Subtle card elevation with content hierarchy
- **Loading States**: Elegant skeleton screens and loading spinners

### Interactive Elements
- **Like Button**: Heart icon (❤️) positioned bottom-left of each card
- **Theme Toggle**: Sun/moon icon in top-right corner
- **Focus Controls**: Minimal interactive elements to maintain concentration
- **Smooth Transitions**: 200-300ms easing for all interactions

## Animations
- **Minimal Motion**: Subtle slide transitions between cards (transform-y)
- **Loading Indicators**: Gentle pulse animations
- **Button Feedback**: Micro-interactions on tap/click

## Accessibility & Focus
- High contrast ratios in both focus and relaxed modes
- Large touch targets (minimum 44px)
- Keyboard navigation support for desktop users
- Screen reader friendly content structure
- Reduced motion respect for users with vestibular sensitivities
- Focus mode that minimizes distractions for users with ADHD and similar conditions

This design creates an engaging, distraction-free learning environment that feels familiar to users of modern social media apps while optimizing for deep focus and efficient knowledge acquisition.