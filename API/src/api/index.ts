import { Router } from 'express';
import auth from './routes/auth';
import repo from './routes/repository';
import cluster from './routes/clusters';
import enabler from './routes/enabler';


// guaranteed to get dependencies
export default () => {
	const app = Router();
	auth(app);
	repo(app);
    cluster(app);
	enabler(app);

	return app
}