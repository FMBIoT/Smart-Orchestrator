import { Router, Request, Response, NextFunction } from 'express';
// import { Container } from 'typedi';
import Logger from '../../loaders/logger';

// import { Logger } from 'winston';

const route = Router();

export default (app: Router) => {
    app.use('/enabler', route);

    route.get(
      '/instanced', 
      async (req: Request, res: Response, next: NextFunction) => {
        res.json({'ok':'hola'})
       }
    );
    route.post(
      '/', 
      async (req: Request, res: Response, next: NextFunction) => {
        res.json({'ok':'hola'})
      }
    );
    route.post(
      '/:id/terminate',
      async (req: Request, res: Response, next: NextFunction) => {
        res.json({'ok':'hola'})
      }
    )
    route.delete(
        '/:id',
        async (req: Request, res: Response, next: NextFunction) => {
        res.json({'ok':'hola'})
        }
    )

}