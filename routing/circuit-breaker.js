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
        axios.get(`${server.url}liveness`, { timeout: this.timeout })
            .then(() => {
                console.log(`${server.url}: is alive`)
                server.state = STATE.CLOSED;
                server.strikes = 0;
            })
            .catch((err) => {
                console.log(err);
                console.log(`${server.url}: is dead`)
                server.strikes++;
                console.log(`${server.url} is ${server.state} and has ${server.strikes} strikes`)
                if (server.strikes >= this.removeThreshold) {
                    try {
                        console.log(`removing ${server.url}`)
                        this.#removeServer(server);
                    } catch (err) {
                        console.log(err);
                    }
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
        axios.post(`${server.url}restart`)
        .catch((error) => {
            console.log(`Error: ${error.message}`);
        });
    }
}

module.exports = {
STATE, CircuitBeaker
};