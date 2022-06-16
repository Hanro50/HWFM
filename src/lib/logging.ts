export function log(message: any, ...optionalParams: any[]) {
    console.log(`[${process.pid}] [${new Date().toISOString()}]`, message, ...optionalParams);
}
