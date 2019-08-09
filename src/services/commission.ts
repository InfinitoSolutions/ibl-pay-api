'use strict';

import CommissionFee from '@models/commission.model';
import * as Errors from '@validator/errors';

export const getCommissionFee = async (params: any) => {
    try {
        let { type } = params;
        if (type) {
            return await CommissionFee.find({ type });
        }
        return await CommissionFee.find({});
    } catch (e) {
        throw new Errors.NotFoundError();
    }
};


export default {
    getCommissionFee
};