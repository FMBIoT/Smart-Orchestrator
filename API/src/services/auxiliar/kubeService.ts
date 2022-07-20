import { Container, Service, Inject } from 'typedi';
import {load,dump} from 'js-yaml'
import MongoService from './mongoService'
import config from '../../config';
import ResponseFormatJob from '../../jobs/responseFormat';
import * as k8s from '@kubernetes/client-node';
import {v4 as uuidv4} from 'uuid';
import {load,dump} from 'js-yaml'

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const batchV1Api = kc.makeApiClient(k8s.BatchV1Api);
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

@Service()
export default class KubeService {
  constructor(
    @Inject('logger') private logger,
    public mongoService:MongoService
  ) {}

  // Job functions

  public async EphemeralJob (fogapp_data){
    let jobName = 'auto-'+ uuidv4();
    let kubeconfig = await this.MergeKubeConfig()
    kubeconfig = JSON.stringify(kubeconfig)

    fogapp_data = JSON.stringify(fogapp_data)
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
                    "value":`${kubeconfig}`
                  }
                ],
                "resources": {
                  "requests": {
                    "cpu": "100m",
                    "memory": "1024Mi"
                  }
                }
              }
            ],
            "restartPolicy": "Never"
          }
        },
        "backoffLimit": 1
      }
    }
    try{
      let log = await this.CreateAndReadLogJob(job,jobName)
      await this.DeleteJobAndPods(jobName)
      return new ResponseFormatJob().handler(log)
    }catch(e){
      this.logger.error(e)
    }
  }

  public async CreateAndReadLogJob(job,jobName){
    const watch = new k8s.Watch(kc);
    return new Promise(function (resolve, reject) {
      batchV1Api.createNamespacedJob('scheduler', job )
      .then(async(res)=>{
        watch.watch('/api/v1/namespaces/scheduler/pods',{ allowWatchBookmarks: true },
        async(type, apiObj, watchObj) =>{
          if (type === 'MODIFIED' && watchObj.object.metadata.generateName.startsWith(jobName)) {
            if(watchObj.object.status.phase == 'Succeeded'){
              const pod = watchObj.object.metadata.name
              k8sApi.readNamespacedPodLog(pod,'scheduler').then(async(res) => { resolve({log:res.body}) }).catch((err) => {reject({status:400,detail:err})})
            }
            if(watchObj.object.status.phase == 'Failed'){
              const pod = watchObj.object.metadata.name
              k8sApi.readNamespacedPodLog(pod,'scheduler').then((res)=>{ resolve({status:400,log:res.body})}).catch((err)=>{reject({status:400,detail:err})})
            }
          }
        },(err) => { reject({status:400,detail:err})})
      }).catch(async function(err){ reject({status:400,detail:err}) });
    });
  }

  public async DeleteJobAndPods(jobName){
    batchV1Api.deleteNamespacedJob(jobName,'scheduler').then((res)=>{
      k8sApi.deleteCollectionNamespacedPod('scheduler').then((res)=>{}).catch((err)=>{this.logger.error('☸️ Error deleting pods in namespace scheduler',err)})
    }).catch((err)=>this.logger.error('☸️ Error deleting job in namespace scheduler',err))
  }

  public async MergeKubeConfig(){
    let file = {
      'apiVersion':'v1',
      'clusters':[],
      'contexts':[],
      'current-context':'',
      'kind': 'Config',
      'preferences': {},
      'users':[]
    }
    const findAllCluster = await this.mongoService.GetAllClusters()
    findAllCluster.forEach(function(config){
      let kubeconfig = JSON.parse(JSON.stringify(load(config.config),2,null))
      file.clusters.push(kubeconfig.clusters[0])
      file.contexts.push(kubeconfig.contexts[0])
      file.users.push(kubeconfig.users[0])
    })
    file['current-context']= file.contexts.filter(ob => ob.name === 'cloud' ) ? 'cloud' : file.contexts[0].name
    return file
  }

  // PV and PVC

  public async GetPvcList(enablerName,kube){

    let pvcArray = []
    let pvArray = []
    return new Promise(function (resolve, reject) {
      const coreV1Api = kube.makeApiClient(k8s.CoreV1Api);

      coreV1Api.listNamespacedPersistentVolumeClaim('default')
      .then(async(res) => { 
        const pvcObject = res.response.body.items.filter(ob => ob.metadata.hasOwnProperty('labels') && ob.metadata.labels.hasOwnProperty('app.kubernetes.io/instance') && ob.metadata.labels['app.kubernetes.io/instance'].includes(enablerName))
        if(!pvcObject.length){return resolve({status:400,detail:'No PVC with that name'})}
        pvcObject.forEach(pvc => {pvcArray.push(pvc.metadata.name),pvArray.push(pvc.spec.volumeName)})
        resolve(new ResponseFormatJob().handler({pvcArray,pvArray}))})
      .catch(async(err) => { 
        reject(err) })
      });
  }

  public async DeletePvAndPvc(pvc,pv,kube){
    return new Promise(function (resolve, reject) {
      const coreV1Api = kube.makeApiClient(k8s.CoreV1Api);

      coreV1Api.deleteNamespacedPersistentVolumeClaim(pvc,'default')
      .then(async(res) => {
        coreV1Api.deletePersistentVolume(pv).then((res)=>{return resolve({status:200, detail: 'Delete PV and PVC'}) }).catch((err)=>{this.logger.error('☸️ Error deleting persistent volume',err)})
      })
      .catch(async(err) => {this.logger.error('☸️ Error deleting persistent volume claim',err) })
    })   
  }

  // Conmutar entre clusters
  public async CommuteCluster(kubeconfig,context){
    const kube = new k8s.KubeConfig()
    kube.loadFromString(JSON.stringify(kubeconfig))
    kube.setCurrentContext(context)

    return kube
  }

  public async CreateSecretCiliumClustermesh(context,kube){
    const coreV1Api = kube.makeApiClient(k8s.CoreV1Api);

    const strEtcdConfig = 
   `endpoints:
- https://${context}.mesh.cilium.io:32379
trusted-ca-file: '/var/lib/cilium/clustermesh/${context}-ca.crt'
cert-file: '/var/lib/cilium/clustermesh/${context}.crt'
key-file: '/var/lib/cilium/clustermesh/${context}.key'`

    const etcdConfig = Buffer.from(strEtcdConfig, 'binary').toString('base64')
    const caCrtResponse = await coreV1Api.readNamespacedSecret('clustermesh-apiserver-ca-cert','kube-system')
    const caCrt = caCrtResponse.response.body.data['ca.crt']
    const tlsResponse = await coreV1Api.readNamespacedSecret('clustermesh-apiserver-remote-cert','kube-system')
    const tlsCrt = tlsResponse.response.body.data['tls.crt']
    const tlsKey = tlsResponse.response.body.data['tls.key']

    return{
      "apiVersion": "v1",
      "kind": "Secret",
      "metadata": {
          "name": "cilium-clustermesh"
      },
      "type": "Opaque",
      "data": {
        [context] : etcdConfig,
        [`${context}-ca.crt`] : caCrt,
        [`${context}.crt`] : tlsCrt,
        [`${context}.key`] : tlsKey,
      }
    }
  }

  public async CreatePatch(kubeconfig,context){
    const objectCluster = kubeconfig.clusters.filter(cluster => cluster.name == context)[0].cluster.server
    const ip = objectCluster.split('/')[2].split(':')[0];
    const patch = {
      "hostAliases": [
        {
          "ip": ip,
          "hostnames": [
            `${context}.mesh.cilium.io`
          ]
        }
      ]
    }
  return patch
  }

  public async instanciateClusterMesh(secrets,ds){
    const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
    const patch = [
      {
          "op": "replace",
          "path":"/spec/template/spec/",
          "value": {"foo":"bar"}
      }
  ];
    let patchDaemon = await k8sApi.patchNamespacedDaemonSet('cilium','kube-system',patch,undefined, undefined, undefined, undefined,{ headers: { 'content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH } })
    return patchDaemon
  }
}

