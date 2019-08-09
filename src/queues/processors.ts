import { WEB_HOOK_QUEUE } from "./queue";
import { Indexer } from "./indexer";
import { WebHookManager } from "@services/web-hooks";
const debug = require('debug')('queue');

const webHookJobHandler = async (job: any) => {
    try {
        debug('EXECUTE WEB HOOK JOB: ', job.data);
        const { _id } = job.data;
        if (!_id) {
            return;
        }
        await WebHookManager.processWebHookEvent(_id);
        return true;
    } catch (e) {
        debug("webHookJobHandler::ERROR:", e);
        return false;
    }
};

export const jobHandlers: Indexer = {
    [WEB_HOOK_QUEUE]: webHookJobHandler
};
