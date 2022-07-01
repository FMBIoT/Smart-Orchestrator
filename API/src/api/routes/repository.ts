import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import RepositoryService from '../../services/repository';
import { Logger } from 'winston';
import middlewares from '../../middlewares';

const route = Router();

export default (app: Router) => {
    app.use('/chartrepo', route);
    const logger:Logger = Container.get('logger');
    const repoServiceInstance = Container.get(RepositoryService);

    // Get repository
    route.get(
      '/',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling GET Repo endpoint');
        try {
          const serviceResponse = await repoServiceInstance.GetRepository(req.header('Token'))
          return res.status(serviceResponse.status).json(serviceResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );
    
    // Get repository by id
    route.get(
      '/:id',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling GET Repo endpoint by id %o',req.params.id );
        try {
          const serviceResponse = await repoServiceInstance.GetRepositoryById(req.params.id,req.header('Token'));
          return res.status(serviceResponse.status).json(serviceResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    )

    // Post repository
    route.post(
      '/',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling POST Repo endpoint  %o', req.body  );
        const {name,description,url} = req.body
        try {
          const serviceResponse = await repoServiceInstance.PostRepository({name,description,"type":"helm-chart",url},req.header('Token'));
          return res.status(serviceResponse.status).json(serviceResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );
    
    // Delete repository
    route.delete(
      '/:id',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling DELETE Repo endpoint by id %o',req.params.id);
        try {
          const serviceResponse = await repoServiceInstance.DeleteRepository(req.params.id,req.header('Token'));
          return res.status(serviceResponse.status).json(serviceResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    )

}