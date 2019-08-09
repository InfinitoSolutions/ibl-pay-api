import Queue from 'bull';
import { Indexer } from './indexer';

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
export const WEB_HOOK_QUEUE = 'WEB_HOOK_QUEUE';

export const queues: Indexer = {
    [WEB_HOOK_QUEUE]: new Queue(WEB_HOOK_QUEUE, REDIS_URI)
};

export const rabbitqueue = {};