import { IEnabler } from '@/interfaces/IEnabler';
import mongoose from 'mongoose';

const EnablerSchema = new mongoose.Schema(
  {
    name: String,
    vnf: String,
    nsd: String,
    nsInstance: String,
    vim: String,
    helmChart: String
  }
);

export default mongoose.model<IEnabler & mongoose.Document>('Enabler', EnablerSchema);
