# SwipeLearn

## Overview

SwipeLearn is a TikTok-style vertical scrolling learning application that delivers bite-sized educational content through an immersive mobile-first interface. The app combines AI-generated learning snippets with an intuitive swipe-based navigation system, allowing users to learn new topics through short, digestible cards optimized for mobile consumption.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Styling**: Tailwind CSS with a comprehensive design system featuring dark/light modes and customizable themes
- **Component Library**: Radix UI primitives with shadcn/ui components for consistent, accessible interface elements
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Vertical scrolling cards with swipe gestures, designed to mimic TikTok/Instagram Reels user experience

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling and request/response logging
- **Development**: Hot module replacement via Vite integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Development Storage**: In-memory storage implementation for rapid prototyping
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Design System
- **Typography**: Inter font family with carefully crafted weight and size scales
- **Color Palette**: Comprehensive theme system supporting both dark and light modes with customizable accent colors
- **Spacing**: Consistent Tailwind-based spacing system (4, 8, 16 unit focus)
- **Components**: Full-screen cards with snap scrolling, customization panels, and progressive navigation indicators

### Content Generation
- **AI Integration**: OpenAI API integration through OpenRouter for generating educational content
- **Content Types**: Bite-sized learning snippets optimized for mobile consumption
- **Fallback System**: Demo content system for development and testing scenarios

## External Dependencies

### Core Infrastructure
- **Database**: Neon Database (PostgreSQL serverless)
- **AI Services**: OpenAI API via OpenRouter for content generation
- **Font Services**: Google Fonts (Inter family)

### Development & Deployment
- **Build Tools**: Vite with React plugin and TypeScript support
- **Replit Integration**: Cartographer and dev banner plugins for Replit environment
- **Error Handling**: Runtime error overlay for development debugging

### UI & Interaction Libraries
- **Component Primitives**: Radix UI ecosystem for accessible, unstyled components
- **Animations**: Class Variance Authority for component variants
- **Carousel**: Embla Carousel for swipe interactions
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date manipulation

### Styling & Design
- **CSS Framework**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React icon library
- **Utility Libraries**: clsx and tailwind-merge for conditional styling