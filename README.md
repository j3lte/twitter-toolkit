twitter-toolkit
===============

I created this toolkit as one of my first NodeJS projects. Beware that some of my code can be inefficient. In a different version I will clean this up, for now I just wanted to share what I had build then (somewhere at the end of 2012, if I am correct).

With that idea in place, I also got some help from [JvdMeulen](https://twitter.com/JvdMeulen), because he was way better in writing regular expressions than I was.

It is a simple app that does a couple of things. You can dump all tweets into an automatically generated file. On the commandline you will see it in different colors.

##Features

  * Search : search
    
    `node app.js search <search parameters>`
    
  * Stream : realtime results
    
    `node app.js stream <search parameters>`
    
  * Lookup : lookup information on a user
    
    `node app.js lookup <screenname>`
    
  * Dump : dump max 2400 (Twitter limit) tweets from a user
    
    `node app.js dump <screenname>`
    
  * Trends : trending topics, 1 = worldwide, 2 = Netherlands
    
    `node app.js trends <id>`

##Install

Just checkout the git repository and install the dependencies

```
npm install
```

Copy the example-config.js to config.js and fill in the specified details, e.g. API-key and all.

And run the app

```
node app.js <command> <arguments>
```

##Development

```
grunt
```

All files (*.js) are checked with jslint and jshint