
export interface IWebHookHandler {
    execute(event: any): Promise<any>;
}
