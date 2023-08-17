# Usage

1. `npm i`
2. `npm run start:routing`
3. `npm run start:simple-1` in a new terminal
4. `npm run start:simple-2` in a new terminal
5. `npm run start:simple-3` in a new terminal
6. Make a request to Routing API, (http://localhost:3000/) with any request
    - You can specify behavior of request by adding "path" field, you can look at `simple/app.js` for the allowed paths.

## Sample JSON
- Happy Path
```json
{
    "game": "Mobile Legends",
    "gamerID": "GYUTDTE",
    "points": 20
}
```
- Request Error
```json
{
    "game": "Mobile Legends",
    "gamerID": "GYUTDTE",
    "points": 20,
    "path": "error"
}
```

### Paths
You can also change the field `"path"` to specific values to get specific behaviors from Simple API. This just appends the value of `path` to the URL of the instance API we're calling. So, the descriptions below target the Simple API's behavior.
- `"hang-15"` - waits for 15 seconds before responding back. Can still accept other requests. Also has `"hang-3"` and `"hang-forever"`
- `"error"` - this returns a `400` bad request, a way to test if our Routing API can tell between if it's a request error, meaning it's the user's fault, or it's a server error, our fault. There's another endpoint `"weird"`, just there to test out non-5XX errors
- `"internal-server-error"` - returns a `500` server error, our Routing API should signal to our user that it's our fault. Another similar endpoint is `"service-unavailable"`
- `"flip"` - 50-50 chance to return either `200` or `500`
- `"deadlock"` - forces the instance to be in a *permanently* stuck state, prevents from accepting other requests
    - In reality, just affects the `/` and `/liveness` path of Simple API
---
# Requirements
## Required
1. Simple post API - Done!
2. Base Routing API - Done!
3. Route to a working instance if `5xx` error - Done!
4. Handles when a simple API instance goes down - Done!
5. Handles slow instances - Done!

## Things to Consider (based on guide questions)
- Criteria to mark an instance as down
    - Timeout of 30/60 seconds or any `5XX` error
- Routing API to also have a circuit breaker mechanism so it doesn't overload the slow instances
    - 3 consecutive requests that are either timeout or `5xx` error will make it switch to open state
    - Open -> Half-Open after 3-5 minutes, half-open sends request every minute, will follow 3-strike rule above
- Set timeout on Routing API so it can send the request to the next instance
    - Handle this so that it will just discard the eventual response from the slow server

## Features
- Passess off end user's request amongst simple API instances, just acts like a passthrough for responses that are not server errors, i.e. not `5XX` error codes.
- If `5XX` error code, exhausts the list of instances until a non `5XX` response. It will return `503 Service Unavailable` if this happens.
- You can set `timeout` in `routing/app.js` for how long will the Routing API wait for its request to the Simple API instances before it moves on the next.
- We implement a circuit breaker design pattern to mark Simple API instances whether they're working completely, slow, or completely out.
- Routing API server sends a `/restart` signal to a Simple API instance it deems to be in an irrecoverable state
- For circuit breaker: when we deem a server to be down based on `openThreshold`, we wait for `openStateRestTime` then we start pinging the instance to check its health every `halfOpenStateInterval` for x times, where x is `removeThreshold`. If the health check says instance is healthy, we deem the server to be working and we'll send requests as normal. However if it's dead for `removeThreshold` times consecutively, we'll mark server as irrecoverable, remove it from our list of instances and send a `restart` signal.
- When our Simple API instances start, they send a `POST /servers` request to our Routing API so that it knows of its existence.

---
# History / Appendix

## Thoughts

This coding task is focused on load balancing and availability patterns. This is evident because the task is mainly about the routing API and just a simple API, without the need for databases. That's good for me because I can focus on that. With the following guide questions, it also leads me to think more about availability patterns and maybe the use of circuit breakers. Aside from that I'd like to add a few endpoints so I can test and simulate scenarios within the project.

- How would my round robin API handle it if one of the application APIs goes down? A way to determine that it's actually down and when it goes back up or better yet, a way for the routing API server that another simple API instance should be spinned up. If aside from being just load balancer, we want it to function like Kubernetes, we add self-healing so it's more resilient.
- How would my round robin API handle it if one of the application APIs starts to go
slowly? Set timeout and move on to the next instance.
- How would I test this application? Points to the use of additional API's to simulate scenarios.

I think I'm just adding things that are related to load balancing and, especially, availability patterns. I've not actually spent time thinking about them, and I'm hoping to discuss the nuances of different approaches with you.

I set timeout for 5 seconds, if all instances are slow then, that's 15 seconds.

### On being blocked by an intentionally hanging process.
Tested out if I'm going to be blocked by a pending request using this code but it doesn't block me so we're good! This is just to determine whether I have to do things just so I can test my timeouts. Basically, express is non-blocking and can handle multiple requests. This also means that I have to set something in my *Simple API* just so I can tell them to act slow in all requests.
```javascript
app.post('/hang-forever', (_, res) => {
  console.log('visited hang-forever route')
  // This hangs because waiting for .json
  res.status(200)
})
```

## Scratch TODO
Just finished with re-routing to a working instance and server discovery. Things to work on next:

1. Timeout - Done!
2. Research more! - Done!
3. Circuit breaker - Done!
4. Share code by Wednesday night so they have time to read it. - Done!
5. Handle scenario `GET /liveness` also results from an error or timeout - Done!
    - Think when to delete server from `serverInfo` and send a restart signal to the instance
6. Increase resiliency
    - What if you can't even send a restart signal? Create an orchestration server that should spin up another instance and use Routing API `POST /server-discovery`.
7. Parametrize things! - Done!

One implementation is server discovery + self-healing from simple API. But for now, I'll let Routing API send a signal to the instances to restart if they're permanently stuck.

## Bonus
- Way to control behavior - Done!
    - Just used different endpoints in Simple API and added `endpoint` in request body to Routing API
- Create another service to start and terminate Simple API instances, let's call it *Orchestration Server*
- Allows Routing API to set a target number of instances so it sends a message to *Orchestration Server* whether to start or terminate instances.
- Routing API to have an endpoint to manage URL's on run time: service discovery (and decommission)