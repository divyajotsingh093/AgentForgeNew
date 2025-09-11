import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

// Dummy user data for development (matches frontend)
const DUMMY_USER_PAYLOAD = {
  sub: "auth0|dummy_user_123",
  email: "demo@example.com",
  name: "Demo User",
  given_name: "Demo",
  family_name: "User",
  picture: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  email_verified: true,
};

// Dummy token verification - always returns the same user
async function verifyDummyToken(token: string): Promise<typeof DUMMY_USER_PAYLOAD> {
  // In dummy mode, we just return the fake user regardless of token
  // You could add some basic validation here if needed (e.g., token must equal specific value)
  if (token === "dummy_jwt_token_for_development") {
    return DUMMY_USER_PAYLOAD;
  }
  
  // For development, accept any token and return dummy user
  console.log('⚠️  Dummy auth: Accepting any token and returning demo user');
  return DUMMY_USER_PAYLOAD;
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    // For dummy authentication, we don't require a proper Bearer token
    let payload = DUMMY_USER_PAYLOAD;
    
    // Optional: Check for authorization header and token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      payload = await verifyDummyToken(token);
    } else {
      // If no auth header, still proceed with dummy user for development
      console.log('⚠️  Dummy auth: No authorization header, using demo user');
    }
    
    // Store user info in request for use in routes
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      claims: payload
    };

    // Ensure user exists in our database
    const userData = {
      id: payload.sub as string,
      email: payload.email as string,
      firstName: (payload.given_name as string) || (payload.name as string)?.split(' ')[0] || '',
      lastName: (payload.family_name as string) || (payload.name as string)?.split(' ').slice(1).join(' ') || '',
      profileImageUrl: payload.picture as string,
    };
    
    // Create/update dummy user in database
    await storage.upsertUser(userData);

    next();
  } catch (error) {
    console.error('Dummy authentication error:', error);
    // In dummy mode, still proceed even if there's an error
    console.log('⚠️  Dummy auth: Error occurred, but proceeding anyway for development');
    
    req.user = {
      id: DUMMY_USER_PAYLOAD.sub,
      email: DUMMY_USER_PAYLOAD.email,
      name: DUMMY_USER_PAYLOAD.name,
      picture: DUMMY_USER_PAYLOAD.picture,
      claims: DUMMY_USER_PAYLOAD
    };
    
    next();
  }
};

export function setupAuth(app: Express) {
  // Auth routes for debugging/health check
  app.get('/api/auth/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      mode: 'dummy_auth_development',
      message: '⚠️  Using dummy authentication for development - all requests authenticated as demo user',
      dummy_user: {
        id: DUMMY_USER_PAYLOAD.sub,
        email: DUMMY_USER_PAYLOAD.email,
        name: DUMMY_USER_PAYLOAD.name
      }
    });
  });
}