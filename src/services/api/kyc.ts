import { ApiClient } from './http/client';

export const KYC = {
    /**
     * Register new Customer
     */
    register: async (data: any): Promise<any> => {
        return await ApiClient.post(`/api/kycs/me/customers`, data, {}, true);
    },

    /**
     * Get Customer profile
     */
    get: async (customerId: string): Promise<any> => {
        return await ApiClient.get(`/api/kycs/me/customers/${customerId}`);
    },

    /**
     * Update Customer profile
     */
    update: async (customerId: string, data: any): Promise<any> => {
        return await ApiClient.post(`/api/kycs/me/customers/${customerId}/submit`, data, {}, true, true);
    },

};
