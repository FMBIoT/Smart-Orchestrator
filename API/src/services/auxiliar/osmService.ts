import { Service, Inject } from 'typedi';
import config from '../../config';
import axios from 'axios'
import ResponseFormatJob from '../../jobs/responseFormat';
import {v4 as uuidv4} from 'uuid';
import {load,dump} from 'js-yaml'

const osmUri = `${config.osm.host}/osm/`;

@Service()
export default class OsmService {
  constructor(
    @Inject('logger') private logger
  ) {}

  // VIM services
  public async GetClusterByVim(token,vim){
    try {
      let {data}  = await axios.get<JSON>(
        `${osmUri}admin/v1/k8sclusters/`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );

      data = data.filter(ob => ob.vim_account == vim)[0].name
      return new ResponseFormatJob().handler({data});
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error)
      } else {
        return new ResponseFormatJob().handler({status:500,detail:'No VIM match'})
      }
    }
  }
 
  public async GetK8sClustersVim(token,cluster) {

    try {
      let {data}  = await axios.get<JSON>(
        `${osmUri}admin/v1/k8sclusters/`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );
      data = data.find(x => x.name === cluster).vim_account
      return new ResponseFormatJob().handler({data});
    }catch(err){
      if (axios.isAxiosError(err)) {
        this.logger.error('🔥 error: %o', err.response.data.detail);
        return new ResponseFormatJob().handler(err)
      } else {
        return new ResponseFormatJob().handler({status:500,detail:'No VIM match'})
      }
    }
  }

  public async PostVim(token){
    let vimName = uuidv4();

    try {
      const {data}  = await axios.post<JSON>(
        `${osmUri}admin/v1/vim_accounts`,
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
        `${osmUri}admin/v1/vim_accounts/${vim_account}`,
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
        `${osmUri}admin/v1/tokens/${token}`,
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
        if (!error.response) {
          this.logger.error('💊 Middleware connection error');
          return {status:500, data:{code:'ECONNREFUSED',status:500,detail:`No connection with ${config.osm.host}`}}
        }
        this.logger.error('💊 Middleware auth error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  // VNF Services
  public async PostVnf(token,enablerName,helmChart){
    const vnfData = dump({
      vnfd: {
        id: enablerName,
        'product-name': enablerName,
        df: [
          {
            id: 'default-df'
          }
        ],
        kdu: [
          {
            name: enablerName,
            "helm-chart": helmChart
          }
        ],
        "ext-cpd": [
          {
            id: "mgmtnet-ext",
            "k8s-cluster-net": "mgmtnet"
          }
        ],
        "mgmt-cp": "mgmt-ext"
      }
    },{ sortKeys: true })
  
    try{
      const {data}  = await axios.post<JSON>(
        `${osmUri}vnfpkgm/v1/vnf_packages_content`,
        vnfData,
        {
          headers: {
            'Content-Type': 'application/yaml',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );

      return new ResponseFormatJob().handler(data);
    }catch(error){
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }
 
  public async DeleteVnf(token,id){
    try {
      const {data}  = await axios.delete<JSON>(
        `${osmUri}/vnfpkgm/v1/vnf_packages/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );
      
      return {status:200}
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)

      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  // NSD Services
  public async PostNsd(token,vnfName){
    const nsdData = dump({
      "nsd": {
        "nsd": [
          {
            "df": [
              {
                "id": "default-df",
                "vnf-profile": [
                  {
                    "id": vnfName,
                    "virtual-link-connectivity": [
                      {
                        "constituent-cpd-id": [
                          {
                            "constituent-base-element-id": vnfName,
                            "constituent-cpd-id": "mgmtnet-ext"
                          }
                        ],
                        "virtual-link-profile-id": "mgmtnet"
                      }
                    ],
                    "vnfd-id": vnfName
                  }
                ]
              }
            ],
            "id": vnfName,
            "name": vnfName,
            "virtual-link-desc": [
              {
                "id": "mgmtnet",
                "mgmt-network": true
              }
            ],
            "vnfd-id": [
              vnfName
            ]
          }
        ]
      }
    },{ sortKeys: true })

    try{
      const {data}  = await axios.post<JSON>(
        `${osmUri}/nsd/v1/ns_descriptors_content`,
        nsdData,
        {
          headers: {
            'Content-Type': 'application/yaml',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );

      return new ResponseFormatJob().handler(data);
    }catch(error){
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  public async DeleteNsd(token,id){
    try {
      const {data}  = await axios.delete<JSON>(
        `${osmUri}/nsd/v1/ns_descriptors/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );
      return {status:200}
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  // NS Services
  public async PostNsInstance(token,nsdId,enablerName,additionalParams,vim){

    const  k8snamespace = enablerName.includes('cilium') ? 'kube-system':'default'
    try{

      const {data}  = await axios.post<JSON>(
        `${osmUri}/nslcm/v1/ns_instances_content`,
        { 
          "nsName": enablerName, 
          nsdId,
          "vimAccountId":vim,
          "k8s-namespace": k8snamespace,
          "additionalParamsForVnf": [{
            "member-vnf-index": enablerName, 
            "additionalParamsForKdu": [
            { 
              "kdu_name": enablerName,
              additionalParams
            }]
          }]
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
    }catch(error){
      if (axios.isAxiosError(error)) {
        this.logger.error('🔥 error: %o', error.response.data.detail);
        return new ResponseFormatJob().handler(error.response.data)
      } else {
        console.log('unexpected error: ', error);
      }
    }
  }

  public async DeleteNsInstance(token,id){
    try {
      const data  = await axios.delete<JSON>(
        `${osmUri}/nslcm/v1/ns_instances/${id}`,
        {
          headers: {
            Accept: 'application/json',
            'Authorization': `Bearer ${token}`
          },
        },
      );
      return {status:200}

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

