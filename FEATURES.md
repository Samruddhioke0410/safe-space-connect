# "I Can't Tell Anyone" - Complete Feature Documentation

## Platform Overview

A privacy-first, AI-powered peer support platform for mental health with anonymous connections, comprehensive safety monitoring, and positive content curation.

---

## Core Features Implemented

### 1. **Anonymous Authentication**
- Sign up / Sign in with email
- Auto-generated anonymous display names
- No personal information required
- Automatic profile creation on signup

### 2. **Channel-Based Communication**
- **Public Channels** by topic (Career Stress, Coming Out, Addiction Recovery, etc.)
- **Real-time messaging** with Supabase Realtime
- **Subchannels** for more specific discussions within main channels
- Join/leave channels freely
- Member count tracking

### 3. **1:1 Peer Support**
- **Peer Request System**: Send support requests to specific users
- **Private Messages**: Encrypted 1:1 chats between connected peers
- **Request Management**: Accept or decline incoming requests
- Real-time notifications for new requests

### 4. **Anonymous Matching**
- **Topic-based matching**: Get paired with someone experiencing similar challenges
- **Instant or queued matching**: Connect immediately or wait for next available peer
- **Anonymous chat**: Both parties remain completely anonymous
- **End match anytime**: Either user can end the connection safely

### 5. **Positive Feed**
- Curated uplifting mental health content
- Success stories and recovery journeys
- Gratitude practices and coping strategies
- Community-driven positive reinforcement
- Like counter for popular posts

### 6. **Wellness Marketplace**
- Mental health books
- Supportive merchandise
- Workshops and events
- Tickets and registrations
- External links to trusted providers

---

## AI Safety Features

### Client-Side Detection (Immediate)

#### **PII Detection**
Blocks messages containing:
- Phone numbers (all formats)
- Email addresses
- Street addresses
- Credit card numbers
- Social security numbers
- Personal names (context-aware)
- Social media handles

#### **Crisis Detection**
Three severity levels:
- **High**: Suicidal intent, active self-harm plans
- **Medium**: Self-harm thoughts, passive ideation
- **Low**: General distress indicators

**Response Actions**:
- High severity: Block send, show crisis resources immediately
- Medium: Show resources, allow send after acknowledgment
- Low: Send normally, suggest resources in UI

### Server-Side AI Monitoring (Advanced)

#### **AI Safety Check Edge Function**
- Uses **Lovable AI (Gemini 2.5 Flash)** for analysis
- Examines every message for:
  - PII patterns
  - Crisis language
  - Manipulation attempts
  - Grooming behaviors
  - Abusive content

**AI Response Types**:
- `allow`: Message is safe
- `block`: Message contains unsafe content
- `escalate`: Immediate intervention needed
- `resources`: Suggest help resources

#### **Pattern Detection**
- Logs all safety events per user
- Detects repeated crisis signals (2+ in 1 hour)
- Auto-escalates to crisis intervention
- Tracks PII blocking attempts

#### **Safety Logging**
Database table: `user_safety_logs`
- Event type (PII blocked, crisis detected, image blocked)
- Severity level
- Context data
- Timestamp
- Used for pattern analysis

### Crisis Intervention System

**Crisis Modal** shows:
- National Suicide Prevention Lifeline (988)
- Crisis Text Line (HOME to 741741)
- SAMHSA National Helpline
- Online resources with direct links

**Trigger Points**:
- High-severity crisis keywords detected
- Pattern of 2+ crisis events in short period
- AI escalation recommendation
- User manually requests resources

### Image Safety (Architecture Ready)

**Placeholder Implementation** for:
- Face detection (blocks photos with faces)
- OCR for readable text (blocks images with phone numbers/IDs)
- EXIF data stripping (removes GPS/device metadata)
- File size/type validation

**Future Integration**:
- face-api.js or MediaPipe for face detection
- Tesseract.js for OCR
- Client-side processing before upload

---

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom design system
- **shadcn/ui** components
- **Vite** for build
- **React Router** for navigation

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** database
- **Row Level Security (RLS)** for all tables
- **Realtime subscriptions** for live updates
- **Edge Functions** for serverless logic

### AI Integration
- **Lovable AI Gateway** (Gemini 2.5 Flash)
- No API keys needed (auto-configured)
- Rate-limited per workspace
- Usage-based pricing

### Database Schema

**Tables**:
- `profiles` - User profiles (anonymous names)
- `channels` - Main support channels
- `subchannels` - Topic subdivisions
- `messages` - Channel messages
- `channel_members` - Channel memberships
- `peer_requests` - 1:1 support requests
- `private_messages` - Direct messages
- `anonymous_matches` - Matched pairs
- `match_messages` - Anonymous chat messages
- `marketplace_items` - Products/events
- `positive_feed` - Curated positive content
- `crisis_resources` - Hotline information
- `user_safety_logs` - Safety event tracking

**Edge Functions**:
- `ai-safety-check` - AI-powered message analysis
- `match-users` - Anonymous matching algorithm

---

## Security & Privacy

### Data Protection
- **No PII storage**: Only anonymous IDs and display names
- **RLS policies**: Users can only see their own data
- **Encrypted communications**: Supabase encrypted transport
- **Minimal logging**: Only safety events logged (with consent)

### Safety Measures
- Client-side PII blocking (before server)
- AI content moderation (server-side)
- Pattern detection for repeated issues
- Crisis intervention workflows
- Image safety checks (future)

### Privacy Features
- Anonymous usernames auto-generated
- No profile pictures or real names
- Optional 1:1 connections (consent-based)
- End-to-end anonymous matching
- User can leave/end chats anytime

---

## Demo Usage

### Testing the Platform

1. **Sign Up**
   - Go to `/auth`
   - Create account with email
   - Auto-assigned anonymous name

2. **Join a Channel**
   - Browse available channels
   - Click "Join" on any channel
   - Start chatting in real-time

3. **Test PII Blocking**
   - Try sending: "My phone is 555-1234"
   - Should be blocked with explanation

4. **Test Crisis Detection**
   - Type crisis keywords (e.g., "I want to die")
   - Crisis modal should appear with resources

5. **Request 1:1 Support**
   - View other users in a channel
   - Send peer request (feature coming soon - UI ready)

6. **Try Anonymous Matching**
   - Go to "Connect" tab
   - Select a topic
   - Click "Start Matching"
   - Wait for or find immediate match

7. **Browse Positive Feed**
   - Click "Positive" tab
   - See uplifting success stories

8. **Explore Marketplace**
   - Click "Market" tab
   - Browse mental health resources

---

## Known Limitations & Future Work

### Current Limitations
- Image upload safety checks are placeholders
- Face detection requires additional library
- OCR for text extraction not yet integrated
- Peer request UI needs channel integration
- Subchannel UI not fully wired in

### Planned Enhancements
- Full image safety (face detection, OCR)
- Video chat support (anonymous)
- Group matching (3+ people)
- Moderation dashboard for admins
- Analytics for platform health
- Mobile app (React Native)

---

## API Endpoints

### Edge Functions

#### **ai-safety-check**
```typescript
POST /functions/v1/ai-safety-check
Body: {
  message: string,
  userId: string,
  context: { type: "channel" | "private_chat", channelId?: string }
}
Response: {
  isSafe: boolean,
  concerns: string[],
  severity: "low" | "medium" | "high",
  recommendation: "allow" | "block" | "escalate",
  explanation: string,
  patternDetected?: boolean
}
```

#### **match-users**
```typescript
POST /functions/v1/match-users
Body: {
  userId: string,
  topic: string
}
Response: {
  matched: boolean,
  matchId: string,
  partnerId?: string,
  waiting?: boolean
}
```

---

## Environment Variables

Auto-configured by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `LOVABLE_API_KEY` (server-only, AI gateway)

---

## Credits & Attribution

**Built with**:
- Lovable (lovable.dev)
- Supabase (supabase.com)
- Gemini AI (Google)
- shadcn/ui (ui.shadcn.com)
- Tailwind CSS (tailwindcss.com)

**Crisis Resources**:
- 988 Suicide & Crisis Lifeline
- Crisis Text Line
- SAMHSA National Helpline

---

## Support & Feedback

This is a demo/prototype platform. For real crisis support, please contact:
- **988** (US Suicide & Crisis Lifeline)
- **Crisis Text Line**: Text HOME to 741741
- **SAMHSA**: 1-800-662-4357

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0 (Demo/MVP)
