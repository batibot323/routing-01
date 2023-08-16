# Usage

1. `npm i`
2. `npm run start:routing`
3. `npm run start:simple-1` in a new terminal
4. `npm run start:simple-2` in a new terminal
5. `npm run start:simple-3` in a new terminal
6. Make a request to Routing API, (http://localhost:3000/) with any request
    - You can specify behavior of request by adding "path" field, you can look at `simple/app.js` for the allowed paths.

```json
{
    "game": "Mobile Legends",
    "gamerID": "GYUTDTE",
    "points": 20,
    "path": "error"
}
```
# Thoughts

This coding task is focused on load balancing and availability patterns. This is evident because the task is mainly about the routing API and just a simple API, without the need for databases. That's good for me because I can focus on that. With the following guide questions, it also leads me to think more about availability patterns and maybe the use of circuit breakers. Aside from that I'd like to add a few endpoints so I can test and simulate scenarios within the project.

- How would my round robin API handle it if one of the application APIs goes down? A way to determine that it's actually down and when it goes back up or better yet, a way for the routing API server that another simple API instance should be spinned up. If aside from being just load balancer, we want it to function like Kubernetes, we add self-healing so it's more resilient.
- How would my round robin API handle it if one of the application APIs starts to go
slowly? Set timeout and move on to the next instance.
- How would I test this application? Points to the use of additional API's to simulate scenarios.

I think I'm just adding things that are related to load balancing and, especially, availability patterns. I've not actually spent time thinking about them, and I'm hoping to discuss the nuances of different approaches with you.

I set timeout for 5 seconds, if all instances are slow then, that's 15 seconds. If we aim to increase

## On being blocked by an intentionally hanging process.
Tested out if I'm going to be blocked by a pending request using this code but it doesn't block me so we're good! This is just to determine whether I have to do things just so I can test my timeouts. Basically, express is non-blocking and can handle multiple requests. This also means that I have to set something in my *Simple API* just so I can tell them to act slow in all requests.
```javascript
app.post('/hang-forever', (_, res) => {
  console.log('visited hang-forever route')
  // This hangs because waiting for .json
  res.status(200)
})
```

# Requirements
## Required
1. Simple post API - Done!
2. Base Routing API - Done!
3. Route to a working instance if `5xx` error

## Things to Consider (based on guide questions)
- Criteria to mark an instance as down
    - Timeout of 30/60 seconds or any `5XX` error
- Routing API to also have a circuit breaker mechanism so it doesn't overload the slow instances
    - 3 consecutive requests that are either timeout or `5xx` error will make it switch to open state
    - Open -> Half-Open after 3-5 minutes, half-open sends request every minute, will follow 3-strike rule above
- Set timeout on Routing API so it can send the request to the next instance
    - Handle this so that it will just discard the eventual response from the slow server

## Bonus
- Way to control behavior - Done!
    - Just used different endpoints in Simple API and added `endpoint` in request body to Routing API
- Create another service to start and terminate Simple API instances, let's call it *Orchestration Server*
- Allows Routing API to set a target number of instances so it sends a message to *Orchestration Server* whether to start or terminate instances.
- Routing API to have an endpoint to manage URL's on run time: service discovery (and decommission)

## Scratch TODO
Just finished with re-routing to a working instance and server discovery. Things to work on next:

1. Timeout
2. Research more!
3. Circuit breaker
4. Share code by Wednesday night so they have time to read it.