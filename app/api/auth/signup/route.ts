import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, setTokenCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, email, password } = await request.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Create response
    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        eloLifetime: user.eloLifetime,
        eloSeasonal: user.eloSeasonal
      }
    });

    // Set token cookie
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      const validationError = error as any;
      if (validationError.errors) {
        const fieldErrors = Object.keys(validationError.errors).map(field => {
          const fieldError = validationError.errors[field];
          if (field === 'username' && fieldError.kind === 'minlength') {
            return 'Username must be at least 3 characters long';
          }
          if (field === 'username' && fieldError.kind === 'maxlength') {
            return 'Username must be no more than 20 characters long';
          }
          if (field === 'username' && fieldError.kind === 'regexp') {
            return 'Username can only contain letters, numbers, and underscores';
          }
          if (field === 'email' && fieldError.kind === 'regexp') {
            return 'Please enter a valid email address';
          }
          if (field === 'password' && fieldError.kind === 'minlength') {
            return 'Password must be at least 6 characters long';
          }
          return `${field}: ${fieldError.message}`;
        });
        return NextResponse.json(
          { error: fieldErrors.join(', ') },
          { status: 400 }
        );
      }
    }
    
    // Handle duplicate key errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
