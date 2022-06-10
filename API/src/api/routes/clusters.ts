import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import ClusterService from '../../services/clusters';
import { Logger } from 'winston';
import PrometheusJob from '../../jobs/prometheusJob';
import OsmService from '../../services/auxiliar/osmService';
import MongoService from '../../services/auxiliar/mongoService';
import middlewares from '../../middlewares';

const route = Router();

/**
  * @TODO Check errors of await.
*/
export default (app: Router) => {
    app.use('/k8sclusters', route);
    const logger:Logger = Container.get('logger');
    const clusterServiceInstance = Container.get(ClusterService);
    const osmServiceInstance = Container.get(OsmService);
    const mongoServiceInstance = Container.get(MongoService);

    // Get Cluster
    route.get(
      '/',
      middlewares.tokenValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Clusters endpoint');
        try {
          const serviceClusterResponse = await clusterServiceInstance.GetClusters(req.header('Token'))
          return res.status(serviceClusterResponse.status).json(serviceClusterResponse.data);
        } catch (e) {
          logger.error('🔥 error: %o', e);
          return next(e);
        }
      }
    );

    // Post Cluster
    route.post(
      '/',
      [middlewares.tokenValidation,middlewares.dbConnectionValidation],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling POST Clusters endpoint');
        let {name,description,credentials,vim_account,k8s_version} = req.body
        try {
          const osmResponse = await osmServiceInstance.PostVim(req.header('Token'))
          vim_account = osmResponse.data.id

          const serviceClusterResponse = await clusterServiceInstance.PostClusters({name, description, credentials,vim_account,k8s_version,"nets":{"net1":"vim-net"}},req.header('Token'));

          if(serviceClusterResponse.status == 200){
            new PrometheusJob().WriteTargets(credentials)
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
    
    // Delete Cluster
    route.delete(
      '/:id',
      [middlewares.tokenValidation,middlewares.dbConnectionValidation],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling DELETE Cluster endpoint by id %o',req.params.id);
        try {
          const serviceClusterResponse = await clusterServiceInstance.DeleteCluster(req.params.id,req.header('Token'));
          
          if(serviceClusterResponse.status == 200){
            new PrometheusJob().DeleteTargets(req.params.id)
            const vim_account = await mongoServiceInstance.FindClusterById(req.params.id)

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