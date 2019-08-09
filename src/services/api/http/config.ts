export class ApiConfiguration {
    public static BASE_URL: any = process.env.KYC_BASE_URL;
    public static SESSION: any =  process.env.KYC_API_KEY;
    public static KYC_BUYER_ID: any = process.env.KYC_BUYER_ID;
    public static KYC_MERCHANT_ID: any = process.env.KYC_MERCHANT_ID;
    public static FORM_BUYER_BASIC: any = process.env.KYC_FORM_BUYER_BASIC;
    public static FORM_BUYER_ENGAGED: any = process.env.KYC_FORM_BUYER_ENGAGED;
    public static FORM_MERCHANT_BASIC: any = process.env.KYC_FORM_MERCHANT_BASIC;
    public static FORM_MERCHANT_ENGAGED: any = process.env.KYC_FORM_MERCHANT_ENGAGED;
}
