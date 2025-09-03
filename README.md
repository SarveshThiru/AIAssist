# Email Management System

## Overview

This is a full-stack email management system built with React, Express, and PostgreSQL. The application provides intelligent email processing capabilities including sentiment analysis, urgency detection, and automated response generation using OpenAI's GPT models. It features a modern dashboard interface for managing emails with filtering, analytics, and AI-powered insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS custom properties for theming

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Development Setup**: Hot reloading with tsx for development server

### Database Design
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: 
  - `emails` - Core email data with AI analysis fields (sentiment, urgency, extracted data, AI responses)
  - `users` - User authentication data
- **Data Types**: JSON fields for flexible extracted data storage

### AI Integration
- **Provider**: OpenAI API integration for content analysis
- **Capabilities**:
  - Sentiment analysis (positive/neutral/negative classification)
  - Urgency detection with confidence scoring
  - Information extraction (phone numbers, emails, order IDs, products)
  - Automated response generation
- **Model**: GPT-5 for all AI operations

### Key Features
- **Email Processing Pipeline**: Automated analysis of incoming emails with sentiment, urgency, and data extraction
- **Dashboard Interface**: Multi-view dashboard with inbox management, urgent email filtering, and analytics
- **Real-time Updates**: Query invalidation and refetching for live data updates
- **Responsive Design**: Mobile-first approach with responsive layouts

### Component Architecture
- **Modular Components**: Reusable UI components following atomic design principles
- **Custom Hooks**: Shared logic for mobile detection and toast notifications
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend

### Development Experience
- **Hot Reloading**: Vite HMR for fast development cycles
- **Error Handling**: Runtime error overlay and comprehensive error boundaries
- **Code Quality**: ESLint and TypeScript strict mode for code consistency

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **openai**: Official OpenAI API client for AI features
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework for the API server

### UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database schema management and migrations
- **typescript**: Static type checking

### Authentication and Sessions
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Form Handling
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation and schema definition