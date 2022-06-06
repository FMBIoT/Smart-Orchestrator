import { Service, Inject } from 'typedi';
import config from '../../config';
import axios from 'axios'
import ResponseFormatJob from '../../jobs/responseFormat';
import {v4 as uuidv4} from 'uuid';
const osmUri = `${config.osm.host}/osm/admin/v1/`;

@Service()
export default class OsmService {
  constructor(
    @Inject('logger') private logger
  ) {}

  // VIM services

  public async PostVim(token){
    let vimName = uuidv4();

    try {
      const {data}  = await axios.post<JSON>(
        `${osmUri}/vim_accounts`,
        {
          "name": vimName,
          "vim_type": "dummy",
          "vim_url": "http://localhost/dummy",
          "vim_tenant_name": "p",
          "vim_user": "u",
          "vim_password": "p"
        },
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
        return new ResponseFormatJob().handler(error)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  public async DeleteVim(vim_account,token){

    try {
      const {data}  = await axios.delete<JSON>(
        `${osmUri}/vim_accounts/${vim_account}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );
  
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  // Token services
  public async IsAuth(token){
    try {
      const {data}  = await axios.get<JSON>(
        `${osmUri}/tokens/${token}`,
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
        this.logger.error('💊 Middleware auth error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }
 
}
