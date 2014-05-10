"use strict";
/* jshint -W115 */
//  Using Twitter API Client for node -- https://github.com/ttezel/twit

//  Twitter toolkit
//  Credits: @JvdMeulen && @j3lte

var Twit          = require('twit'),
    config        = require('./config.js'),
    colors        = require('colors'),
    _             = require('underscore'),
    fs            = require('fs'),
    T             = new Twit(config),
    command       = process.argv[2],
    args          = process.argv.splice(3),
    woeid         = 1,
    DST           = 1,
    aantal        = 20,
    expanded      = false,
    date          = new Date(),
    timestamp     = date.valueOf(),
    filename      = 'output\\' + command + '-' + timestamp + '.txt',
    writeFile     = null,
    argLine       = args.join(' '),
    toWrite       = true,
    stdin         = process.stdin;

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

var setupWriting = function () {
    if (toWrite) {
        if (!fs.existsSync("output")) {
            fs.mkdirSync("output", 502, function (err) {
                if (err) {
                    console.log(new Error(err));
                }
            });
        }
        writeFile = fs.createWriteStream(filename);
    }
};

var output = function (msg, notToFile) {
    var cleanMsg;
    if (msg) {
        if (toWrite && writeFile && !notToFile) {
            // remove any color codes from the text;
            cleanMsg = msg.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/ig, '');
            writeFile.write(cleanMsg + '\r\n');
        }
        console.log(msg);
    } else {
        if (toWrite && writeFile && !notToFile) {
            writeFile.write('\r\n');
        }
        console.log();
    }
};

var graceFullExit = function (msg) {
    if (msg) {
        console.log("Gracefull exit");
    }
    if (writeFile) {
        toWrite = false;
        writeFile.end();
    }
    // set timeout for gracefull exit and closing file
    setTimeout(function () {
        process.exit();
    }, 1000);
};

// on any data into stdin
stdin.on('data', function (key) {
    // ctrl-c ( end of text )
    if (key === '\u0003') {
        graceFullExit(true);
    }
    // write the key to stdout all normal like
    process.stdout.write(key);
});


//
// Prototype Date
//
Date.prototype.addHours = function (h) {
    var copiedDate = new Date(this.getTime());
    copiedDate.setHours(copiedDate.getHours() + h);
    return copiedDate;
};

//
// Display
//

var view_entity = function (body, entity, property, prepend) {
    var fillString = "                                                 ",
        fill = "";

    if (body.entities[entity] !== undefined && body.entities[entity].length > 0) {
        _.each(body.entities[entity], function (i) {
            fill += prepend + body.entities[entity][i][property] + ", ";
        });
        fill = fill.slice(0, -2);
    }

    output(fillString + (" " + entity + ": ").green + fill.yellow);
};

var colorWord = function (nr, word) {
    if (nr === 1) {
        return word.green;
    }
    if (nr === 2) {
        return word.magenta;
    }
    if (nr === 3) {
        return word.white;
    }
    if (nr === 4) {
        return word.grey;
    }
    return word.yellow;
};

var view_message = function (body) {
    var msg     = body.text,
        newMsg  = "",
        time    = new Date(body.date).addHours(DST).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        x       = 0,
        split,
        i,
        r;

    body.user = String("                   " + body.user).slice(-20);

    _.each(args, function (word) {
        r = new RegExp('(' + word.replace(/[A-z]+:(.*)/, '$1').split(' ').join('|') + ')', 'ig');
        newMsg = "";
        split = msg.split(r);
        for (i = 0; i < split.length; i++) {
            if (r.test(split[i])) {
                newMsg += colorWord(x, split[i]).underline;
            } else {
                newMsg += split[i].cyan;
            }
        }
        x += 1;
        msg = newMsg;
    });

    output([time.yellow, body.lang.cyan, body.user.green, ['--', 'RP', 'RT'][body.is].red, msg, body.location.yellow, body.source.green].join(' | '.white));

    if (expanded) {
        view_entity(body, "hashtags", "text", "#");
        view_entity(body, "urls", "expanded_url", "");
        view_entity(body, "user_mentions", "screen_name", "@");
        view_entity(body, "media", "media_url", "");
        output();
    }
};

var processTweet = function (tweet) {
    var type = (tweet.retweeted_status) ? 2 : 0,
        source = 'web - (http://twitter.com)',
        matches = [];

    // WHAT TYPE IS IT?
    if (!type) {
        type = (tweet.in_reply_to_user_id || tweet.in_reply_to_status_id) ? 1 : 0;
    }

    // FROM WHAT SOURCE?
    if (tweet.source !== 'web') {
        tweet.source = tweet.source.replace(' rel="nofollow"', '');
        tweet.source.replace(/[^<]*(<a href="([^"]+)">([^<]+)<\/a>)/g, function () {
            matches.push(Array.prototype.slice.call(arguments, 1, 4));
        });
        source = matches[0][2];
    }

    view_message({
        date:       tweet.created_at,
        text:       tweet.text.replace(/(\r\n|\n|\r)/gm, "~ "),
        lang:       tweet.user.lang,
        user:       tweet.user.screen_name,
        is:         type,
        location :  tweet.user.location,
        source :    source,
        entities :  tweet.entities
    });
};

var show_error = function (err) {
    var errors = JSON.parse(err);
    output(errors.allErrors[0].message, true);
};

//
// RECURSIVE FUNCTION TO DUMP TWEETS FROM USER (UP UNTIL 3200 TWEETS)
//
var dump_recursive = function (scr_name, nr, max) {
    if (nr >= 3200) {
        return false;
    }

    var latest = null,
        dumpedSoFar = nr,
        options = {
            "screen_name" : scr_name,
            "count" : 200,
            "max_id" : max
        },
        i;

    T.get('statuses/user_timeline', options, function (err, reply) {
        if (err && err.statusCode) {
            show_error(err);
            return false;
        }

        if (reply) {
            dumpedSoFar += reply.length;
            for (i = 0; i < reply.length; i++) {
                latest = reply[i].id;
                processTweet(reply[i]);
            }
            if (reply.length >= 2) {
                dump_recursive(scr_name, dumpedSoFar, latest);
            } else {
                output("Number of tweets dumped: " + dumpedSoFar, true);
                graceFullExit();
            }
        } else {
            output("empty reply: ", true);
            output(reply, true);
            graceFullExit();
        }
    });
};

//
// Main functions
//
var search = function () {
    var del = ' OR ',
        options,
        i;

    if (args[0] === '--expanded') {
        expanded = true;
        args = args.splice(1);
    }

    if (/^\d+$/.test(args[0])) {
        aantal = args[0].valueOf();
        if (aantal > 100) {
            console.log('Max tweets to search = 100');
            aantal = 100;
        }
        args = args.splice(1);
    }

    if (args[0] === 'AND') {
        del = ' ';
        args = args.splice(1);
    }

    options = {
        "q": args.join(del),
        "count": aantal,
        "include_entities": true
    };

    T.get('search/tweets', options, function (err, reply) {

        if (err && err.data) {
            show_error(err);
            return false;
        }

        for (i = 0; i < reply.statuses.length; i++) {
            processTweet(reply.statuses[i]);
        }

        graceFullExit();

    });
};

var stream = function () {
    if (args[0] === '--expanded') {
        expanded = true;
        args = args.splice(1);
    }

    var stream1 = T.stream('statuses/filter', {track: args});

    stream1
        .on('tweet', function (tweet) {
            processTweet(tweet);
        })
        .on('limit', function (limitMessage) {
            output(limitMessage, true);
        })
        .on('delete', function (deleteMessage) {
            output(deleteMessage, true);
        })
        .on('disconnect', function (disconnectMessage) {
            output(disconnectMessage, true);
            graceFullExit();
        });
};

var lookup = function (name) {
    var scr_name = name.replace('@', '');
    T.get('users/lookup', {screen_name : scr_name}, function (err, reply) {
        if (err && err.data) {
            show_error(err);
            return false;
        }
        output(reply[0], true);
        graceFullExit();
    });
};

var trends = function (id) {
    var woeid = (id === '2') ? 23424909 : 1,
        i;

    T.get('trends/place', {id : woeid}, function (err, reply) {

        if (err) {
            output(err, true);
            return false;
        }

        output('trends for: ' + reply[0].locations[0].name + '\r\n');

        for (i = 0; i < reply[0].trends.length; i++) {
            output('--> ' + reply[0].trends[i].name);
        }

        graceFullExit();

    });
};

var dump = function () {
    if (args[0] === '--expanded') {
        expanded = false;
        args = args.splice(1);
    }

    var name = args[0],
        scr_name = name.replace('@', '');

    dump_recursive(scr_name, 0, 999999999999999999);
};

var check_arguments = function (text, callback) {
    if (args.length < 1) {
        output(text, true);
        process.exit(1);
    } else {
        setupWriting();
        output('****************** [ Twitter tracker ] *********************');
        output('* Timestamp: ' + timestamp);
        output('* Command: ' + command + ' | arguments: ' + argLine);
        output('************************************************************');
        output();
        if (typeof callback === 'function') {
            callback();
        }
    }
};

switch (command) {
case "stream":
    check_arguments('Enter one or more keywords to filter the stream', stream());
    break;
case "search":
    check_arguments('Enter one or more keywords to search for', search());
    break;
case "lookup":
    check_arguments('Enter a screenname to lookup', lookup(args[0]));
    break;
case "trends":
    check_arguments('Enter a region, 1 is worldwide, 2 is Netherlands', trends(args[0]));
    break;
case "dump":
    check_arguments('Enter a screenname to dump', dump());
    break;
default:
    console.log('Usage: node app.js <command> <arguments>');
    console.log('<command> = search / stream / lookup / trends / dump');
    console.log('<arguments> = additional keywords/arguments');
    process.exit(1);
}