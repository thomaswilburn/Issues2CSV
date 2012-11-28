(function() {

    var args = process.argv.slice(2);
    var http = require('https');
    var url = require('url');

    if (args.length < 2) {
        process.stdout.write("Missing required arguments.\n")
        process.stdout.write("Usage: node Issue2CSV.js <username> <repository>\n");
        process.exit();
    }

    var user = args[0];
    var repo = args[1];
    var baseURL = "/repos/" + user + "/" + repo + "/issues";
    var token;

    var issues = { open: null, closed: null };

    var req = http.request({
        hostname: "api.github.com",
        path: "/authorizations",
        method: "POST",
        auth: "user:password", //this is unfortunate, but required due to rate limiting
        headers: {
            "Content-Length": 2
        }
    }, function(response) {
        response.on('data', function(data) {
            token = "token " + JSON.parse(data).token;
            for (var state in issues) {
                //console.log('fetching ' + state);
                (function(state) {
                    var req = http.request({
                        hostname: "api.github.com",
                        path: baseURL + "?state=" + state,
                        headers: {
                            AUTHORIZATION: token
                        }
                    }, function(response) {
                        response.on('data', function(data) {
                            issues[state] = JSON.parse(data);
                            if (issues.open && issues.closed) getEvents();
                        })
                    });
                    req.end();
                })(state);
            }

        });
        response.on('error', console.log.bind(console));
    });
    req.write("{}");
    req.end();

    var getEvents = function() {
        var openCount = 0, closedCount = 0;
        var attachEvents = function(item, index, array) {
            var options = url.parse(item.events_url);
            options.headers = {
                AUTHORIZATION: token
            };
            //console.log('getting events for ' + item.events_url);
            http.get(options, function(response) {
                response.on('data', function(data) {
                    //console.log(JSON.parse(data));
                    data = JSON.parse(data);
                    item.events = data;
                    if (array === issues.open) {
                        openCount++;
                    } else {
                        closedCount++;
                    }
                    if (openCount == issues.open.length && closedCount == issues.closed.length) {
                        exportCSV();
                    }
                });
            });
        };
        if (issues.open) issues.open.forEach(attachEvents);
        if (issues.closed) issues.closed.forEach(attachEvents);
    };

    var exportCSV = function() {
        var output = "";
        for (var state in issues) {
            var list = issues[state];
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                var rows = [[
                    item.number,/*
                    item.state,
                    item.created_at,
                    item.closed_at,*/
                    item.title,
                    item.body,
                    item.labels.map(function(item) { return item.name }).join('/'),
                    item.html_url
                ]];
                for (var j = 0; j < item.events.length; j++) {
                    var event = item.events[j];
                    var eventRow = ["",
                        event.event,
                        event.created_at,
                        event.actor.login
                    ];
                    rows.push(eventRow);
                }
                for (var j = 0; j < rows.length; j++) {
                    rows[j] = rows[j].map(function(item) {
                        return typeof item == "string" ? JSON.stringify(item).replace(/\\"/g, '""') : item;
                    }).join(",");
                }
                output += "\n" + rows.join("\n");
            }
        }
        console.log(output);
    };

})();