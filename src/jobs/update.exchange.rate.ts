import Currency from '@models/currency.model';
import {SUPPORT_CURRENCIES} from '@models/constant';
import {api} from '@cityofzion/neon-js';

const jobHandler = async (job: any, done: any) => {
    try {
        const data = await api.cmc.getPrices(SUPPORT_CURRENCIES);
        if (!data) {
            return done();
        }
        for (let c in data) {
            if (!data[c]) {
                continue;
            }
            await Currency.findOneAndUpdate({ currency: c }, {
                currency: c,
                usd: data[c]
            }, { upsert: true });
        }
    } catch (err) {
        console.log('error: ', err);
        done();
    }
};

export default (agenda: any) => {
    agenda.define('update.exchange.rate', jobHandler);
};
