// connect to the Web Socket server
let connection = io( 'http://192.168.71.65:9000' );

// when connection is established 
connection.on( 'connect', () => {
  isConnectionActive = true;
} );

connection.on( 'disconnect', () => {
  isConnectionActive = false;
} );


window.addEventListener('load', (event) => {
  connection.emit('table', true);
});

connection.on('returnTable', (data)=>{
    let parsedData = JSON.parse(data);
    console.log(parsedData);
    createTable(parsedData);
});


function createTable(data){
  let table = document.getElementById("table");

  for(let i = 0; i < data.length; i++){
    let tr = table.insertRow();

    let td = tr.insertCell();
    let text = document.createTextNode(data[i].id);
    td.appendChild(text);

    td = tr.insertCell();
    text = document.createTextNode(data[i].naziv);
    td.appendChild(text);

    td = tr.insertCell();
    text = document.createTextNode(data[i].namen);
    td.appendChild(text);

    td = tr.insertCell();
    text = document.createTextNode(data[i].datum);
    td.appendChild(text);

    td = tr.insertCell();
    text = document.createTextNode(data[i].izvoz);
    td.appendChild(text);

    td = tr.insertCell();
    text = document.createTextNode(data[i].prihod);
    td.appendChild(text);

    td = tr.insertCell();
    text = document.createTextNode(data[i].imeinpriimek);
    td.appendChild(text);
  }
}

document.getElementById("vnosButton").addEventListener("click", ()=> {document.getElementById("izvozForm").hidden = false;});

function novIzvoz(){

}