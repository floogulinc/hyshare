import { Request, Response, NextFunction } from 'express';

export function getCacheControlMiddleware(maxAge: number) {
  return function (req: Request, res: Response, next: NextFunction) {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
}
