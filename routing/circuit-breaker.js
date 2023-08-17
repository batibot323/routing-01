const axios = require('axios')

const STATE = {
    OPEN: 'open', // Off
    CLOSED: 'closed', // Working
    HALF_OPEN: 'half-open' // Don't send actual requests, but can check for liveness
};

const defaultRemoveThreshold = 3;
const defaultOpenStateRestTime = 60000;
const defaultHalfOpenStateInterval = 60000;
const defaultTimeout = 10000;

class CircuitBeaker {
    constructor(serverInfo, config) {
        this.serverInfo = serverInfo;
        this.removeThreshold = config.removeThreshold || defaultRemoveThreshold;
        this.openStateRestTime = config.openStateRestTime || defaultOpenStateRestTime;
        this.halfOpenStateInterval = config.halfOpenStateInterval || defaultHalfOpenStateInterval;
        this.timeout = config.timeout || defaultTimeout;
      }
    
    setToOpen(server) {
        console.log(`${server.url} is down!`);
        server.strikes = 0;
        server.state = STATE.OPEN;
        setTimeout(() => {
            this.#handleHalfOpen(server);
        }, this.openStateRestTime);
        console.log(`${server.url}: timeout started`);
    }

    // This is a private method, so it's prefixed with a #
    #handleHalfOpen(server) {
        server.state = STATE.HALF_OPEN;
        console.log(`${server.url}: testing liveness`)
        // TODO: Figure out how to handle this error, says uncaught AxiosError.
        axios.get(`${server.url}liveness`, { timeout: 3000 })
            .then(() => {
                console.log(`${server.url}: is alive`)
                server.state = STATE.CLOSED;
                server.strikes = 0;
            })
            .catch((err) => {
                console.log(err);
                console.log(`${server.url}: is dead`)
                server.strikes++;
                if (server.strikes >= this.removeThreshold) {
                    this.#removeServer(server);
                } else {
                    setTimeout(() => {
                        this.#handleHalfOpen(server);
                    }, this.halfOpenStateInterval);
                }
            })
    }

    #removeServer(server) {
        let indexOf = this.serverInfo.indexOf(server);
        this.serverInfo.splice(indexOf, 1);
        try {
            axios.post(`${server.url}/restart`)
        } catch (err) {
            console.log(`Failed to restart ${server.url}`)
        }
    }
}

module.exports = {
STATE, CircuitBeaker
};