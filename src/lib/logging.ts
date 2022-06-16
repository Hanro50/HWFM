export type action = "STARTING" | "INFO" | "SERVING" | "ERROR"
export type fileTypes = "DIR" | "FILE" | "HASHES"

export function log(action: action, object: any, ...optionalParams: any[]) {
    (action == "ERROR" ? console.error : console.log)(`[${process.pid}] [${new Date().toISOString()}] ${action.padEnd(8)} - ${object.padEnd(8)}:`, ...optionalParams);
}
export function strt(object: any, ...optionalParams: any[]) {
    log('STARTING', object, ...optionalParams)
}

export function info(object: any, ...optionalParams: any[]) {
    log('INFO', object, ...optionalParams)
}

export function serv(object: fileTypes, ...optionalParams: any[]) {
    log('SERVING', object, ...optionalParams)
}

export function excp(object: any, ...optionalParams: any[]) {
    log('ERROR', object, ...optionalParams)
}
