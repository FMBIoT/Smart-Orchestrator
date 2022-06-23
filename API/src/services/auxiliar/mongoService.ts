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
    @Inject('enablerModel') private enablerModel: Models.EnablerModel,

  ) {}

  // Cluster DB
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

  public async GetAllClusters(){
    const clusterDBfind = await this.clusterModel.find({})
    if (!clusterDBfind){
      throw new Error('Cluster cannot be find');
    }
    return clusterDBfind
  }

  // Enabler DB

  public async PostEnablerDb(name,vnf,nsd,nsInstance,vim,cluster,helmChart){
    const enablerRecord = await this.enablerModel.create({name,vnf,nsd,nsInstance,vim,cluster,helmChart});
    if (!enablerRecord) {
        throw new Error('Enabler cannot be created');
    }
  }

  public async GetEnablerByCluster(cluster){
    const enablerRecord = await this.enablerModel.find({cluster});
    const data = {enablerRecord}
    return new ResponseFormatJob().handler(data)

  }

  public async FindEnablerById(id){
    const enablerRecord = await this.enablerModel.findOne({"nsInstance":id})
    if (!enablerRecord){
      return {status:404, detail: 'The enabler does no exist in DB'}
    }
    return enablerRecord
  }

  public async DeleteEnablerDb(uid){
    const enablerRecord = await this.enablerModel.findByIdAndDelete(uid)
    if (!enablerRecord){
      throw new Error('Enabler cannot be find');
    }
  }

 
}
