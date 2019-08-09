import WebHookModel, { IWebHook } from '@models/web-hook.model';
import { WEB_HOOK_STATUS } from '@models/constant';
import handlers from './handlers';
import { WEB_HOOK_QUEUE, queues } from '@queues/index';

export default class WebHookManager {

    static async store(request: any) {
        const { event, data } = request.payload;

        const eventHook = await WebHookModel.create({
            status: WEB_HOOK_STATUS.PENDING,
            event: event,
            data: data
        });

        const params = {
            _id: String(eventHook._id)
        };
        await queues[WEB_HOOK_QUEUE].add(params);
        return eventHook;
    }

    static async processWebHookEvent(eventHookId: string) {
        if (!eventHookId) {
            return;
        }
        try {
            const event = await WebHookModel.findById(eventHookId) as IWebHook;
            if (!event) {
                return;
            }
            return await this.process(event);
        } catch (e) {
            console.log(e);
        }
    }

    static async process(hook: IWebHook) {
        const { event } = hook;
        if (!(event in handlers)) {
            return;
        }
        try {
            const handler = new handlers[event]();
            await handler.execute(hook);

            const updates = {
                status: WEB_HOOK_STATUS.COMPLETED,
                completed_at: new Date()
            };
            await WebHookModel.findOneAndUpdate({ _id: hook._id }, updates);
        } catch (e) {
            console.log('PROCESS WEB HOOK ERROR: ', e);
        }
    }
}
