import { Document, Model } from 'mongoose';
import { IUser } from '@/interfaces/IUser';
import { ICluster } from '@/interfaces/ICluster';

declare global {
  namespace Models {    
    export type EnablerModel = Model<IEnabler & Document>;
    export type ClusterModel = Model<ICluster & Document>;
  }
}
