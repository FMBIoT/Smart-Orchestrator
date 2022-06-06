import { Service, Inject } from 'typedi';
import config from '../config';
import axios from 'axios'
import ResponseFormatJob from '../jobs/responseFormat';


const osmUri = `${config.osm.host}/osm/admin/v1/`;

@Service()
export default class AuthService {
  constructor(
    // @Inject('enablerModel') private enablerModel: Models.enablerModel,
    @Inject('logger') private logger
    // @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async SignUp(loginData){
    try {

       try {
        const {data}  = await axios.post<JSON>(
          `${osmUri}/tokens`,
          loginData,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );
    
        return new ResponseFormatJob().handler({token: data.id});
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

}
