import { JsonSerializer } from '@serializer/serializer';

export class CurrencySerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['currency', 'usd'];
    }
}
