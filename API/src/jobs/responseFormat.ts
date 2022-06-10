import { Container } from 'typedi';
import { Logger } from 'winston';

export default class ResponseFormatJob {
  public async handler(response): Promise<JSON> {
    const Logger: Logger = Container.get('logger');
    try {
      // Logger.debug('✌️ Response formatter Job triggered!');
      if ('status' in response){
        return {status:response.status, data:response}
      }else{
          return {status: 200, data:response}
      }

    } catch (e) {
      Logger.error('🔥 Error with Response formatter Job: %o', e);
      return {e};
    }
  }
}
