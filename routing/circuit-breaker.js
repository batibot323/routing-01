const axios = require('axios')

const State = {
    OPEN: 'open', // Off
    CLOSED: 'closed', // Working
    HALF_OPEN: 'half-open' // Don't send actual requests, but can check for liveness
};

function SetToOpen(server) {
    console.log(`${server.url} is down!`)
    server.state = State.OPEN;
    setTimeout(() => {
        testLiveness(server);
    }, 60000);
    console.log(`${server.url}: timeout started`)
}

function testLiveness(server) {
    server.state = State.HALF_OPEN;
    console.log(`${server.url}: testing liveness`)
    axios.get(`${server.url}liveness`)
        .then(() => {
            console.log(`${server.url}: is alive`)
            server.state = State.CLOSED;
            server.strikes = 0;
        })
        .catch((err) => {
            console.log(err);
            console.log(`${server.url}: is dead`)
            server.strikes++;
            // if (server.strikes >= openThreshold) {
            //     SetToOpen(server);
            // }
        })
}

module.exports = {
State, SetToOpen
};