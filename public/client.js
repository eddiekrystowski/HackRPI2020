/*global io*/

/* redirects to this website link
window.onload = function() {
  window.location.href = "https://www.wikipedia.org/";
}
*/

//initialize client socket
let socket = io();
let user = {}

$(document).ready(function(){
  makeScreenVisible('welcome-screen');
});

const status = {
	NEGATIVE: 'negative',
	POSITIVE: 'positive',
	POTENTIAL: 'potential',
	LOW_RISK: 'lowrisk',
	SAFE : 'safe'
}

function makeScreenVisible(screenId){
  $('.screen').css('display', 'none');
  $('#'+screenId).css('display', 'flex');
}


function makePageVisible(pageId){
  $('.page').css('display', 'none');
  $('#'+pageId).css('display', 'flex');
}

function requestData(email, password){
  socket.emit('request-data', {
    email: email,
    password: password
  })
}

//add event listener to login button
document.getElementById('login-button').addEventListener('click', function(){
  makeScreenVisible('login-screen');
})


document.getElementById('signup-button').addEventListener('click', function(){
  makeScreenVisible('signup-screen');
})

document.getElementById('submit-signup-button').addEventListener('click', function(){
  //confirm matching passwords
  const email = document.getElementById("signup-email").value.trim();
  const display_name = document.getElementById("signup-display").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const confirm = document.getElementById("signup-confirm").value.trim();
  const language = document.getElementById("signup-language").value;
  
  socket.emit('new-user-request', {
    email: email,
    data: {
      email: email,
      name: display_name,
      password: password,
      friends: [],
      interactions: [],
      language: language,
      status: status.SAFE
    },
    confirm: confirm
  }) 
})

socket.on("new-user-response", (data) => {
  if(data[0] === true){
    //success
    makeScreenVisible("main-screen");
    makePageVisible("home-page");
    
  } else {
    return
    //failed
    let reason = data[1];
    console.log("error: " + reason)
    //error messsages --------
  }
})
  

document.getElementById("submit-login-button").addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  socket.emit('request_data', {
    email: email,
    password: password
  });
});





document.getElementById("home-button").addEventListener("click",() => {
  makePageVisible("home-page");
})


document.getElementById("profile-button").addEventListener("click",() => {
  makePageVisible("profile-page");
  document.getElementById("profile-user-email").innerHTML = "  " + user.email;
  document.getElementById("profile-user-language").innerHTML = "  " + user.language;
  document.getElementById("profile-user-status").innerHTML = "  " + user.status;
})

document.getElementById("friends-button").addEventListener("click",() => {
  makePageVisible("friends-page");
})

document.getElementById("interactions-button").addEventListener("click",() => {
  makePageVisible("interactions-page");
})

document.getElementById("big-red-button").addEventListener("click",() => {
  socket.emit("big-red-button", {
    email : user.email,
    //message : document.getElementById(user_message_id).value
  });
})





socket.on('push_data', (data) => {
  if(data === false){
    //TODO : ADD INVALID CREDENTIALS RED FLAG TO LOGIN SCREEN
  }
  else{
    console.log("DATA PUSHED:")
    console.log(data);
    user = data;
    makeScreenVisible("main-screen");
    makePageVisible("home-page");
  }
});
