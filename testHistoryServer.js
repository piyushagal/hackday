var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    mongodb = require("mongodb");;
//Lets define a port we want to listen to
const PORT = 8080;
var dbHost = "mongodb://localhost:27017/testHistory";
var dbObject;
var MongoClient = mongodb.MongoClient;
MongoClient.connect(dbHost, function(err, db) {
    if (err) throw err;
    dbObject = db;
});

//We need a function which handles requests and send response
function handleRequest(request, response) {
    var path = url.parse(request.url).pathname;
    var query = url.parse(request.url, true).query;

    //response.end('It Works!! Path Hit: ' + JSON.stringify(query));
    fs.readFile('ftest.html', 'utf-8', function(err, data) {
        response.writeHead(200, {
            'Content-Type': 'text/html'
        });
        var result = data.replace('Working Chart', query.testName);
        if (path == "/ftest.html") {
            if(query.period == undefined){
            dbObject.collection("test").find({
                "TEST": query.testName
            }).sort({'DATE' : -1}).toArray(
                function(err, docs) {
                    var color = [];
                    var runTime = [];
                    var labels = [];
                    if (err) throw err;
                    for (index in docs) {
                        var doc = docs[index];
                        runTime.push(parseInt(doc['RUNTIME']));
                        labels.push(doc['DATE']);
                        color.push(doc['STATUS']);
                    }
                    //console.log(JSON.stringify(runTime));
                    result = result.replace('{{labels}}', JSON.stringify(labels));
                    result = result.replace('{{chartData}}', JSON.stringify(runTime));
                    result = result.replace('{{status}}', JSON.stringify(color));
                    response.write(result);
                    response.end();
                });
        }else{
            var today = new Date();
            var todayString = (today.getMonth()+1) + "/" + (today.getDate().toString()) + "/" + today.getFullYear().toString();
            var prevDate = new Date();
            if(query.period == 'LastWeek'){
                prevDate.setDate(today.getDate() - 7);
            }else if(query.period == 'LastMonth'){
                prevDate.setDate(today.getDate() - 30);
            }else if(query.period == 'LastQuarter'){
                prevDate.setDate(today.getDate() - 90);
            }
            
            var prevDateString = (prevDate.getMonth()+1) + "/" + (prevDate.getDate().toString()) + "/" + prevDate.getFullYear().toString();
            
            console.log(todayString);
            dbObject.collection("test").find({
                "TEST": query.testName, "DATE" : {$gt : prevDateString, $lt : todayString}
            }).sort({'DATE' : -1}).toArray(
                function(err, docs) {
                    var color = [];
                    var runTime = [];
                    var labels = [];
                    if (err) throw err;
                    for (index in docs) {
                        var doc = docs[index];
                        runTime.push(parseInt(doc['RUNTIME']));
                        labels.push(doc['DATE']);
                        color.push(doc['STATUS']);
                    }
                    //console.log(JSON.stringify(runTime));
                    result = result.replace('{{labels}}', JSON.stringify(labels));
                    result = result.replace('{{chartData}}', JSON.stringify(runTime));
                    result = result.replace('{{status}}', JSON.stringify(color));
                    response.write(result);
                    response.end();
                });
        }
        }
    });
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