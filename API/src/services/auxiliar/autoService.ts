import { Container, Service, Inject } from 'typedi';
import axios from 'axios'
import {load,dump} from 'js-yaml'

import {gzip, ungzip} from 'node-gzip';
import config from '../../config';
import RepositoryService from '../repository';
import ResponseFormatJob from '../../jobs/responseFormat';

const osmUri = `${config.osm.host}/osm/admin/v1/`;

@Service()
export default class AutoService {
  constructor(
    @Inject('logger') private logger,
    public repositoryService:RepositoryService
  ) {}

  // Get Values

    public async GetEnablerValues(helmChart,token){
      const splitHelmChart = helmChart.split("/");
      const repository = splitHelmChart[0]
      const enabler = splitHelmChart[1]

      try{
        const repositories = await this.repositoryService.GetRepository(token)
        if (repositories.status != 200){ return repositories }

        const repoExist = repositories.data.filter(x => x.name === repository);
        if (!repoExist.length){return { status:404, msg: "Repo does not exist" }} 

        const index = await this.GetIndex(repoExist[0].url,enabler)
        if(typeof index === 'object'){return index}
        
        let enablerName = enabler.split(':')
        const values = await this.GetValues(enablerName[0],index)
        
        return new ResponseFormatJob().handler(values)

      }catch(e){
        this.logger.error('🔥 error: %o', e);
        return;
      }
    }

    public async GetIndex(url,enabler){
      try {
        const data  = await axios.get<JSON>(
          `${url}/index.yaml`,
          {
            headers: {
              Accept: 'application/json'
            },
          },
        );
        let enablerName = enabler.split(':')
        const index = load(data.data,'utf8').entries

        if( enablerName[0] in index ){
          if(enabler.includes(':')){
            let enablerObject = index[enablerName[0]].filter(ob => ob.version === enablerName[1])
            enablerObject = !enablerObject.length ? {status:404, detail: 'Version does not exists'} : enablerObject[0].urls[0]
            return enablerObject
          }else{
            return index[enabler][0].urls[0]
          }
        }else{
          return {status:404, detail: 'Enabler does not exists'}
        }
       

      } catch (error) {
        if (axios.isAxiosError(error)) {
          this.logger.error('🔥 error: %o', error.response.data.detail);
          return new ResponseFormatJob().handler(error.response.data)
        } else {
          console.log('unexpected error: ', error);
        }
        
      }
    }

    public async GetValues(enabler,index) {

      try{
          const data  = await axios.get<JSON>(
            index,
            {
              responseType: 'arraybuffer'
            },
          );    
          const decompressed = await ungzip(data.data);
          const unzip =decompressed.toString('utf8');
          const values =unzip.substring(unzip.indexOf(`${enabler}/values.yaml`))
          if (values.startsWith(`${enabler}/values.yaml`)){
            var lines = values.split('\n');
            lines.splice(0,1);
            var joinLines = lines.join('\n').replace(/\0/g,"").replace(/^#(.*)$/mg,'').replace(/#.*/g,'');
            var yamlString = joinLines.substring(0,joinLines.indexOf(`${enabler}/`))
          }
          const jsonValues = load(yamlString);
          return jsonValues
        }catch(err){
          return {status:400, detail:'Something went wrong getting the values'};
      }
    
    }

  // CPU, Memory & Replicas

    public async GetTotalMetrics(values,placement_policy){
      let normalizedData = {'cpu':[],'memory':[],'replicas':0,'placement_policy':""}

      let componentValues = Object.values(values).filter(item => typeof item == 'object' && item.hasOwnProperty('resources'))
      
      componentValues.forEach(function(ob){
        if(ob.resources.requests in ob){
          normalizedData.cpu.push(ob.resources.requests.cpu)
          normalizedData.memory.push(ob.resources.requests.memory)}
        else{
            normalizedData.cpu.push('250m'), normalizedData.memory.push('1028Mi')
        }
      })
      
      let total_replicas = componentValues.reduce((sum, value) => (sum + value.replicaCount), 0);

      normalizedData.replicas = total_replicas

      normalizedData.placement_policy = placement_policy

      return normalizedData
    }
    
}
