export default interface ValidatorInterface {
    validate(data: any): Promise<boolean> | Error;
}
