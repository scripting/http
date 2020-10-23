### The basics of an HTTP server

This code was showing up all over the place. Handle an HTTP request with logging. A few other amenities. Rather than do a crappy job over and over, I decided to do a good job once,  then <a href="https://www.npmjs.com/package/davehttp">reuse</a> the result. There's still more work to do, but it's useful right now as-is.

Dave Winer

### Updates

#### 10/23/20 by DW

Added a call to <a href="https://nodejs.org/api/console.html#console_console_trace_message_args">console.trace</a> when there's an error in handling an HTTP request. Without it, it's hard to tell where the errant code was. 

