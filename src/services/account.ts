'use strict';

import Account from '@models/account.model';
import * as Errors from '@validator/errors';

export const getDepositAddress = async (params: any) => {
    try {
        let { currency } = params;
        if (currency) {
            return await Account.find({ currency: currency });
        }
        return await Account.find({});
    } catch (e) {
        throw new Errors.NotFoundError();
    }
};


export default {
    getDepositAddress
};