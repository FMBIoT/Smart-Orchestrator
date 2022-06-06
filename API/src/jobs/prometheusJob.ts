import { Container,Inject } from 'typedi';
import { Logger } from 'winston';
import fs from 'fs';
import {load,dump} from 'js-yaml'
import config from '../config';
import { ICluster } from '../interfaces/ICluster';

export default class PrometheusJob {
  constructor(
    @Inject('clusterModel') private clusterModel: Models.ClusterModel,
  ) {}
  
  public async WriteTargets(credentials) {
    const Logger: Logger = Container.get('logger');
  
    let server = credentials.clusters[0].cluster.server
    const configCluster = dump(credentials)

    let configJson = JSON.parse(JSON.stringify(load(configCluster),2,null))
    fs.readFile(`${config.targetsProm}`,function(err,data){
      if(err){
          Logger.error('🔥 error: %o', err)
      }
      let ip = server.split('/')[2].split(':')[0];
      let target = {
        "targets": [
          `${ip}:30090`
        ],
        "labels": {
          "cluster_name": `${configJson.clusters[0].name}`
        }
      }

      var targetsJson = data.toString();// Convertir datos binarios a cadena
      if(targetsJson==""){
        targetsJson = []
        targetsJson.push(target)
      }else{
        targetsJson = JSON.parse(targetsJson);// Convierte la cadena en un objeto json
        targetsJson.push(target)
      }

      var str = JSON.stringify(targetsJson);// Debido a que el archivo de escritura de nodejs solo reconoce cadenas o números binarios, el objeto json se convierte en una cadena y se reescribe en el archivo json
      fs.writeFile(`${config.targetsProm}`,str,function(err){if(err){Logger.error('🔥 error: %o', err)} })
      return targetsJson
    })
  }

  public async DeleteTargets(id){
    const Logger: Logger = Container.get('logger');
    const clusterModel = Container.get('clusterModel') as mongoose.Model<ICluster & mongoose.Document>;

    const clusterDB = await clusterModel.findOne({ uid: id })
    fs.readFile(`${config.targetsProm}`,function(err,data){
      if(err){
          return console.error(err);
      }
      let clusterDBJson = JSON.parse(JSON.stringify(load(clusterDB['config']),2,null))
      var targetsJson = data.toString();
      targetsJson = JSON.parse(targetsJson);
      for( var i = 0; i < targetsJson.length; i++){                           
        if ( targetsJson[i]['labels']['cluster_name'] === clusterDBJson['clusters'][0]['name']) { 
          targetsJson.splice(i, 1); 
          i--; 
        }
      }    
      var str = JSON.stringify(targetsJson);
      fs.writeFile(`${config.targetsProm}`,str,function(err){ if(err){Logger.error('🔥 error: %o', err)}})
      return targetsJson 
    })
  }
}
