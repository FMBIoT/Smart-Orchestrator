import { Container, Service, Inject } from 'typedi';
import axios from 'axios'
import {load,dump} from 'js-yaml'
import config from '../../config';
import ResponseFormatJob from '../../jobs/responseFormat';
import * as k8s from '@kubernetes/client-node';
import {v4 as uuidv4} from 'uuid';

const osmUri = `${config.osm.host}/osm/admin/v1/`;
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const batchV1Api = kc.makeApiClient(k8s.BatchV1Api);

@Service()
export default class KubeService {
  constructor(
    @Inject('logger') private logger,
    public repositoryService:RepositoryService
  ) {}

  // Job functions

    public async EphemeralJob (fogapp_data){
      const watch = new k8s.Watch(kc);
      let jobName = 'auto-'+ uuidv4();
      // let config = await this.MergeKubeconfig()
      const job = {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {
          "name": `${jobName}`
        },
        "spec": {
          "template": {
            "spec": {
              "containers": [
                {
                  "name": "auto",
                  "image": `${config.schedulerImage}`,
                  "imagePullPolicy": "IfNotPresent",
                  "env": [
                    {
                      "name": "DATA",
                      "value": `${fogapp_data}`
                    },
                    {
                      "name": "KUBECONFIG",
                      "value":`${Kubeconfig}`
                    }
                  ],
                  "resources": {
                    "requests": {
                      "cpu": 1,
                      "memory": "1024Mi"
                    }
                  }
                }
              ],
              "restartPolicy": "Never"
            }
          },
          "backoffLimit": 4
        }
      }
      return new Promise(function (resolve, reject) {
        batchV1Api.createNamespacedJob('default', job )
        .then(async(res)=>{
          watch.watch('/api/v1/namespaces/default/pods',{ allowWatchBookmarks: true },
          async(type, apiObj, watchObj) =>{
            if (type === 'MODIFIED' && watchObj.object.metadata.generateName.startsWith(jobName)) {
              if(watchObj.object.status.phase == 'Succeeded'){
                const pod = watchObj.object.metadata.name
                k8sApi.readNamespacedPodLog(pod,'default').then(async(res) => { resolve([res.body,pod,jobName]) }).catch((err) => {reject(err)})
              }
            }
          },
          (err) => {
              console.log(err);
          })
        })
        .catch(async function(err){ reject(err) });
      });
    }

    // public async MergeKubeConfig(){
    //   let file = {
    //     'apiVersion':'v1',
    //     'clusters':[],
    //     'contexts':[],
    //     'current-context':'',
    //     'kind': 'Config',
    //     'preferences': {},
    //     'users':[]
    //   }
    //   const all = await KubeconfigFile.find({});
    //   all.forEach(function(config){
    //     let kubeconfig = JSON.parse(JSON.stringify(yaml.load(config.config),2,null))
    //     file.clusters.push(kubeconfig.clusters[0])
    //     file.contexts.push(kubeconfig.contexts[0])
    //     file.users.push(kubeconfig.users[0])
    //   })
    //   let context = JSON.parse(JSON.stringify(yaml.load(all[0].config),2,null))
    //   // console.log(context.contexts[0].name)
    //   file['current-context']=context.contexts[0].name
    //   file = JSON.stringify(file)
    //   return file
    // }
}
