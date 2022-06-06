import { Service, Inject } from 'typedi';
import config from '../config';
import axios from 'axios'
import ResponseFormatJob from '../jobs/responseFormat';
import OsmService from './auxiliar/osmService';


const osmUri = `${config.osm.host}/osm/admin/v1/`;

@Service()
export default class ClusterService {
  constructor(
    @Inject('logger') private logger,
    public osmService: OsmService
  ) {}

  public async GetClusters(token){
    try {

       try {
        const {data}  = await axios.get<JSON>(
          `${osmUri}/k8sclusters`,
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

  public async PostClusters(clusterData, token){
    try {

     const {data}  = await axios.post<JSON>(
       `${osmUri}/k8sclusters`,
       clusterData,
       {
         headers: {
           'Content-Type': 'application/json',
           Accept: 'application/json',
           'Authorization': `Bearer ${token}`
         },
       },
     );
 
     return new ResponseFormatJob().handler(data)
   } catch (error) {
     if (axios.isAxiosError(error)) {
       this.logger.error('🔥 error: %o', error.response.data.detail);
       return new ResponseFormatJob().handler(error.response.data)
     } else {
       console.log('unexpected error: ', error);
     }
   }
  }

  public async DeleteCluster(id,token){

    try {

      const {data}  = await axios.delete<JSON>(
        `${osmUri}/k8sclusters/${id}`,
         {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );
  
      return new ResponseFormatJob().handler(data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

}
