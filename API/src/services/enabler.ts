import { Service, Inject } from 'typedi';
import config from '../config';
import axios from 'axios'
import ResponseFormatJob from '../jobs/responseFormat';
import OsmService from './auxiliar/osmService';
import MongoService from './auxiliar/mongoService';
import AutoService from './auxiliar/autoService';
import KubeService from './auxiliar/kubeService';


const osmUri = `${config.osm.host}/osm/`;

@Service()
export default class EnablerService {
  constructor(
    @Inject('logger') private logger,
    public osmService: OsmService,
    public mongoService: MongoService,
    public autoService: AutoService,
    public kubeService: KubeService

  ) {}

  public async GetEnablerInstanced(token){
    try {

       try {
        const {data}  = await axios.get<JSON>(
          `${osmUri}/nslcm/v1/ns_instances`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Authorization': `Bearer ${token}`
            },
          },
        );
    
        return new ResponseFormatJob().handler(data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          this.logger.error('🔥 error: %o', error.response.data.detail);
          return new ResponseFormatJob().handler(error.response.data)
        } else {
          console.log('unexpected error: ', error);
        }
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  public async PostEnabler(postData, token){
    let {enablerName, helmChart, additionalParams, vim, auto, placementPolicy} = postData

    try {
      let cluster = await this.osmService.GetClusterByVim(token,vim)
      if (cluster.status != 200){ return cluster }
      let vnf = await this.osmService.PostVnf(token,enablerName,helmChart)
      if (vnf.status != 200){ return vnf }
      let nsd = await this.osmService.PostNsd(token,enablerName)
      if (nsd.status != 200){ return nsd }
      let nsInstance = await this.osmService.PostNsInstance(token,nsd.data.id,enablerName,additionalParams,vim)
      if (nsInstance.status != 200){ return nsInstance }

      await this.mongoService.PostEnablerDb(enablerName,vnf.data.id,nsd.data.id,nsInstance.data.id,vim,cluster.data.data,helmChart)
      nsInstance.data.cluster = cluster.data.data
      
      return nsInstance
    } catch (e) {
      this.logger.error(e);
      // throw e;
    }
  }

  public async AutoPostEnabler(postData,token){
    let values = await this.autoService.GetEnablerValues(postData.helmChart,token)
    if(values.status != 200){return values}

    let metrics = await this.autoService.GetTotalMetrics(values.data, postData.placementPolicy)
    let job = await this.kubeService.EphemeralJob(metrics)
    if(job.status != 200){return job}
    
    let jobLog = JSON.parse(job.data.log.replace("\n","").replace(/'/g, '"'))
    if(jobLog.length > 1){ return(new ResponseFormatJob().handler({"status":400, "msg":"The enabler has too many replicas, can not be deployed"})) }
    
    let vim = await this.osmService.GetK8sClustersVim(token,jobLog[0]["name"])
    return vim
  }

  public async TerminateEnabler(id,token){
    try {
      try {
       const {data}  = await axios.post<JSON>(
         `${osmUri}/nslcm/v1/ns_instances/${id}/terminate`,
         {},
         {
           headers: {
             Accept: 'application/json',
             'Authorization': `Bearer ${token}`
           },
         },
       );
       return new ResponseFormatJob().handler(data);
     } catch (error) {
       if (axios.isAxiosError(error)) {
         this.logger.error('🔥 error: %o', error.response.data.detail);
         return new ResponseFormatJob().handler(error.response.data)
       } else {
         console.log('unexpected error: ', error);
       }
     }
   } catch (e) {
     this.logger.error(e);
     throw e;
   }
  }

  public async DeleteEnabler(id,token){
    try {
      
      let enablerRecord = await this.mongoService.FindEnablerById(id)
      if (enablerRecord.status == 404){return new ResponseFormatJob().handler(enablerRecord)}

      let nsInstanceResponse = await this.osmService.DeleteNsInstance(token,id)
      if (nsInstanceResponse.status != 200){ return nsInstanceResponse }
      
      let nsdResponse = await this.osmService.DeleteNsd(token,enablerRecord.nsd)
      if (nsdResponse.status != 200){ return nsdResponse }

      let vnfResponse = await this.osmService.DeleteVnf(token,enablerRecord.vnf)
      if (vnfResponse.status != 200){ return vnfResponse }

      await this.mongoService.DeleteEnablerDb(enablerRecord._id)
      
      return new ResponseFormatJob().handler(enablerRecord)
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
