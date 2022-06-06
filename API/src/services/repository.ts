import { Service, Inject } from 'typedi';
import config from '../config';
import axios from 'axios'
import ResponseFormatJob from '../jobs/responseFormat';

const osmUri = `${config.osm.host}/osm/admin/v1/`;

@Service()
export default class RepositoryService {
  constructor(
    @Inject('logger') private logger
  ) {}

  public async GetRepository(token){
       try {
        const {data}  = await axios.get<JSON>(
          `${osmUri}/k8srepos`,
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
  }

  public async GetRepositoryById(id,token){
    try {
     const {data}  = await axios.get<JSON>(
       `${osmUri}/k8srepos/${id}`,
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
  }

  public async PostRepository(repoData,token){
    try {
     const {data}  = await axios.post<JSON>(
       `${osmUri}/k8srepos`,
       repoData,
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
  }

  public async DeleteRepository(id,token){
    try {
     const {data}  = await axios.delete<JSON>(
       `${osmUri}/k8srepos/${id}`,
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
  }
}
