import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import RepositoryService from '../../services/repository';
import { Logger } from 'winston';

const route = Router();

export default (app: Router) => {
    app.use('/chartrepo', route);
    const logger:Logger = Container.get('logger');

    // Get repository
    route.get(
      '/', 
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling get Repo endpoint');
        try {
          const repoServiceInstance = Container.get(RepositoryService);
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
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling get Repo endpoint by id %o',req.params.id );
        try {
          const repoServiceInstance = Container.get(RepositoryService);
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
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling post Repo endpoint  %o', req.body  );
        const {name,description,url} = req.body
        try {
          const repoServiceInstance = Container.get(RepositoryService);
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
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling delete Repo endpoint by id %o',req.params.id);
        try {
          const repoServiceInstance = Container.get(RepositoryService);
          const serviceResponse = await repoServiceInstance.DeleteRepository(req.params.id,req.header('Token'));
          return res.status(serviceResponse.status).json(serviceResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    )

}