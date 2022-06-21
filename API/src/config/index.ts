import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * Your favorite port
   */
  port: process.env.PORT,

  /**
   * That long string from mlab
   */
  databaseURL: process.env.MONGODB_URI,
  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },
  api: {
    prefix: '/api',
  },
  osm:{
    host:`https://${process.env.OSM_HOST}:${process.env.OSM_PORT}`,
  },
  targetsProm: process.env.PATH_TARGETS_PROM,
  schedulerImage: process.env.SCHEDULER_IMAGE
  /**
   * Mailgun email credentials
   */
};
