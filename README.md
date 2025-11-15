# Mental Health Support Platform

## Project Overview

A safe, AI-moderated mental health support platform that connects users seeking emotional support through multiple channels:

- **Anonymous Matching**: Get paired with peers for confidential topic-based conversations
- **Private Messaging**: Secure 1:1 conversations with safety monitoring
- **Positive Feed**: Share and discover uplifting content with AI moderation
- **Resource Marketplace**: Browse mental health books, merchandise, and events
- **Group Channels**: Topic-based community discussions with subchannels

All interactions include real-time safety checks for PII detection, crisis intervention, and harmful content prevention.

## Installation/Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   - The `.env` file is auto-configured with Supabase credentials
   - No manual configuration needed for Lovable Cloud projects

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser to the local development URL (typically `http://localhost:5173`)

## Usage Guide

### Getting Started
1. **Sign up** with email authentication (auto-confirmed for testing)
2. Choose your display name and support preferences

### Features
- **Channels Tab**: Join group discussions organized by mental health topics
- **Connect Tab**: 
  - Chat with AI support bot
  - Request 1:1 peer connections
  - Get matched anonymously with others seeking similar support
- **Feed Tab**: Share positive experiences and browse uplifting content
- **Marketplace Tab**: Explore mental health resources and products

### Safety Features
- All messages are monitored for personally identifiable information (PII)
- Crisis detection triggers immediate resource recommendations
- AI content moderation on all user-generated posts
- Real-time safety logging for monitoring patterns

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Lovable Cloud (Supabase)
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication with email/password
  - Storage for user-generated images
  - Edge Functions for serverless logic
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router v6
- **AI Integration**: Lovable AI Gateway (Google Gemini Flash 2.5)

## Claude API Integration

This project was **built using Claude Code** through the Lovable development platform. Claude powered the entire backend architecture design and implementation:

- **Database Schema Design**: Claude designed normalized tables with proper relationships and RLS policies
- **Edge Functions**: All serverless functions (`chat-support`, `ai-safety-check`, `match-users`, `moderate-positive-content`) were architected and implemented by Claude
- **Safety Systems**: Claude implemented multi-layered safety checks including PII detection, crisis intervention, and content moderation
- **Real-time Features**: Claude configured Supabase Realtime for live messaging across channels and private chats
- **Authentication Flow**: Claude built secure auth with proper session management and profile creation

The AI chat support feature uses the **Lovable AI Gateway** to access Google Gemini models for providing mental health support responses.

## Challenges & Solutions

### Challenge 1: User Privacy vs. AI Monitoring
**Problem**: Needed to monitor conversations for safety without exposing sensitive data.

**Solution**: Implemented a layered approach:
- Edge functions use service role credentials to access data for safety checks
- User-facing queries use RLS policies that restrict access to own data only
- PII detection runs client-side before sending to backend
- Safety logs store only event metadata, not full message content


### Challenge 2: Real-time Safety Moderation
**Problem**: Needed instant content moderation without blocking legitimate support conversations.

**Solution**:
- Implemented client-side regex-based PII detection for immediate feedback
- Added async AI safety checks that flag but don't block messages
- Created a crisis detection system that shows resources without interrupting conversation flow
- Built positive feed with AI pre-approval before posts go live

### Challenge 3: Balancing Security with Functionality
**Problem**: Initial RLS policies were too permissive, exposing user data publicly.

**Solution**:
- Audited all tables and tightened RLS policies to user-specific access
- Ensured edge functions could still operate via service role bypass
- Added policies for connected users to view minimal peer information
- Implemented proper authentication flow to ensure all users are identified

## Future Plans

With more time, we would build:

1. **Enhanced Matching Algorithm**
   - ML-based compatibility scoring beyond topic matching
   - Mood-based matching using sentiment analysis
   - Support for group matching (3-4 users with similar needs)

2. **Professional Moderation Dashboard**
   - Review flagged content and user reports
   - Manual intervention tools for crisis situations
   - Analytics on safety events and intervention effectiveness

3. **Expanded AI Capabilities**
   - Multi-language support for global accessibility
   - Voice-based support with speech-to-text
   - Image analysis for detecting concerning visual content
   - Personalized coping strategy recommendations

4. **Community Features**
   - Scheduled support groups with facilitators
   - Progress tracking and journaling
   - Peer recognition and badges for supportive behavior
   - Integration with crisis hotlines and professional services

5. **Mobile App**
   - Native iOS and Android apps
   - Push notifications for match connections and replies
   - Offline support with sync when reconnected
   - Better accessibility features for users with disabilities
