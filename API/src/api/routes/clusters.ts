import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import ClusterService from '../../services/clusters';
import { Logger } from 'winston';
import PrometheusJob from '../../jobs/prometheusJob';
import OsmService from '../../services/auxiliar/osmService';
import MongoService from '../../services/auxiliar/mongoService';
import middlewares from '../../middlewares';

const route = Router();

export default (app: Router) => {
    app.use('/k8sclusters', route);
    const logger:Logger = Container.get('logger');

    route.get(
      '/',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling get Clusters endpoint');
        try {
          const clusterServiceInstance = Container.get(ClusterService);
          const serviceClusterResponse = await clusterServiceInstance.GetClusters(req.header('Token'))
          return res.status(serviceClusterResponse.status).json(serviceClusterResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    route.post(
      '/',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling post Clusters endpoint');
        let {name,description,credentials,vim_account,k8s_version} = req.body
        try {
          const osmServiceInstance = Container.get(OsmService);
          const osmResponse = await osmServiceInstance.PostVim(req.header('Token'))
          vim_account = osmResponse.data.id

          const clusterServiceInstance = Container.get(ClusterService);
          const serviceClusterResponse = await clusterServiceInstance.PostClusters({name, description, credentials,vim_account,k8s_version,"nets":{"net1":"vim-net"}},req.header('Token'));

          if(serviceClusterResponse.status == 200){
            new PrometheusJob().WriteTargets(credentials)
            const mongoServiceInstance = Container.get(MongoService);
            await mongoServiceInstance.PostClusterDb(serviceClusterResponse.data.id,vim_account,credentials)
            return res.status(serviceClusterResponse.status).json(serviceClusterResponse.data);
          }else{
            await osmServiceInstance.DeleteVim(vim_account,req.header('Token'))
            return res.status(serviceClusterResponse.status).json(serviceClusterResponse.data);   
          }
          
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );
    
    route.delete(
      '/:id',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('Calling delete Cluster endpoint by id %o',req.params.id);
        try {
          const clusterServiceInstance = Container.get(ClusterService);
          const serviceClusterResponse = await clusterServiceInstance.DeleteCluster(req.params.id,req.header('Token'));
          
          if(serviceClusterResponse.status == 200){
            new PrometheusJob().DeleteTargets(req.params.id)
            const mongoServiceInstance = Container.get(MongoService);
            const vim_account = await mongoServiceInstance.FindClusterById(req.params.id)

            const osmServiceInstance = Container.get(OsmService);
            await osmServiceInstance.DeleteVim(vim_account,req.header('Token'))
            await mongoServiceInstance.DeleteClusterDb(req.params.id)
            return res.status(serviceClusterResponse.status).json(serviceClusterResponse.data);
          }
          return res.status(serviceClusterResponse.status).json(serviceClusterResponse.data);   

        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    )

}