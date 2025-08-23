import { Response, NextFunction } from 'express';
import { AuthRequest, User } from '../types/index.js';
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateToken: (user: User) => string;
//# sourceMappingURL=auth.d.ts.map