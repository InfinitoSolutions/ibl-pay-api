import {
    TRANSACTION_STATUS,
    BILL_TYPE,
    TRANSACTION_IN_OUT
} from '@models/constant';
import Transaction from '@models/transaction.model';
import QueryBuilder from './query-builder';
import { IUser } from '@models/user.model';

export default class TransactionQueryBuilder extends QueryBuilder {
    statuses: string[] = [];
    currencies: string[] = [];
    user?: IUser;
    bill_type?: string | null;
    in_out?: string | null;
    tran_type?: string | null;
    keyword?: string | null;

    constructor() {
        super();
        this.statuses = [];
        this.currencies = [];
        this.sorts = { 'createdAt': -1 };
        this.bill_type = null;
        this.in_out = null;
        this.tran_type = null;
        this.keyword = null;
    }

    owner(user: IUser): this {
        this.user = user;
        return this;
    }

    status(status: string | Array<string>): this {
        if (!Array.isArray(status)) {
            status = [status];
        }
        this.statuses = this.statuses.concat(status);
        return this;
    }

    onlyPending(): this {
        return this.status([TRANSACTION_STATUS.PENDING]);
    }

    pending(): this {
        return this.status([TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.PROCESSING]);
    }

    processing(): this {
        return this.status([TRANSACTION_STATUS.PROCESSING]);
    }

    completed(): this {
        return this.status([TRANSACTION_STATUS.COMPLETED]);
    }

    cancelled(): this {
        return this.status([TRANSACTION_STATUS.CANCELLED]);
    }

    currency(currencies: string | Array<string>): this {
        if (!Array.isArray(currencies)) {
            currencies = [currencies];
        }
        this.currencies = this.currencies.concat(currencies.map(c => c.toUpperCase()));
        return this;
    }

    type(billType: string): this {
        this.bill_type = billType;
        return this;
    }

    instant(): this {
        return this.type(BILL_TYPE.INSTANT);
    }

    single(): this {
        return this.type(BILL_TYPE.SINGLE);
    }

    scheduled(): this {
        return this.type(BILL_TYPE.SCHEDULE);
    }

    share(): this {
        return this.type(BILL_TYPE.SHARE);
    }

    tranType(tranType: string): this {
        this.tran_type = tranType;
        return this;
    }

    inOutTransaction(inOut: string): this {
        this.in_out = inOut;
        return this;
    }

    search(keyword: string): this {
        this.keyword = keyword;
        return this;
    }

    buildQuery() {
        let find: any = [];
        if (this.statuses.length > 0) {
            find = [...find, { status: { $in: this.statuses } }];
        }
        if (this.user) {
            let userId = this.user._id;
            find = [...find, { $or: [{ from_user: userId }, { to_user: userId }] }];
        }

        if (this.from_date) {
            find = [...find, { createdAt: { $gte: this.from_date } }];
        }
        if (this.to_date) {
            find = [...find, { createdAt: { $lte: this.to_date } }];
        }

        if (this.currencies.length > 0) {
            find = [...find, { currency: { $in: this.currencies } }];
        }
        if (this.bill_type) {
            find = [...find, { bill_type: this.bill_type }];
        }
        if (this.tran_type) {
            find = [...find, { tran_type: this.tran_type }];
        }
        if (this.in_out && this.user) {
            let userId = this.user._id;
            if (this.in_out === TRANSACTION_IN_OUT.IN) {
                find = [...find, { to_user: userId }];
            } else {
                find = [...find, { from_user: userId }];
            }
        }

        if (this.keyword && this.keyword !== '') {
            const or = [
                { $text: { $search: this.keyword } },
                { keywords: { $regex: new RegExp(this.keyword, 'i') } }
            ];
            find = [...find, { $or: or }];
        }
        return Transaction.find().and(find);
    }
}
