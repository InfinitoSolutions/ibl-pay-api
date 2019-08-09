import Bill from '@models/bill.model';
import QueryBuilder from './query-builder';
import { IUser } from '@models/user.model';
import { BILL_STATUS, SCHEDULE_STATUS, RECURRING_TYPE } from '@models/constant';
import moment from 'moment';

export default class BillQueryBuilder extends QueryBuilder {
    status?: string | null;
    exclude_account: boolean = false;

    user: IUser;
    sorts: any = {};
    constructor(user: IUser) {
        super();
        this.status = null;
        this.user = user;
        this.sorts = { 'createdAt': -1 };
    }

    billStatus(billStatus: string): this {
        this.status = billStatus;
        return this;
    }

    buildQuery() {
        const offset = moment().utcOffset() / 60;
        const q = Bill.find({});
        if (this.user) {
            const userId = this.user._id;
            q.and([
                {"parent_id": {$eq: null}},
                {"recurring": {$ne: null}},
                {$or: [
                    {$and: [ {'merchant_id': userId}, {"buyers.0": {"$exists": true}} ]},
                    {$and: [ {"buyers.0": {"$exists": true}}, {'buyers.user_id': userId} ]}
                ]},
            ]);
        }
        if (this.from_date) {
            q.where('recurring.start_date').gte(this.from_date);
        }
        if (this.to_date) {
            q.where('recurring.start_date').lte(this.to_date);
        }
        if (this.status) {
            if (this.status == SCHEDULE_STATUS.CANCEL_REQUEST) {
                q.and([
                    {"status": {$eq: BILL_STATUS.CONFIRMED}},
                    {"recurring.status": {$eq: SCHEDULE_STATUS.CANCEL_REQUEST}},
                ]);
            } else if (this.status == SCHEDULE_STATUS.PROCESSING) {
                q.and([
                    {"status": {$eq: BILL_STATUS.CONFIRMED}},
                    {"recurring.status": {$ne: SCHEDULE_STATUS.CANCEL_REQUEST}},
                    {$or: [
                        {"recurring.end_date": {$gt: moment().startOf('day').add('hours', offset).toDate()}},
                        {$and: [
                            {"recurring.end_date": {$eq: moment().startOf('day').add('hours', offset).toDate()}},
                            {"recurring.schedule_time": {$gte: moment().subtract('hours', offset).format('HH:mm:ss')}},
                        ]}
                    ]},
                ]);
            } else if (this.status == SCHEDULE_STATUS.CANCELLED) {
                q.or([
                    {"status": {$eq: BILL_STATUS.CANCELLED}},
                    {"recurring.status": {$eq: BILL_STATUS.CANCELLED}},
                ]);
            } else if (this.status == SCHEDULE_STATUS.REJECTED) {
                q.and([
                    {"status": {$eq: BILL_STATUS.REJECTED}},
                ]);
            } else if (this.status == SCHEDULE_STATUS.FAILED) {
                q.and([
                    {"status": {$eq: BILL_STATUS.FAILED}},
                ]);
            } else if (this.status == SCHEDULE_STATUS.COMPLETED) {
                q.or([
                    {"status": {$eq: BILL_STATUS.COMPLETED}},
                    {$and: [
                        {"status": {$eq: BILL_STATUS.CONFIRMED}},
                        {"recurring.status": {$eq: null}},
                        {$or: [
                            {"recurring.end_date": {$lt: moment().startOf('day').add('hours', offset).toDate()}},
                            {$and: [
                                {"recurring.end_date": {$eq: moment().startOf('day').add('hours', offset).toDate()}},
                                {"recurring.schedule_time": {$lt: moment().subtract('hours', offset).format('HH:mm:ss')}},
                            ]}
                        ]},
                    ]}
                ]);
            }
        } else {
            q.or([
                {$and: [
                    {"status": {$eq: BILL_STATUS.CONFIRMED}},
                    {"recurring.status": {$eq: SCHEDULE_STATUS.CANCEL_REQUEST}},
                ]},
                {$and: [
                    {"status": {$eq: BILL_STATUS.CONFIRMED}},
                    {"recurring.status": {$ne: SCHEDULE_STATUS.CANCEL_REQUEST}},
                    {$or: [
                        {"recurring.end_date": {$gt: moment().startOf('day').add('hours', offset).toDate()}},
                        {$and: [
                            {"recurring.end_date": {$eq: moment().startOf('day').add('hours', offset).toDate()}},
                            {"recurring.schedule_time": {$gte: moment().subtract('hours', offset).format('HH:mm:ss')}},
                        ]}
                    ]},
                ]},
                {$or: [
                    {"status": {$eq: BILL_STATUS.CANCELLED}},
                    {"recurring.status": {$eq: BILL_STATUS.CANCELLED}},
                ]},
                {$and: [
                    {"status": {$eq: BILL_STATUS.REJECTED}},
                ]},
                {$and: [
                    {"status": {$eq: BILL_STATUS.FAILED}},
                ]},
                {$or: [
                    {"status": {$eq: BILL_STATUS.COMPLETED}},
                    {$and: [
                        {"status": {$eq: BILL_STATUS.CONFIRMED}},
                        {"recurring.status": {$eq: null}},
                        {$or: [
                            {"recurring.end_date": {$lt: moment().startOf('day').add('hours', offset).toDate()}},
                            {$and: [
                                {"recurring.end_date": {$eq: moment().startOf('day').add('hours', offset).toDate()}},
                                {"recurring.schedule_time": {$lt: moment().subtract('hours', offset).format('HH:mm:ss')}},
                            ]}
                        ]},
                    ]}
                ]},
            ]);
        }
        return q;
    }
}
