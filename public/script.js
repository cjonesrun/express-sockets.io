// client-side js, loaded by index.html
// run by the browser each time the page is loaded

console.log("public/script.js loaded");

const newEvent = (list, content) => {
    const item = document.createElement('li');
    let d = new Date();
    content = "[" + d.toDateString() + " " + d.toLocaleTimeString() + "] " + content;
    item.innerText = content;
    list.insertBefore(item, list.childNodes[0]);

    // truncate the list
    var children = list.children;
    while(children.length > 20) {
      list.removeChild(children[children.length -1]);
      children = list.children;
    }

    return item;
  };

const get = (url, callback) =>  {
      var xhttp = new XMLHttpRequest();
      xhttp.open("GET", url, true); 
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.onreadystatechange = function() {
       if (this.readyState == 4 && this.status == 200) {

         var response = this.responseText;
         callback(response);
       }
      };
      //var data = {name:'yogesh',salary: 35000,email: 'yogesh@makitweb.com'};
      //xhttp.send(JSON.stringify(data));
      xhttp.send();
    };