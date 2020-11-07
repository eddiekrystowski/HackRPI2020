/*global io*/

/* redirects to this website link
window.onload = function() {
  window.location.href = "https://www.wikipedia.org/";
}
*/

//initialize client socket
let socket = io();

$(document).ready(function(){
  makeScreenVisible('welcome-screen');
});


function makeScreenVisible(screenId){
  $('.screen').css('display', 'none');
  $('#'+screenId).css('display', 'flex');
}


function makePageVisible(pageId){
  $('.page').css('display', 'none');
  $('#'+pageId).css('display', 'flex');
}

// takes input from signup screen and checks if all fields are valid, if so sends data to be stored and brings to main screen
function confirmSignup(email, display_name, password, confirm){
  return true;
  console.log('confirming signup');
  if (!confirmPassword(password)){
    console.log('invalid password')
    return false;
  }
  if (!confirmEmail(email)){
    console.log('invalid email')
    return false;
  }
  if (!confirmDisplay(display_name)){
    console.log('invalid display')
    return false;
  }
  if(password !== confirm){
    console.log('passwords don\'t match')
    return false;
  }
  
  
  console.log('returning true')
  return true;
}

function confirmDisplay(display_name){
  if (display_name && isNaN(display_name))
      return true
  return false
}

function confirmPassword(password){
  //At least 6 characters
  //First character must be a letter
  //Other characters can be alphanumeric + underscore
  const valid = password.match(/^[A-Za-z]\w{5,}$/);
  if(!valid) 
    // ################
    // show password error
    return false;
  return true
}

function confirmEmail(email){
  //check if unique
  if(!email.match(/^\w{1,}@\w{1,}.\w{1,}$/))
    return false;
  return true;
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
  
  const valid = confirmSignup(email, display_name, password, confirm);
  
  console.log(valid)
  if(valid){
    //send to server
    socket.emit('new-user', {
      email: email,
      data: {
        email: email,
        name: display_name,
        password: password,
        friends: [],
        interactions: [],
        //language: language,
        status: 0
      }
    })
    makeScreenVisible("main-screen")
  }
})


document.getElementById("home-button").addEventListener("click",() => {
  makePageVisible("home-page");
})


document.getElementById("profile-button").addEventListener("click",() => {
  makePageVisible("profile-page");
})

document.getElementById("friends-button").addEventListener("click",() => {
  makePageVisible("friends-page");
})

document.getElementById("interactions-button").addEventListener("click",() => {
  makePageVisible("interactions-page");
})

document.getElementById("big-red-button").addEventListener("click",() => {
  
})










