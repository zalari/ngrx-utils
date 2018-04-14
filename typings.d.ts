declare module "*package.json" {
    const name: string | undefined;
    const version: string | undefined;
    const description: string | undefined;
    const author: string | object | undefined;
}

declare module "*.json" {
    const value: any;
    export default value;
}
