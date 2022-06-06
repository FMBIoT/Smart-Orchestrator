import { ICluster } from '@/interfaces/ICluster';
import mongoose from 'mongoose';

const ClusterSchema = new mongoose.Schema(
  {
    uid: String,
    server: String,
    vim:String,
    config: String
  }
);

export default mongoose.model<ICluster & mongoose.Document>('Cluster', ClusterSchema);
