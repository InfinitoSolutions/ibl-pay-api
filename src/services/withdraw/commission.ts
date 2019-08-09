import { IUser } from "@models/user.model";
import MerchantContract from "@models/merchant-contract.model";
import config from 'config';

export const getCommissionRate = async (user: IUser): Promise<number> => {
    const contract = await MerchantContract.findOne({ merchant_id: user._id });
    if (!contract) {
        return 0;
    }
    return contract.commission_rate * config.get('payment.fee.BTC');
};
