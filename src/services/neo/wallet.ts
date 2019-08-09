export default class NeoWallet {
    privateKey?: string;
    publicKey?: string;
    address?: string;
    wif?: string;
    currency: string = 'BTC';

    constructor() { }

    static decode(encoded: any) {
        let w = new NeoWallet();
        if (encoded) {
            Object.assign(w, encoded);
        }
        return w;
    }
}
