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

var autobuild = "";

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
            var result = data.replace('Working Chart', query.testName);
            if(query.status == 'Passed')
                statusIn = ['y'];
            else if(query.status == 'Failed')
                statusIn = ['e'];
                
            var today = new Date();
            var todayString = (today.getMonth()+1) + "/" + (today.getDate().toString()) + "/" + today.getFullYear().toString();
            
            var testNameQuery = {"TEST" : query.testName};
            testNameQuery["STATUS"] = {$in : statusIn};
            if(query.period!=undefined && query.period != 'All'){
                var prevDate = new Date();
                if(query.period == 'LastWeek'){
                    prevDate.setDate(today.getDate() - 7);
                }else if(query.period == 'LastMonth'){
                    prevDate.setDate(today.getDate() - 30);
                }else if(query.period == 'LastQuarter'){
                    prevDate.setDate(today.getDate() - 90);
                }

                var prevDateString = (prevDate.getMonth()+1) + "/" + (prevDate.getDate().toString()) + "/" + prevDate.getFullYear().toString();
                testNameQuery["DATE"]  = {$gt : prevDateString, $lte : todayString};
            }
            if(query.autobuild != undefined){
                testNameQuery["AUTOBUILD"] = query.autobuild;
            }
            debugger;
            dbObject.collection("test").find(testNameQuery).sort({"DATE" : -1}).toArray(
                function(err, docs) {
                    var color = "";
                    var runTime = [];
                    var labels = [];
                    if (err) throw err;
                    for (index in docs) {
                        var doc = docs[index];
                        runTime.push(parseInt(doc['RUNTIME']));
                        labels.push(doc['DATE']);
                        color = color.concat(doc['STATUS']);
                        if(autobuild.indexOf(doc['AUTOBUILD'])<0){
                            autobuild = autobuild.concat("," + doc['AUTOBUILD']);
                        }
                    }
                    //console.log(JSON.stringify(runTime));
                    result = result.replace('{{labels}}', JSON.stringify(labels));
                    result = result.replace('{{chartData}}', JSON.stringify(runTime));
                    result = result.replace('{{status}}', color);
                    if(query.period!=undefined){
                        result = result.replace('<option value="' + query.period + '"', '<option    value="' + query.period + '" selected');
                    }
                    response.write(result);
                    response.end();
                });

          });
        }else if(path == "/autobuild"){
            response.writeHead(200, {
                'Content-Type': 'text'
            });
            console.log("Autobuild = " + autobuild);
            response.write(autobuild);
            response.end();
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