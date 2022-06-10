import { Container } from 'typedi';
import { Logger } from 'winston';
import config from '../config'
import OsmService from '../services/auxiliar/osmService';

const tokenValidation = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  try {
    const osmServiceInstance = Container.get(OsmService)
    const responseOsmService = await osmServiceInstance.IsAuth(req.header('Token'))
    if (responseOsmService.status == 401) {
      return res.status(responseOsmService.status).send(responseOsmService.data);
    }else{
      if(responseOsmService.status == 500){
        return res.status(responseOsmService.status).send(responseOsmService.data);
      }
    }
    return next();
  } catch (e) {
    Logger.error('🔥 Error: %o', e);
    return next(e);
  }
};

export default tokenValidation;
