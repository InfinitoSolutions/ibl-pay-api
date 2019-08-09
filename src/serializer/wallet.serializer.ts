import { JsonSerializer } from '@serializer/serializer';
import { Balance } from '@utils/balance';
import { IUser } from '@models/user.model';
import { getCommissionRate } from '@services/withdraw/commission';
import CommissionFee from '@models/commission.model';
import config from 'config';

export class WalletSerializer extends JsonSerializer {
    constructor(protected user: IUser) {
        super();
        this.fields = ['_id', 'address',
            'currency', 'balance', 'usd',
            'available_balance', 'available_balance_usd',
            'debit', 'withdrawal_fee', 'withdrawal_min'
        ];
    }

    async available_balance(data: any) {
        return await Balance.getAvailableBalance(data);
    }

    async withdrawal_fee(data: any) {
        // if (this.user.isBuyer()) {
        //     return 0;
        // }
        try {
            // const commissionRate = await getCommissionRate(this.user);
            const commissionRate = await CommissionFee.findOne({ type: 'WITHDRAW' });
            const fee = commissionRate ? commissionRate.fee_percentage : config.get('withdraw.fee.BTC');
            return await Balance.getWithdrawalFee(data, fee);
        } catch (e) {
            return 0;
        }
    }

    async withdrawal_min(data: any) {
        return await Balance.getMinimumAmountConfig(data);
    }

    async available_balance_usd(data: any) {
        return await Balance.getAvailableBalanceUsd(data);
    }
}
