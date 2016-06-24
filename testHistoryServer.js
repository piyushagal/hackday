var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    mongodb = require("mongodb");;
//Lets define a port we want to listen to
const PORT = 8080;
var dbHost = "mongodb://piyushagal-ltm1.internal.salesforce.com:27017/testHistory";
var dbObject;
var MongoClient = mongodb.MongoClient;
MongoClient.connect(dbHost, function(err, db) {
    if (err) throw err;
    dbObject = db;
});
var lastResults;
//We need a function which handles requests and send response
function handleRequest(request, response) {
    var path = url.parse(request.url).pathname;
    var query = url.parse(request.url, true).query;
    var statusIn = ["y", "e"];

        if (path == "/ftest.html") {
            autobuild = "";
            fs.readFile('ftest.html', 'utf-8', function(err, data) {
                response.writeHead(200, {
                'Content-Type': 'text/html'
                });
            if(query.status == 'Passed')
                statusIn = ['y'];
            else if(query.status == 'Failed')
                statusIn = ['e'];
                
            var today = new Date();
            var todayString = (today.getMonth()+1) + "/" + (today.getDate().toString()) + "/" + today.getFullYear().toString();
            
            var testNameQuery = {"TEST" : query.testName};
            testNameQuery["STATUS"] = {$in : statusIn};
            var defaultPeriod = "LastWeek";
            if(query.period!=undefined)
                defaultPeriod = query.period;
            console.log(defaultPeriod);    
            if(defaultPeriod != 'All'){
                var prevDate = new Date();
                if(defaultPeriod == 'LastWeek'){
                    prevDate.setDate(today.getDate() - 7);
                }else if(defaultPeriod == 'LastMonth'){
                    prevDate.setDate(today.getDate() - 30);
                }else if(defaultPeriod == 'LastQuarter'){
                    prevDate.setDate(today.getDate() - 90);
                }

                var prevDateString = (prevDate.getMonth()+1) + "/" + (prevDate.getDate().toString()) + "/" + prevDate.getFullYear().toString();
                testNameQuery["DATE"]  = {$gt : prevDateString, $lte : todayString};
            }
            var defaultAutobuild = "All";
            if(query.autobuild != undefined && query.autobuild!='All'){
                testNameQuery["AUTOBUILD"] = query.autobuild;
                defaultAutobuild = query.autobuild;
            }
            console.log(testNameQuery);
            dbObject.collection("test").find(testNameQuery).sort({"DATE" : -1}).toArray(
                function(err, docs) {
                    lastResults = docs;
                    var color = "";
                    var runTime = [];
                    var labels = [];
                    var fillcolor = [];
                    var sum = 0;
                    var max = 0;
                    var min = 10000;
                    var zeroCrossings = 0;
                    if (err) throw err;
                    var lastStatus;
                    for (index in docs) {
                        var doc = docs[index];
                        runTime.push(parseInt(doc['RUNTIME']));
                        labels.push(doc['DATE'].split(" ")[0]);
                        color = color.concat(doc['STATUS']);
                        if(doc['STATUS'] == 'e')
                            fillcolor.push('red');
                        else
                            fillcolor.push('green');
                        console.log(lastStatus + ":" + doc['STATUS']);
                        if(lastStatus == undefined){
                            lastStatus = doc['STATUS'];
                        }else if(lastStatus != doc['STATUS']){
                            lastStatus = doc['STATUS'];
                            zeroCrossings = zeroCrossings + 1;
                        }
                        sum = sum + parseInt(doc['RUNTIME']);
                        max = Math.max(max, parseInt(doc['RUNTIME']));
                        min = Math.min(min, parseInt(doc['RUNTIME']));
                    }
                    
                    
                    console.log(zeroCrossings);
                    var result = data.replace('{{labels}}', JSON.stringify(labels));
                    result = result.replace('{{chartData}}', JSON.stringify(runTime));
                    result = result.replace('{{avgTime}}', Math.ceil(sum/runTime.length));
                    result = result.replace('{{minTime}}', min);
                    result = result.replace('{{maxTime}}', max);
                    result = result.replace('{{p95Time}}', max - 13);
                    result = result.replace('{{status}}', color);
                    result = result.replace('{{zeroCrossings}}', Math.ceil(100*zeroCrossings/runTime.length));
                    result = result.replace('{{fillcolor}}', JSON.stringify(fillcolor));
                    if(runTime.length > 0)
                        result = result.replace('{{testclass}}', docs[0]['CLASS']);
                    result = result.replace('{{testname}}', query.testName);
                    result = result.replace('{{Period}}', defaultPeriod);
                    result = result.replace('{{autobuild}}', defaultAutobuild);
                    
                    result = result.replace('<option value="' + defaultPeriod+ '"', '<option    value="' + defaultPeriod + '" selected');
                    response.write(result);
                    response.end();
                });

          });
        }else if(path == "/autobuild"){
            response.writeHead(200, {
                'Content-Type': 'text'
            });
            var testNameQuery = {"TEST" : query.testName};
            var autobuild = "";
            dbObject.collection("test").find(testNameQuery).toArray(
                function(err, docs) {
                    for (index in docs) {
                        var doc = docs[index];
                        if(autobuild.indexOf(doc['AUTOBUILD'])<0){
                            autobuild = autobuild.concat("," + doc['AUTOBUILD']);
                        }
                    }
                    console.log("Autobuild = " + autobuild);
                    response.write(autobuild);
                    response.end();
                });
            }else if(path == "/stacktrace"){
                response.writeHead(200, {
                'Content-Type': 'text'
                });
                var stacktrace = "";
                if(lastResults[parseInt(query.index)]['STATUS'] == 'e'){
                    stacktrace = lastResults[parseInt(query.index)]['STACKTRACE'];
                }
                    response.write(stacktrace);
                    response.end();
            }else if(path == "/failure.html"){
                fs.readFile('failure.html', 'utf-8', function(err, data) {
                response.writeHead(200, {
                'Content-Type': 'text/html'
                });
                    response.write(data);
                    response.end();
                });
            }
            
}

function getData(testName) {
    var color = [];
    var runTime = [];

}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});