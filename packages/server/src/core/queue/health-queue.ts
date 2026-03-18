import Bull from 'bull';
import { config } from '../config.js';

export const healthQueue = new Bull('health-scoring', config.REDIS_URL);
export const alertQueue = new Bull('alerts', config.REDIS_URL);
export const meetingsQueue = new Bull('meeting-notes-processing', config.REDIS_URL);
