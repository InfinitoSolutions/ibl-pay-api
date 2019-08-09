'use strict';

import utils from '@utils/index';
import currencyService from '@services/currency';
import {CurrencySerializer} from '@serializer/currency.serializer';

export const getExchangeRate = async (request: any, h: any) => {
    try {
        const result = await currencyService.getExchangeRate();
        return h.response({ 'data': await new CurrencySerializer().serialize(result, true) }).code(200);
    } catch (err) {
        request.log(['user.getExchangeRate', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export default {
    getExchangeRate
};