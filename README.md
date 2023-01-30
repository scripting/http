### The basics of an HTTP server

This code was showing up all over the place. Handle an HTTP request with logging. A few other amenities. Rather than do a crappy job over and over, I decided to do a good job once,  then <a href="https://www.npmjs.com/package/davehttp">reuse</a> the result. There's still more work to do, but it's useful right now as-is.

Dave Winer

### Updates

#### 1/30/23 by DW -- v0.5.0

Changed urlDefaultFavicon so it isn't http-specific. We want to run this behind an HTTPS server. 

A lot of missing notes. I promise to do better. ;-)

#### 10/23/20 by DW

Added a call to <a href="https://nodejs.org/api/console.html#console_console_trace_message_args">console.trace</a> when there's an error in handling an HTTP request. Without it, it's hard to tell where the errant code was. 

#### 1/3/18 by DW

Added support for POST messages. We store the post body in theRequest.postBody. Now the app doesn't have to do this for itself.

### source.opml

This file which appears in all my recent repositories contains the outline I use to work on this package. 

You can read this code in the outline format, by <a href="http://gitsourcereader.opml.org/?repo=http">clicking this link</a>.

