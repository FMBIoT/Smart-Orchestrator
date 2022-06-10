import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import AuthService from '../../services/auth';
import { Logger } from 'winston';


const route = Router();

export default (app: Router) => {
  app.use('/login', route);
  const logger:Logger = Container.get('logger');

  // Authenticate
  route.post(
    '/tokens',
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('🔑 Calling tokens endpoint with body: %o', req.body );
      try {
        const authServiceInstance = Container.get(AuthService);
        const serviceResponse = await authServiceInstance.SignUp(req.body);
        return res.status(serviceResponse.status).json(serviceResponse.data);
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    }
  );

}