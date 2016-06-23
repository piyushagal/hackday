# hackday
<h2> Get Started </h2>
1) https://nodejs.org/dist/v4.4.5/node-v4.4.5.pkg 
, download and install node.js

2) After installation completes, run : npm install chart.js --save
to install chart.js

3) Download the attached file and extract.

4) cd into the folder, and run the server
node testHistoryServer.js


<h2> To Import CSV </h2>
 mongoimport --db testHistory --collection testH --type csv --headerline --file Downloads/sample\ forcasting\ data\ -\ data.csv 
