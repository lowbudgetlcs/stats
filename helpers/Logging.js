const { Logging } = require('@google-cloud/logging');
class Logger {
    constructor(projectID, logName) {
        // Creates a client
        const logging = new Logging({ projectID });
        // Selects the log to write to
        this.log = logging.log(logName);
    }

    write(metadata, message, webRequest = false) {
        const metaData = {
            "resource": {
                type: 'cloud_function',
                labels: {
                    function_name: 'captureMatchDTO'
                }
            },
            "severity": metadata.severity,
        }
        if (webRequest === true) {
            metaData.httprequest = {
                status: metadata.status
            }
        }
        const entry = this.log.entry(metaData, message);
        this.log.write(entry)
    }
}
module.exports = { Logger };