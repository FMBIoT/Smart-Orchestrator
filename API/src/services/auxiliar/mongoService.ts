import { Service, Inject } from 'typedi';
import config from '../../config';
import ResponseFormatJob from '../../jobs/responseFormat';
import {load,dump} from 'js-yaml'

const osmUri = `${config.osm.host}/osm/admin/v1/`;

@Service()
export default class MongoService {
  constructor(
    @Inject('logger') private logger,
    @Inject('clusterModel') private clusterModel: Models.ClusterModel,

  ) {}

  public async PostClusterDb(uid,vim,credentials){
    let server = credentials.clusters[0].cluster.server
    const configData = dump(credentials)
    const clusterRecord = await this.clusterModel.create({uid,server,vim,config: configData});
    if (!clusterRecord) {
        throw new Error('Cluster cannot be created');
    }
  }

  public async DeleteClusterDb(uid){
    const clusterDBdeleted = await this.clusterModel.findOneAndDelete({ uid })
    if (!clusterDBdeleted) {
      throw new Error('Cluster cannot be deleted');
    }
  }

  public async FindClusterById(uid){
    const clusterDBfind = await this.clusterModel.findOne({ uid })
    if (!clusterDBfind){
      throw new Error('Cluster cannot be find');
    }
    return clusterDBfind.vim
  }
 
}
