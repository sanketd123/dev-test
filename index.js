/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */

// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// if you want to use es6, you can do something like
//     require('./es6/myEs6code')
// here to load the myEs6code.js file, and it will be automatically transpiled.

// Change this to get detailed logging from the stomp library
global.DEBUG = false
const url = "ws://localhost:8011/stomp";
let columnIndex=0;
let itemList = [];
let sortOrder = 'ASC'; // ASC, DESC
let SparklineInput = [];
let sparklineTimeArray = [];


const client = Stomp.client(url)
client.debug = function(msg) {
  if (global.DEBUG) {
    console.info(msg)
  }
}

client.connect({}, connectCallback, function(error) {
  alert(error.headers.message)
});

document.getElementById('lastChangedAsk').addEventListener("click", function(){
      sortOrder = (sortOrder=="ASC")?"DESC":"ASC";
});

function connectCallback() {

  client.subscribe('/fx/prices', function(response){
      console.log("response : ", JSON.parse(response.body));
      response = JSON.parse(response.body);

      // append new row
      if(itemList.indexOf(response.name)==-1){
          document.getElementById('tbody').
                   appendChild(document.createElement('tr')).setAttribute('id',response.name);
          itemList.push(response.name);
      }

      // initialise sparkline array & sparklineTimeArray
      if(!SparklineInput[response.name]){
          SparklineInput[response.name]=[];
          sparklineTimeArray[response.name]  = [];
      }

      // get current row
      document.getElementById(response.name).innerHTML = '';
      let tableRow = document.getElementById(response.name);

      // add response data
      tableRow.appendChild(document.createElement('td')).innerHTML = response.name;
      tableRow.appendChild(document.createElement('td')).innerHTML = response.bestBid;
      tableRow.appendChild(document.createElement('td')).innerHTML = response.bestAsk;
      tableRow.appendChild(document.createElement('td')).innerHTML = response.openBid;
      tableRow.appendChild(document.createElement('td')).innerHTML = response.openAsk;
      tableRow.appendChild(document.createElement('td')).innerHTML = response.lastChangeBid;
      tableRow.appendChild(document.createElement('td')).innerHTML = response.lastChangeAsk;

      // create dynamic td for chart
      tableRow.appendChild(document.createElement('td')).setAttribute('id',"chart-"+response.name);

      // add data for sparkline
      SparklineInput[response.name].push((response.bestBid+response.bestAsk)/2);

      //add 30sec to to remove element from array
      let date = new Date();
      sparklineTimeArray[response.name].push(date.getTime()+30000);

      // append row to table body
      document.getElementById('tbody').appendChild(tableRow);

      // sort table after update table
      sortTable();

      // draw spark line
      drawSparkline("chart-"+response.name,SparklineInput[response.name])

  });

}

// sort table
function sortTable(){
  let tbody = document.getElementById("tbody");
  let row, bidPrice, bidName, nextBidPrice, nextBidName;

  // tranverse rows
  for (let i = 0; row = tbody.rows[i]; i++) {

      // remove element from array is exceeds 30 sec time
      removeElementIfExceedsTimes(tbody.rows[i].cells[0].innerText);//bidName

      // compare data with each row
      for (let j = 0; j < tbody.rows.length-i-1; j++) {

          bidPrice     = tbody.rows[j].cells[6].innerText;
          bidName      = tbody.rows[j].cells[0].innerText;
          nextBidPrice = tbody.rows[j+1].cells[6].innerText;
          nextBidName  = tbody.rows[j+1].cells[0].innerText;


          //change row positions according sort order
          if(sortOrder=="ASC"){
              if(bidPrice < nextBidPrice){
                      let parent  = document.getElementById(nextBidName).parentNode;
                      parent.insertBefore(document.getElementById(bidName), document.getElementById(nextBidName).nextSibling);
              }
          }else{
              if(bidPrice > nextBidPrice){
                      let parent  = document.getElementById(nextBidName).parentNode;
                      parent.insertBefore(document.getElementById(bidName), document.getElementById(nextBidName).nextSibling);
              }
          }
      }
  }

}


// draw sparkline
function drawSparkline(elementId, inputArray){

  let element = document.getElementById(elementId);
  let sparkline = new Sparkline(element, {
    lineColor: "#666",
    startColor: "orange",
    endColor: "blue",
    maxColor: "red",
    minColor: "green",
    dotRadius: 3,
    width: 200
  });
  sparkline.draw(inputArray);
}

// remove element if exceeds 30 seconds
function removeElementIfExceedsTimes(bidName){
      let currentDate = new Date();
      let currentTime = currentDate.getTime();
      for(let n=0;n<sparklineTimeArray[bidName].length;n++){
            if(currentTime >= sparklineTimeArray[bidName][n]){
                  sparklineTimeArray[bidName].shift();
                  SparklineInput[bidName].shift();
            }
      }
}
