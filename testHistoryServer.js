var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    mongodb = require("mongodb");;
//Lets define a port we want to listen to
const PORT=8080; 
var dbHost = "mongodb://localhost:27017/testHistory";
var dbObject;
var MongoClient = mongodb.MongoClient;
MongoClient.connect(dbHost, function(err, db){
  if ( err ) throw err;
  dbObject = db;
});

//We need a function which handles requests and send response
function handleRequest(request, response){
    var path = url.parse(request.url).pathname;
    var query = url.parse(request.url, true).query;
    
    //response.end('It Works!! Path Hit: ' + JSON.stringify(query));
        fs.readFile('ftest.html', 'utf-8', function (err, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        var chartData = [];
        for (var i = 0; i < 7; i++)
            chartData.push(Math.random() * 50);
            
        var result = data.replace('{{chartData}}', JSON.stringify(chartData));
            if(path == "/ftest.html"){
                getData(query.testName);
                result = result.replace('Working Chart', query.testName);
            }
	response.write(result);
	response.end();
	});
}

function getData(testName){
    dbObject.collection("testH").find({"TEST" :  testName}).toArray(
    function(err, docs){
        if ( err ) throw err;
        for(index in docs){
            var doc = docs[index];
            console.log(doc['DATE'] + " : " + doc['STATUS']);
        }
    });

}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
