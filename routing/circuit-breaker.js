const State = {
    OPEN: 'open', // Off
    CLOSED: 'closed', // Working
    HALF_OPEN: 'half-open' // Don't send actual requests, but can check for liveness
};

function SetToOpen(server) {
    console.log(`${server.url} is down!`)
    server.state = State.OPEN;
    setTimeout(() => {
        console.log(`${server.url}: see if this is blocking`)
    }, 3000);
    console.log(`${server.url}: timeout started`)
  }

module.exports = {
State, SetToOpen
};