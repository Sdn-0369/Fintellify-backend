import { Response, Request, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const jwtSecret = process.env.JWT_KEY as string;

export async function auth(req: Request, res: Response, next: NextFunction) :Promise<any>{
  try {
    // Bearer-token auth: read the JWT from the Authorization header instead of a
    // cookie. This works across all browsers (no third-party-cookie dependency).
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      return res.status(401).json({ error: 'Token missing. Unauthorized' });
    }

    const verify1 = jwt.verify(token, jwtSecret) as JwtPayload;
    
    if (verify1?.email) {
      // Expose the verified identity to downstream handlers. Routes must use
      // this instead of any client-supplied header so one user cannot read
      // another user's cached data by spoofing a userId.
      res.locals.userId = verify1.email;
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }

  } catch (err) {
    res.status(401).json({ error: 'Authentication failed', details: err });
  }
}
