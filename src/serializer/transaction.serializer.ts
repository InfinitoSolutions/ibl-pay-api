import { JsonSerializer } from '@serializer/serializer';
import { BillSerializer } from '@serializer/bill.serializer';
import { UserSerializer } from '@serializer/user.serializer';

import { TRANSACTION_STATUS, TRANSACTION_IN_OUT, TRANSACTION_TYPE } from '@models/constant';
import Bill, { IBill } from '@models/bill.model';
import User, { IUser } from '@models/user.model';
import { PaymentScheduler } from '@services/payment/scheduler';
import { ITransaction } from '@models/transaction.model';

export class TransactionSerializer extends JsonSerializer {
    user: IUser;
    constructor(user: IUser) {
        super();
        this.fields = [
            '_id', 'tran_type',
            'bill_id', 'tx_id', 'tx_seq',
            'amount', 'currency', 'bill_type',
            'from_address', 'to_address',
            'status', 'bill', 'request_amount',
            'commission_fee',
            'in_out', 'description',
            'from_user', 'to_user',
            'created_at', 'completed_at',
            'amount_usd',
            'usd_rate'
        ];
        this.user = user;
    }

    async created_at(data: any) {
        return data.createdAt;
    }

    async in_out(data: any) {
        if (data.to_address === this.user.neo_wallet) {
            return TRANSACTION_IN_OUT.IN;
        }
        return TRANSACTION_IN_OUT.OUT;
    }

    async from_user(data: any): Promise<any> {
        if (!data.from_user) {
            return null;
        }
        try {
            const user = await User.findById(data.from_user);
            if (!user) {
                return null;
            }
            return await new UserSerializer().serialize(user);
        } catch (e) {
            return null;
        }
    }

    async to_user(data: any): Promise<any> {
        if (!data.to_user) {
            return null;
        }
        try {
            const user = await User.findById(data.to_user);
            if (!user) {
                return null;
            }
            return await new UserSerializer().serialize(user);
        } catch (e) {
            return null;
        }
    }
}

export class TransactionDetailSerializer extends TransactionSerializer {
    constructor(user: IUser) {
        super(user);
        this.fields = [
            '_id', 'tran_type',
            'tx_id',
            'tx_seq',
            'amount', 'currency',
            'commission_fee',
            'from_address', 'to_address',
            'status', 'bill',
            'from_user', 'to_user',
            'message', 'created_at',
            'description', 'completed_at',
            'bill_type', 'action',
            'buyer_name', 'to_wallet_name',
            'merchant_name', 'from_wallet_name',
            'in_out',
            'amount_usd',
            'usd_rate',
            'confirm_tx_id',
            'withdraw_fee'
        ];
    }

    async bill(data: any): Promise<any> {
        const bill = await this.getBill(data.bill_id);
        if (!bill) {
            return null;
        }
        return await new BillSerializer().serialize(bill);
    }

    async getBill(billId: string | null): Promise<IBill | null> {
        if (!billId) {
            return null;
        }
        try {
            return await Bill.findById(billId);
        } catch (e) {
            return null;
        }
    }

    async message(data: ITransaction): Promise<string | null> {
        return (data.status === TRANSACTION_STATUS.FAILED) ? "neo.transaction.failed" : null;
    }

    /**
     * @todo: Implement FSM
     * 
     * @param data any the action user can perform
     * - PULL: Merchant can pull the scheduled payment
     * - CONFIRM: Buyer can confirm over max fund transaction
     */
    async action(data: ITransaction): Promise<string | null> {
        if (data.tran_type !== TRANSACTION_TYPE.PAYMENT) {
            return null;
        }
        const { status, confirm_tx_id } = data;
        const isPending = (status === TRANSACTION_STATUS.PENDING);
        const isProcessing = (status === TRANSACTION_STATUS.PROCESSING);
        if (!isPending && !isProcessing) {
            return null;
        }
        const bill = await this.getBill(data.bill_id);
        if (!bill || !bill.is_recurring) {
            return null;
        }
        const scheduler = PaymentScheduler.factory(bill.recurring);
        if (!scheduler.isAvailable()) {
            return null;
        }
        if (this.user.isBuyer() && isProcessing && confirm_tx_id) {
            return 'CONFIRM';
        }
        if (this.user.isMerchant() && isPending) {
            return 'PULL';
        }
        return null;
    }
}
