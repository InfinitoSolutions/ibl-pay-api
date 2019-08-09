import * as Errors from './errors';

export interface ISerializer {
    serialize(data: any, many: boolean): Promise<any>;
}


export interface IListSerializer {
    serialize(data: any): Promise<any>;
}


export class JsonSerializer implements ISerializer {
    context: any;
    fields: string[];
    listSerializer: IListSerializer;

    [name: string]: any;
    constructor(context: any = null) {
        this.context = context;
        this.fields = [];
        this.listSerializer = new JsonListSerializer(this);
    }

    setContext(context: any) {
        this.context = context;
        return this;
    }

    async serialize(data: any, many: boolean = false) {
        if (many) {
            return await this.serializeList(data);
        }

        return await this._serialize(data);
    }

    async _serialize(data: any): Promise<any> {
        let r: any = {};
        const promises = this.fields.map(async (field) => {
            r[field] = await this.serializeField(data, field);
            return r[field];
        });
        await Promise.all(promises);
        return r;
    }

    async serializeField(data: any, field: string): Promise<any> {
        if (typeof this[field] === 'function') {
            return await this[field](data);
        }
        return (field in data) ? data[field] : null;
    }

    async serializeList(data: any): Promise<any> {
        return this.listSerializer.serialize(data);
    }
}

export class JsonListSerializer {
    constructor(private serializer: JsonSerializer) {
    }

    async serialize(data: any) {
        if (Array.isArray(data)) {
            return await Promise.all(data.map(d => this.serializer.serialize(d)));
        }
        if (data.count === 0 || !Array.isArray(data.results) || data.results.length === 0) {
            const { page, limit, count, results } = data;
            return { page, limit, count, results: null };
        }
        if (!data.count || !data.results || !Array.isArray(data.results)) {
            return Promise.reject(new Errors.InvalidDataSourceError());
        }
        return await this.serializePagination(data);
    }

    async serializePagination(data: any) {
        const { page, limit, count, results } = data;
        const items = await Promise.all(results.map((d: any) => this.serializer.serialize(d)));
        return { page, limit, count, results: items };
    }
}

export class CaptchaSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['captcha_id', 'captcha_svg'];
    }
}
