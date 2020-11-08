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

const pfp = {
  DEFAULT : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon%20(1).png?v=1604780268903',
  NINJA : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-ninja%20(1).png?v=1604819233588',
  CIA : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-cia.png?v=1604821362427',
  FANCY : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-fancy%20(1).png?v=1604799697339',
  COW : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-cow.png?v=1604823476482',
  ROYAL : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon%20(2).png?v=1604813251170',
  GREEN : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2Fgreen-icon%20(1).png?v=1604799767748',
  RED : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2Fred-icon%20(1).png?v=1604799883379',
  HALO : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-halo%20(1).png?v=1604813454785'
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
      status: status.SAFE,
      profile_picture : pfp.DEFAULT
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
        document.getElementById("signup-error-message").innerHTML = "invalid password, must be at least 6 characters"
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
      
    //console.log("error: " + reason)
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
  //console.log(document.getElementById('friend-search-text').value);
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
  //update friend request HTML
  updateData(user);

})

document.getElementById("interactions-button").addEventListener("click",() => {
  makePageVisible("interactions-page");
  updateData(user);
})

document.getElementById("big-green-button").addEventListener("click",() => {
  socket.emit("big-green-button", user.email);
});

document.getElementById("big-red-button").addEventListener("click",() => {
  let message = prompt("Please enter an optional message to be emailed out to friends:");
  socket.emit("big-red-button", {
    email : user.email,
    message : message
  });
  
  
});

// -------- pfp select --------------
document.getElementById("pfp-select-button").addEventListener("click",() => {
  makePageVisible("pfp-select-page");
});


$('.pfp').each(function(){
  this.addEventListener('click', () => {
    let key = this.id.split('-')[0].toUpperCase();
    user.profile_picture = pfp[key];
    socket.emit("update-pfp", {
      email: user.email,
      profile_picture: user.profile_picture
    });
    updateData(user);
    makePageVisible("profile-page");
  })
})


document.getElementById("interactions-log-button").addEventListener('click', function(){
  user.interactions.push({
    time: (new Date()).toDateString(),
    user: document.getElementById("interactions-friend-dropdown").value
  });
  document.getElementById("interactions-friend-dropdown").value = "";
  socket.emit('write-interactions', {
      email: user.email,
      interactions: user.interactions
    }
  );
});





function updateFRContent(friend_requests){
  //generate the friend request list HTML, and add an event listener to each of the pairs of buttons
  document.getElementById("friend-request-content").innerHTML = generateFriendRequestHTML(friend_requests);
  $(".friend-request-accept-button").each( function() {
    this.addEventListener("click", () => {
      let friend = document.getElementById("friend-request-name" + this.id[this.id.length-1]).innerHTML.trim();
      //console.log('user: ' + user.email)
      //console.log('friend: ' + friend);
      socket.emit('accept-friend-request', {
        friend : friend, 
        user : user.email
      });
    })
  })
  
  $(".friend-request-reject-button").each( function() {
    this.addEventListener("click", () => {
      let friend = document.getElementById("friend-request-name" + this.id[this.id.length-1]).innerHTML.trim();
      //console.log('user: ' + user.email)
      //console.log('friend: ' + friend);
      socket.emit('reject-friend-request', {
        friend : friend, 
        user : user.email
      });
    })
  })
}



// function updateFriendList(friends){
//   //document.getElementById("friend-list-div").innerHTML = generateFriendListHTML(friends);
//   socket.emit("")
// }




socket.on('push_data', (data) => {
  if(data === false){
    $("#login-error-div").show()
  }
  else{
    $("#login-error-div").hide()
    user = data;
    updateData(user);
    makeScreenVisible("main-screen");
    makePageVisible("home-page");
  }
});


//response from server after sending a friend request
socket.on('friend-request-response', (data) => {
  //console.log("friend request response: " + data.toString())
  if(data === true){
    document.getElementById("friend-search-text").value = "";
    $('#friend-search-error-div').hide()
  } else {
    //shows error div
    $('#friend-search-error-div').show()
  }
})


socket.on('friend-request-resolution', (data) => {
  if(data.accepted === true){
    user.friends.push(data.friend);
  }
  for(let i = user.friend_requests.length-1; i >= 0; i --){
    if(user.friend_requests[i] === data.friend){
      user.friend_requests.splice(i,1);
    }
  }
  
  updateData(user);
  
  
})


socket.on('response-friend-list-HTML', (data) => {
  //console.log(data);
  document.getElementById("friend-list-div").innerHTML = data;
})

socket.on("response-interactions-history-HTML", (data) => {
  //console.log(data);
  document.getElementById("interactions-history-content").innerHTML = data;
  //updateData(user);
})


socket.on('updateData', (data) => {
  for( let email in data){
    if(email === user.email){
      user = data[email];
      user.friends = Array.from(new Set(user.friends));
      updateData(user);
      break;
    }
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
    i+=1
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
  //console.log(output);
  return output;
}


function generateInteractionsDropdown(friends){
  let output = ""
  for (let friend of friends) {
    let h = `
      <option value="${friend}">${friend}</option>

    `
    output += h;
  }
  
  //console.log(output);
  return output;
}


function updateInteractionsDropdown(friends){
  document.getElementById("interactions-friend-dropdown").innerHTML = generateInteractionsDropdown(friends);
}




function updateData(user){
  //friend requests
  updateFRContent(user.friend_requests);
  
  //interactions dropdown
  updateInteractionsDropdown(user.friends);
  
  //interactions list
  socket.emit("request-interactions-history-HTML", user.interactions);
  
  //friend list
  socket.emit("request-friend-list-HTML", user.friends);
  
  
  
  //profile picture
  $(".user-profile-picture").each(function(){
      $(this).attr('src', user.profile_picture);
  })
}



