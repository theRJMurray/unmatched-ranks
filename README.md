# Unmatched Ranks

A Next.js web application for tracking ELO ratings in the board game Unmatched.

## Features

- JWT-based authentication with email/password
- User roles: admin, tournament organizer, user
- ELO rating system (lifetime and seasonal)
- MongoDB database with Mongoose
- Protected routes with middleware
- Responsive design with Tailwind CSS
- Admin dashboard with user and match management
- Match creation and tracking system
- Role-based access control with audit logging
- ELO rating system with automatic calculations
- Match reporting and dispute resolution
- Player profiles with ELO history graphs
- Public leaderboard with seasonal tracking
- Complete challenge system with inbox management
- Match reporting with auto-resolution and dispute handling
- Admin dispute resolution system

## Setup

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/unmatched-ranks
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Start MongoDB (if running locally)

5. Seed the initial admin user:
   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Admin User

After running the seed script, you can log in with:
- Email: `admin@unmatched-ranks.com`
- Password: `admin123`

**Important**: Change the admin password after first login!

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Home page
├── lib/                   # Utility libraries
│   ├── auth.ts           # JWT utilities
│   ├── auth-context.tsx  # React auth context
│   └── mongodb.ts        # Database connection
├── models/               # Mongoose schemas
│   └── User.ts           # User model
├── scripts/              # Database scripts
│   └── seed-admin.ts     # Admin user seeder
└── middleware.ts         # Route protection middleware
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin Only
- `GET /api/users` - List all users (admin only)
- `PATCH /api/users/[id]` - Update user role (admin only)
- `GET /api/matches` - List matches with populated user data
- `POST /api/matches` - Create new match (admin only)
- `PUT /api/matches/[id]` - Update match winner/status (admin only)

### Match Reporting
- `POST /api/matches/[id]/report` - Submit match result report (players only)

### User Profiles & Leaderboard
- `GET /api/profiles/[username]` - Get public user profile data
- `GET /api/profiles/[username]/history` - Get ELO history for charts
- `GET /api/leaderboard` - Get leaderboard data (lifetime/seasonal)
- `POST /api/challenges` - Create a challenge between players
- `GET /api/seasons` - Get all seasons
- `POST /api/seasons` - Start new season (admin only)

## Security Features

- Password hashing with bcrypt
- JWT tokens stored in httpOnly cookies
- Route protection middleware
- Input validation and sanitization
- Username normalization (lowercase)

## Development

- Run linting: `npm run lint`
- Build for production: `npm run build`
- Start production server: `npm start`

## Admin Dashboard

Access the admin dashboard at `/admin` (admin role required):

### Users Section
- View all users with their roles and ELO ratings
- Promote/demote users between roles (user, organizer, admin)
- Role changes are logged with audit trail

### Matches Section
- View recent matches in a sortable table
- Create new matches with player selection and deck assignment
- Support for all official Unmatched decks
- Match formats: best-of-1 and best-of-3
- Track match status: Pending, Completed, Disputed
- Automatic ELO calculation and updates
- Match reporting system for players

### Tournaments Section
- Placeholder for future tournament management features

## ELO Rating System

The application includes a complete ELO rating system:

### Features
- **K-factor**: 32 for all calculations
- **Dual ratings**: Separate lifetime and seasonal ELO tracking
- **Match formats**: Supports best-of-1 and best-of-3 matches
- **Automatic calculation**: ELO changes applied when matches are resolved
- **Atomic updates**: Database transactions ensure data consistency

### How It Works
1. **Match Creation**: Initial ELO ratings are stored when match is created
2. **Player Reports**: Both players can report match results
3. **Auto-Resolution**: If reports agree, match is automatically resolved
4. **ELO Updates**: Ratings are updated based on initial ratings and final result
5. **Dispute Handling**: Conflicting reports are flagged for admin review

### Testing
Run `npm run test-elo` to test the ELO calculation system.

## Player Profiles & Leaderboard

### User Profiles (`/username`)
- **Public profiles** accessible at `/username` (dynamic routes)
- **ELO display** with lifetime and seasonal ratings
- **Role badges** with color coding (blue: user, green: organizer, red: admin)
- **Win rate statistics** calculated from match history
- **Recent matches table** showing opponent, deck, format, result, and ELO change
- **ELO history graph** using Recharts for visual ELO progression
- **Challenge button** for logged-in users to challenge other players
- **Edit profile** option for own profile

### Leaderboard (`/leaderboard`)
- **Top 50 players** sorted by ELO rating
- **Dual view modes** - lifetime and seasonal ELO
- **Season selection** for seasonal leaderboard
- **Comprehensive stats** - rank, username, role, ELO, win rate, matches played
- **Clickable usernames** linking to player profiles
- **Role badges** and rank highlighting

### Challenge System
- **Player-to-player challenges** via profile pages with format and deck selection
- **Challenge modal** with Best of 1/3 format selection and deck picker
- **Inbox management** with separate tabs for challenges and matches
- **Challenge acceptance** with deck selection and automatic match creation
- **Challenge status tracking** (Pending, Accepted, Declined, Locked, Expired)
- **Real-time polling** every 30 seconds for inbox updates

### Match Reporting & Dispute Resolution
- **Dual player reporting** system for match results
- **Auto-resolution** when both players agree on results
- **Dispute handling** when reports conflict (flagged for admin review)
- **Provisional ELO updates** for single reports
- **Admin dispute resolution** with manual winner/games selection
- **ELO recalculation** on dispute resolution
- **Match status tracking** (Pending, Completed, Disputed)

### Inbox System
- **Unified inbox** for challenges and matches
- **Challenge management** - accept/decline with deck selection
- **Match reporting** interface for pending matches
- **Real-time updates** via polling
- **Status indicators** for unread challenges and pending reports

### Seasonal System
- **Season management** with start/end dates
- **Automatic ELO reset** to 1200 when new season starts
- **Season history tracking** for leaderboard filtering
- **Admin controls** for starting new seasons

## Next Steps

Future features will include:
- Tournament bracket management
- User profiles and leaderboards
- Challenge system
- Match dispute resolution UI
- ELO history tracking
- Seasonal resets