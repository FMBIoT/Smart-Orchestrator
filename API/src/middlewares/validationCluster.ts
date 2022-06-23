import { Container } from 'typedi';
import { Logger } from 'winston';
import config from '../config'
import OsmService from '../services/auxiliar/osmService';
import Joi from 'joi';

const validationCluster = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  try {
    Logger.info('💊 Middleware validation Cluster fired')
    const schemas = { 
        clusterPOST: Joi.object().keys({ 
            name: Joi.string().valid(req.body.credentials.contexts[0].name).required(),
            description: Joi.string().required(),
            credentials: Joi.object().keys({
                apiVersion: Joi.string().required(),
                clusters: Joi.array().items(
                            Joi.object().keys({
                                cluster: Joi.object().required(),
                                name: Joi.string().valid(req.body.credentials.contexts[0].name).required()
                            })).required(),
                contexts: Joi.array().required(),
                'current-context': Joi.string().required(),
                kind:Joi.string().required(),
                preferences:Joi.object().required(),
                users: Joi.array().required()
            }),
            k8s_version: Joi.string().required()
        })
    }; 
    const validation = schemas.clusterPOST.validate(req.body)
    if(validation.error){
      Logger.error('💊 Middleware validation Cluster error')
      return res.status(400).send(validation.error.details);
    }
    return next();
  } catch (e) {
    Logger.error('🔥 Error: %o', e);
    return next(e);
  }
};

export default validationCluster;
