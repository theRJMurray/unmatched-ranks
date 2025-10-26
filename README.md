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

### Tournaments Section
- Placeholder for future tournament management features

## Next Steps

Future features will include:
- ELO calculation system
- Match reporting by players
- Tournament bracket management
- User profiles and leaderboards
- Challenge system
- Match dispute resolution