import * as jose from 'jose';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

// Secure JWKS with proper key selection
let JWKS: jose.GetKeyFunction<jose.JWTHeaderParameters, jose.FlattenedJWSInput> | null = null;

async function getJWKS(): Promise<jose.GetKeyFunction<jose.JWTHeaderParameters, jose.FlattenedJWSInput>> {
  if (!process.env.AUTH0_DOMAIN) {
    throw new Error('AUTH0_DOMAIN environment variable is required');
  }
  
  if (!JWKS) {
    const jwksUri = `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`;
    JWKS = jose.createRemoteJWKSet(new URL(jwksUri));
  }
  
  return JWKS;
}

async function verifyAuth0Token(token: string): Promise<jose.JWTPayload> {
  if (!process.env.AUTH0_DOMAIN) {
    throw new Error('AUTH0_DOMAIN environment variable is required');
  }
  
  if (!process.env.AUTH0_AUDIENCE) {
    throw new Error('AUTH0_AUDIENCE environment variable is required');
  }

  try {
    const JWKS = await getJWKS();
    
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      audience: process.env.AUTH0_AUDIENCE,
      algorithms: ['RS256'],
    });

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = await verifyAuth0Token(token);
    
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
    
    // Use the Auth0 subject as the user ID
    await storage.upsertUser(userData);

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export function setupAuth(app: Express) {
  // Auth routes for debugging/health check
  app.get('/api/auth/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      domain: process.env.AUTH0_DOMAIN,
      audience: process.env.AUTH0_AUDIENCE,
      configured: !!(process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE)
    });
  });
}