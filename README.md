# Unmatched Ranks

A Next.js web application for tracking ELO ratings in the board game Unmatched.

## Features

- JWT-based authentication with email/password
- User roles: admin, tournament organizer, user
- ELO rating system (lifetime and seasonal)
- MongoDB database with Mongoose
- Protected routes with middleware
- Responsive design with Tailwind CSS

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

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

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

## Next Steps

This is the first part of the application focusing on authentication. Future features will include:
- Match creation and reporting
- ELO calculation system
- Tournament management
- User profiles and leaderboards
- Challenge system