const axios = require('axios')

const STATE = {
    OPEN: 'open', // Off
    CLOSED: 'closed', // Working
    HALF_OPEN: 'half-open' // Don't send actual requests, but can check for liveness
};


const removeThreshold = 3;

class New {
    constructor(serverInfo) {
        this.serverInfo = serverInfo;
    }
}

function SetToOpen(server) {
    console.log(`${server.url} is down!`);
    server.state = STATE.OPEN;
    setTimeout(() => {
        testLiveness(server);
    }, 60000);
    console.log(`${server.url}: timeout started`);
}

function handleHalfOpen(server) {
    server.state = STATE.HALF_OPEN;
    console.log(`${server.url}: testing liveness`)
    axios.get(`${server.url}liveness`)
        .then(() => {
            console.log(`${server.url}: is alive`)
            server.state = STATE.CLOSED;
            server.strikes = 0;
        })
        .catch((err) => {
            console.log(err);
            console.log(`${server.url}: is dead`)
            server.strikes++;
            if (server.strikes >= removeThreshold) {
                let indexOf = this.serverInfo.indexOf(server);
                this.serverInfo.splice(indexOf, 1);
            } else {
                setTimeout(() => {
                    handleHalfOpen(server);
                }, 5000);
            }
        })
}

module.exports = {
STATE, setToOpen, New
};