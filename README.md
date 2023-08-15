# Thoughts

This coding task is focused on load balancing and availability patterns. This is evident because the task is mainly about the routing API and just a simple API, without the need for databases. That's good for me because I can focus on that. With the following guide questions, it also leads me to think more about availability patterns and maybe the use of circuit breakers. Aside from that I'd like to add a few endpoints so I can test and simulate scenarios within the project.

- How would my round robin API handle it if one of the application APIs goes down? A way to determine that it's actually down and when it goes back up or better yet, a way for the routing API server that another simple API instance should be spinned up.
- How would my round robin API handle it if one of the application APIs starts to go
slowly? Set timeout and move on to the next instance.
- How would I test this application? Points to the use of additional API's to simulate scenarios.

## On being blocked by an intentionally hanging process.
Tested out if I'm going to be blocked by a pending request using this code but it doesn't block me so we're good! This is just to determine whether I have to do things just so I can test my timeouts. Basically, express is non-blocking and can handle multiple requests. This also means that I have to set something in my *Simple API* just so I can tell them to act slow in all requests.
```javascript
app.post('/internal-server-error', (_, res) => {
  console.log('visited internal-server-error route')
  // This hangs because waiting for .json
  res.status(503)
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
- Routing API to have an endpoint to manage URL's on run time.