import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import EnablerService from '../../services/enabler';
import middlewares from '../../middlewares';
import MongoService from '../../services/auxiliar/mongoService';
import AutoService from '../../services/auxiliar/autoService';

const route = Router();

export default (app: Router) => {
    app.use('/enabler', route);
    const logger:Logger = Container.get('logger');
    const enablerServiceInstance = Container.get(EnablerService);
    const mongoServiceInstance = Container.get(MongoService);
    const autoServiceInstance = Container.get(AutoService);

    route.get(
      '/instanced', 
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling GET Enablers instanced endpoint');
        try {
          const serviceEnablerResponse = await enablerServiceInstance.GetEnablerInstanced(req.header('Token'))
          return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.get(
      '/enabler_cluster/:id', 
      [middlewares.tokenValidation,middlewares.dbConnectionValidation],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling GET Enabler by cluster endpoint');
        try {
          const serviceMongoResponse = await mongoServiceInstance.GetEnablerByCluster(req.params.id)
          return res.status(serviceMongoResponse.status).json(serviceMongoResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.post(
      '/', 
      [middlewares.tokenValidation,middlewares.dbConnectionValidation],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling POST Enabler endpoint');
        try {
          if (req.body.auto == true){
            const vim = await enablerServiceInstance.AutoPostEnabler(req.body,req.header('Token'))
            if(vim.status != 200){ return res.status(vim.status).json(vim.data)}
            req.body.vim = vim.data.data
          }
          const serviceEnablerResponse = await enablerServiceInstance.PostEnabler(req.body,req.header('Token'))
          return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.post(
      '/cilium', 
      [middlewares.tokenValidation,middlewares.dbConnectionValidation],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling POST Cilium endpoint');
        try {
          const serviceEnablerResponse = await enablerServiceInstance.PostCNI(req.body.clusterName,req.body.vim,req.header('Token'))
          return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.post(
      '/:id/terminate',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling Terminate Enabler endpoint');
        try {
          const serviceEnablerResponse = await enablerServiceInstance.TerminateEnabler(req.params.id,req.header('Token'))
          return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.delete(
        '/:id',
        [middlewares.tokenValidation,middlewares.dbConnectionValidation],
        async (req: Request, res: Response, next: NextFunction) => {
          logger.info('💡 Calling Delete Enabler endpoint');
          try {
            const serviceEnablerResponse = await enablerServiceInstance.DeleteEnabler(req.params.id,req.header('Token'))
            return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
          } catch (e) {
            logger.error('🔥 error: %o', e);
            return next(e);
          }
        }
    );

    route.delete(
      '/pv/:id',
      [middlewares.tokenValidation,middlewares.dbConnectionValidation],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling Delete PV and PVC endpoint');
        try {
          const serviceEnablerResponse = await enablerServiceInstance.DeletePVCandPV(req.params.id)
          return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.post(
      '/connect/:id/',
      // middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('💡 Calling Terminate Enabler endpoint');
        try {
          const serviceEnablerResponse = await enablerServiceInstance.ClustermeshConnect(req.params.id)
          return res.status(serviceEnablerResponse.status).json(serviceEnablerResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );
}