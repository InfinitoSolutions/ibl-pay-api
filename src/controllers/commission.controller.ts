import commissionServices from '@services/commission';
import {CommissionSerializer} from '@serializer/commission.serializer';

export const getCommissionFee = async (request: any, h: any) => {
    try {
        const params = request.query;
        const result = await commissionServices.getCommissionFee(params);
        return h.response({ 'data': await new CommissionSerializer().serialize(result, true) }).code(200);
    } catch (e) {
        request.log(['commission.getCommissionFee', 'error', request.params]);
    }
};

export default {
    getCommissionFee
};