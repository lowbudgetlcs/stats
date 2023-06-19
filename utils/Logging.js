const { Logging } = require('@google-cloud/logging');

class Logger {
    constructor(projectId, logName){
        const logging = new Logging(projectId, logName);
        this.log = logging.log(logName);
    }

    log(payload, severity){
        this.log.entry(metaData, text);
    }
}

export { Logger };