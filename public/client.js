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
      friend_requests : [],
      interactions: [],
      language: language,
      status: status.SAFE
    },
    confirm: confirm
  }) 
})

socket.on("new-user-response", (data) => {
  if(data[0] === true){
    $("#signup-error-div").hide()
    //success
    makeScreenVisible("main-screen");
    makePageVisible("home-page");
    
  } else {
    $("#signup-error-div").show()
    //failed
    let reason = data[1];
    switch (reason) {
      case "password":
        document.getElementById("signup-error-message").innerHTML = "invalid password, must be at least 6 characters\n and contain 1 number or letter"
        break;
      case "email":
        document.getElementById("signup-error-message").innerHTML = "invalid email, must follow format (example@example.com)"
        break
      case "display":
        document.getElementById("signup-error-message").innerHTML = "invalid display name, must not be empty and must contain a letter"
        break;
      case "confirm":
        document.getElementById("signup-error-message").innerHTML = "passwords do not match"
        break
      default:
        document.getElementById("signup-error-message").innerHTML = "unknown error"
        break;
    }
      
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


//ADD FRIEND BUTTON
document.getElementById("friend-search-button").addEventListener("click",() => {
  socket.emit('send-friend-request', {
	user : user.email,
	friend : document.getElementById('friend-search-text').value
});
  console.log(document.getElementById('friend-search-text').value);
})

document.getElementById("status-button").addEventListener("click",() => {
  makePageVisible("home-page");
})


document.getElementById("profile-button").addEventListener("click",() => {
  makePageVisible("profile-page");
  document.getElementById("profile-user-email").innerHTML = "  " + user.email;
  document.getElementById("profile-user-language").innerHTML = "  " + user.language;
  document.getElementById("profile-user-status").innerHTML = "  " + user.status;
  document.getElementById("profile-user-display_name").innerHTML = user.name;
})

document.getElementById("friends-button").addEventListener("click",() => {
  makePageVisible("friends-page");
  document.getElementById("friend-request-content").innerHTML = generateFriendRequestHTML(user.friend_requests);
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



document.getElementsByClassName("friend-request-accept-button").addEventListener("click", () => {
  
  socket.emit('accept-friend-request', {
    friend : document.getElementById("friend-request-name" + this.id[this.id.length-1]).value, 
    user : user.email
  });
});

document.getElementsByClassName("friend-request-reject-button").addEventListener("click", () => {
  socket.emit('reject-friend-request', {
    friend : document.getElementById("friend-request-name" + this.id[this.id.length-1]).value, 
    user : user.email
  });
});






socket.on('push_data', (data) => {
  if(data === false){
    //TODO : ADD INVALID CREDENTIALS RED FLAG TO LOGIN SCREEN
    $("#login-error-div").show()
  }
  else{
    $("#login-error-div").hide()
    user = data;
    makeScreenVisible("main-screen");
    makePageVisible("home-page");
  }
});



socket.on('friend-request-response', (data) => {
  console.log("friend request response: " + data.toString())
  if(data === true){
    document.getElementById("friend-search-text").value = "";
    $('#friend-search-error-div').hide()
  } else {
    //shows error div
    $('#friend-search-error-div').show()
  }
})




function generateFriendRequestHTML(friend_requests){
  let output = ""
  let i = 0;
  for (let request of friend_requests){
    let h = `
      <div class="friend-request">
        <p id="friend-request-name${i}" class="friend-request-name">
          ${request}
        </p>
        <div class="row">
          <button id="friend-request-accept-button${i}" class="friend-request-accept-button">
            Accept
          </button>
          <button id="friend-request-reject-button${i}" class="friend-request-reject-button">
            Reject
          </button>
        </div>
      </div>

    `
    output += h;
    /*
    <div class="friend-request">
        <p class="friend-request-name">
          Friend Name
        </p>
        <div class="row">
          <button class="friend-request-accept-button">
            Accept
          </button>
          <button class="friend-request-reject-button">
            Reject
          </button>
        </div>
      </div>
    */
  }
  console.log(output);
  return output;
}