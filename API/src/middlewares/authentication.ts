import { Container } from 'typedi';
import mongoose from 'mongoose';
import { Logger } from 'winston';
import OsmService from '../services/auxiliar/osmService';
import ResponseFormatJob from '../jobs/responseFormat';

const tokenValidation = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  try {
    const osmServiceInstance = Container.get(OsmService)
    const responseOsmService = await osmServiceInstance.IsAuth(req.header('Token'))
    if (responseOsmService.status == 401) {
      return res.status(responseOsmService.status).send(responseOsmService.data);
    }
    return next();
  } catch (e) {
    Logger.error('🔥 Error with connection: %o', e);
    return next(e);
  }
};

export default tokenValidation;
