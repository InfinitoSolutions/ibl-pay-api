import axios from 'axios';
import { ApiAuthentication } from './auth';
import { ApiConfiguration } from './config';

class ApiError extends Error {
    constructor(public message: string, public errors: string[] = []) {
        super(message);
    }
}

export class ApiClient {
    private static success(response: any) {
        return response.data;
    }

    private static error(e: any) {
        if (e.response && e.response.data) {
            const errors = e.response.data.errors || ['unknown'];
            const message = e.response.data.message || e.message;
            throw new ApiError(message, errors);
        }
        return this.handleUnknownError(e);
    }

    private static handleUnknownError(e: Error) {
        throw new ApiError(e.message, ['unknown']);
    }

    private static uri(uri: string): string {
        return `${ApiConfiguration.BASE_URL}${uri}`;
    }

    private static async configs(params: any = {}, tokenRequired: boolean = false): Promise<any> {
        const token = await ApiAuthentication.getAuthToken();
        const baseUrl = ApiConfiguration.BASE_URL;
        let headers: any = {};
        if (tokenRequired && token !== '') {
            headers = { 'X-user': token };
        }

        return { baseUrl, headers, params };
    }

    static async get(uri: string, params: any = {}) {
        try {
            const config = await this.configs(params);
            const r = await axios.get(this.uri(uri), config);
            return this.success(r);
        } catch (e) {
            return this.error(e);
        }
    }

    static async post(uri: string, data: any = {}, params: any = {}, tokenRequired: boolean = false, isFormData: boolean = false) {
        try {
            let config = await this.configs(params, tokenRequired);
            if (isFormData) {
                config.headers = {
                    ...config.headers,
                    ...data.getHeaders()
                };
            }
            const r = await axios.post(this.uri(uri), data, config);
            return this.success(r);
        } catch (e) {
            this.error(e);
        }
    }

    static async patch(uri: string, data: any = {}, params: any = {}) {
        try {
            const config = await this.configs(params);
            const r = await axios.patch(this.uri(uri), data, config);
            return this.success(r);
        } catch (e) {
            this.error(e);
        }
    }

    static async put(uri: string, data: any = {}, params: any = {}) {
        try {
            const config = await this.configs(params);
            const r = await axios.put(this.uri(uri), data, config);
            return this.success(r);
        } catch (e) {
            this.error(e);
        }
    }

    static async delete(uri: string, params: any = {}) {
        try {
            const config = await this.configs(params);
            const r = await axios.delete(this.uri(uri), config);
            return this.success(r);
        } catch (e) {
            this.error(e);
        }
    }
}
