import { isSingleObject, isDate } from '@utils/data-type';
import { formatDateKYC } from '@utils/date';

export class KYCSerializer {
    fields: string[];
    fields2: string[];
    ex_fields: string[] = ['_id', '__proto__', 'createdAt', 'updatedAt'];

    [name: string]: any;
    constructor() {
        this.fields = [];
        this.fields2 = [];
    }

    async serialize(data: any) {
        return await this._serialize(data);
    }

    async _serialize(data: any): Promise<any> {
        let r: any = {};
        const promises = this.fields.map(async (field) => {
            if (isSingleObject(data[field])) {
                await this.serializeObject(r, data[field]._doc, field);
            } else {
                r[field] = await this.serializeField(data, field);
            }
            return true;
        });
        await Promise.all(promises);

        if (this.fields2.length > 0) {
            let r2: any = {};
            const promises = this.fields2.map(async (field) => {
                if (isSingleObject(data[field])) {
                    await this.serializeObject(r2, data[field]._doc, field);
                } else {
                    r2[field] = await this.serializeField(data, field);
                }
                return true;
            });
            await Promise.all(promises);
            return [r, r2];
        } else {
            return r;
        }
    }

    async serializeField(data: any, field: string): Promise<any> {
        if (field in data) {
            if (isDate(data[field])) {
                return formatDateKYC(data[field]);
            }
            return data[field];
        }
        return null;
    }

    async serializeObject(r: any, data: any, pfield: string): Promise<any> {
        r[pfield] = {};
        const promises = Object.keys(data).map(async (field) => {
            if (this.ex_fields.indexOf(field) < 0) {
                r[pfield][field] = await this.serializeField(data, field);
            }
            return true;
        });
        await Promise.all(promises);
        return r;
    }
}
