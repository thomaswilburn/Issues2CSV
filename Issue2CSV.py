import json, base64, sys, csv, os
import http.client

def parseResponse(connection):
    response = connection.getresponse()
    if response.getheader('X-RateLimit-Remaining') == "0":
        print(connection)
        print(response.getheader('X-RateLimit-Limit'))
        quit()
    return json.loads(response.read().decode('utf-8'))

ghAuth = b"user:password"

server = http.client.HTTPSConnection("api.github.com")

authHeader = {"Authorization": b"Basic " + base64.b64encode(ghAuth)}

server.request("POST", "/authorizations", "{}", authHeader)
token = parseResponse(server)['token']

authHeader = {"Authorization": "Token " + token}

issueURI = "/repos/" + sys.argv[1] + "/" + sys.argv[2] + "/issues"

server.request("GET", issueURI, headers=authHeader)
issues = parseResponse(server)

server.request("GET", issueURI + "?state=closed", headers=authHeader);
issues = issues + parseResponse(server)

f = open('output.csv', 'w')
writer = csv.writer(f, lineterminator='\n')

for i in issues:
    server.request("GET", issueURI + "/" + str(i['number']) + "/events", headers=authHeader)
    events = parseResponse(server)

    server.request("GET", issueURI + "/" + str(i['number']) + "/comments", headers=authHeader)
    events += parseResponse(server)

    i['events'] = sorted(events, key=lambda k: k['created_at'])

    #actually output to CSV now
    labels = []
    for l in i['labels']:
        labels += [ l['name'] ]
    writer.writerow([ i['state'], "created", i['created_at'], i['user']['login'], i['title'], i['body'], " ".join(labels) ])
    for e in i['events']:
        if ("event" in e):
            writer.writerow([ " - ", e['event'], e['created_at'], (e['actor'])['login'] ])
        else:
            writer.writerow([ " - ", "comment", e['created_at'], e['user']['login'], e['body'] ])
f.close()