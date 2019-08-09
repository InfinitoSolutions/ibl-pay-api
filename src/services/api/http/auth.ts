import { ApiConfiguration } from "./config";

export class ApiAuthentication {
    static async getAuthToken(): Promise<string> {
        const token = ApiConfiguration.SESSION;
        if (!token) {
            return '';
        }
        return token;
    }
}