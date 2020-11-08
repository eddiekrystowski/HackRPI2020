// app.js


const express = require("express");
const app = express();
const server = require('http').createServer(app);
const port = 8080;
const io = require('socket.io')(server);

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// listen for requests
server.listen(port, function() {
  console.log("Your app is listening on port " + port);
});

//STATUS ENUMERATION
const status = {
	NEGATIVE: 'negative',
	POSITIVE: 'positive',
	POTENTIAL: 'potential',
	LOW_RISK: 'lowrisk',
	SAFE : 'safe'
}

// const pfp = {
//   DEFAULT : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon%20(1).png?v=1604780268903',
//   GREEN : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2Fgreen-icon%20(1).png?v=1604799767748',
//   CIA : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-cia.png?v=1604821362427',
//   FANCY : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-fancy%20(1).png?v=1604799697339',
//   HALO : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon-halo%20(1).png?v=1604813454785',
//   ROYAL : 'https://cdn.glitch.com/9f24f09a-2979-4ff2-a617-6e008384bac3%2F6ft_icon%20(2).png?v=1604813251170'
// }

const cp = require('child_process')
const util = require('util')
const execFile = util.promisify(cp.execFile);

const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const Authenticator = require('ibm-watson/auth').IamAuthenticator;

const fs = require('fs');

const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01'
});

const nodemailer = require("nodemailer");
const email_transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: "sixftapp20",
		pass: "Q1!w2@e3#r4$"
	},
});


let user_data = {}

readJson("user_data.json", function(error, data){
  if(error){
    console.log("Error parsing JSON file on startup (Error 001)")
    console.log(error)
    return;
  }
  
  user_data = data;
  //console.log("Parsed data:")
  //console.log(user_data);
  
});




function readJson(filePath, callback) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return callback && callback(err)
        }
        try {
            var object = JSON.parse(fileData)
            return callback && callback(null, object)
        } catch(err) {
            return callback && callback(err)
        }
    })
}






function translate(text, source, target, callback){
  languageTranslator.translate({text: text, source: source, target: target})
  .then(response => {
    return callback && callback(response.result.translations.map(x => x.translation))
  })
  .catch(error => {
      console.log("Error translating text: " + error);
      return;
  })
}

/*
translate("Hello, how are you?", "en", "es", function(translations) {
  console.log(translations);
})
*/

//BIG RED BUTTON
function positive(user_email, notification_message)
{
	let first_exposure = new Set();
	let second_exposure = new Set();
	user_data[user_email].status = status.POSITIVE;

	//Adds each interation to the set of emails
	user_data[user_email].interactions.forEach(function (interaction) {
			first_exposure.add(interaction.user);
    if(user_data[interaction.user].status != status.POSITIVE){
      user_data[interaction.user].status = status.POTENTIAL;
      }
	});

	//Iterates through each email in first_exposure
	first_exposure.forEach(function (email) {
    console.log(email);
		userNotify(user_email, email, notification_message);
    user_data[email].interactions.forEach(function (interaction){
		if(!first_exposure.has(interaction.user)){
			second_exposure.add(interaction.user);
		}
    
		
	});
  });
  console.log(first_exposure);
  console.log(second_exposure);
	//Iterates through all the emails in second_exposures
	second_exposure.forEach(function (email) {
		userNotify(user_email, email, notification_message);
		if(user_data[email].status != status.POSITIVE && user_data[email].status != status.POTENTIAL) {
      user_data[email].status = status.LOW_RISK;
    }
	});
  
  console.log(user_data[user_email].status);
  io.emit("updateData", user_data);
}

            

async function userNotify(positive_email, recipiet_email, notification_message){  //TODO : Add the notification message and translate
	if(positive_email === recipiet_email)
	{
		return;
	}

	let email_body = "";

	if(user_data[recipiet_email].status === status.POTENTIAL)
	{
    let interaction_time = new Date();

    user_data[recipiet_email].interactions.forEach(interaction => {
        if(interaction.email === positive_email)
        {
          interaction_time = interaction.date;
        }
    });

    email_body = `Dear ${user_data[recipiet_email].name},\n\n\tA recent interaction on Six Feet has tested positive for COVID-19.\nWe advise recieving a test and begining a self quarentine immediately.\n\nYou last interaction with this user was on : ${interaction_time.toDateString()}.\n\nStay safe,\nSix Feet Team`;

  }

  
  else
  {
    email_body = `Dear ${user_data[recipiet_email].name}\n\nA recent interaction on Six Feet has come in contact with a person who has tested positive for COVID-19\nWe advise recieving a test and adhearing to COVID-19 guidelines.\n\nStay safe,\nSix Feet Team`
  }
  
  if(notification_message != "")
  {
    let initial_lang = user_data[positive_email].language;
    let final_lang = user_data[recipiet_email].language;
    console.log(initial_lang, final_lang);
    if(initial_lang != final_lang)
    {
      translate(notification_message, initial_lang, final_lang, async function(translations) {
        notification_message = translations[0];
        //if the message is not empty
        console.log(notification_message);
        email_body += "\n\nMESSAGE FROM USER : " + notification_message;
        let info = await email_transporter.sendMail({
          from: '"SIXFEET NOTIFICATION" <sixftapp20@gmail.com>',
          to: recipiet_email,
          subject: "A recent interaction has tested positive for COVID-19",
          text: email_body
        },function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        
      });
	  }
    else
    {
      email_body += "\n\nMESSAGE FROM USER : " + notification_message;
      let info = await email_transporter.sendMail({
        from: '"SIXFEET NOTIFICATION" <sixftapp20@gmail.com>',
        to: recipiet_email,
        subject: "A recent interaction has tested positive for COVID-19",
        text: email_body
      },function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
	
  }
  
}









// ************************
// ******* SOCKETS ********
// ************************

io.on('connection',(socket) => {
  
  console.log('A user has connected!');
  
  socket.on('disconnect', () => {
    console.log("A user disconnected");
  });
  
  
  socket.on('big-red-button', (data) => {
  	positive(data.email, data.message);
  });
  
  
  //Checks login credentials and emits the user data with authentification (Emits false if credentials fo not match)
  socket.on('request_data', (data) => {
    //data.email in user_data
    if(data.email in user_data && user_data[data.email].password === data.password){
      console.log('User successfully logged in!');
      socket.emit('push_data', user_data[data.email]);
    }
    else{
      socket.emit('push_data', false);
    }
  });
  
    socket.on("big-green-button", email => {
      user_data[email].status = status.NEGATIVE;
      io.emit("updateData", user_data);
      //write user_data to json file
      const user_json = JSON.stringify(user_data, null, 2);
      fs.writeFile('user_data.json', user_json, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
      });
    });
  
  //Checks if email exists in server
  socket.on('new-user-request', (data) => {
    console.log('confirming signup');
    let response = confirmSignup(data);
    if(response[0] === true){
      user_data[data.email] = data.data;

      //write user_data to json file
      const user_json = JSON.stringify(user_data, null, 2);
      fs.writeFile('user_data.json', user_json, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");

        socket.emit('push_data', user_data[data.email]);
      })
    }
    socket.emit('new-user-response', response);
  });
  
  socket.on('send-friend-request', (data) => {
    if(data.friend === data.user || !(data.friend in user_data))
    {
      socket.emit('friend-request-response', false);
      return;
    }
    
    console.log('INCOMING FRIENDO');
    console.log(user_data[data.friend].friend_requests);
    if(!(user_data[data.friend].friend_requests.includes(data.user)) && !(user_data[data.friend].friends.includes(data.user)))
    {
      
      (user_data[data.friend].friend_requests).push(data.user);
      
      //write user_data to json file
      const user_json = JSON.stringify(user_data, null, 2);
      fs.writeFile('user_data.json', user_json, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
        
        socket.emit('friend-request-response', true);
        
      });
    } else {
      socket.emit('friend-request-response', false);
    }
    
    io.emit('updateData', user_data);
  });
  
  
  socket.on('accept-friend-request', (data) => {
    user_data[data.user].friend_requests = user_data[data.user].friend_requests.filter(e => e !== data.friend);
    user_data[data.friend].friend_requests = user_data[data.friend].friend_requests.filter(e => e !== data.user);
    user_data[data.user].friends.push(data.friend);
    user_data[data.friend].friends.push(data.user);
    //write user_data to json file
    const user_json = JSON.stringify(user_data, null, 2);
    fs.writeFile('user_data.json', user_json, (err) => {
      if (err) {
          throw err;
      }
      console.log("JSON data is saved.");

      socket.emit('friend-request-resolution', {
        accepted: true,
        friend: data.friend
      });
      
    });
    
    user_data[data.user].friends = Array.from(new Set(user_data[data.user].friends))
    user_data[data.friend].friends = Array.from(new Set(user_data[data.friend].friends));
    
    io.emit('updateData', user_data);
    
  });
  
  socket.on('reject-friend-request', (data) => {
    user_data[data.user].friend_requests = user_data[data.user].friend_requests.filter(e => e !== data.friend);
    user_data[data.friend].friend_requests = user_data[data.friend].friend_requests.filter(e => e !== data.user);
    //write user_data to json file
    const user_json = JSON.stringify(user_data, null, 2);
    fs.writeFile('user_data.json', user_json, (err) => {
      if (err) {
          throw err;
      }
      console.log("JSON data is saved.");

      socket.emit('friend-request-resolution', {
        accepted: false,
        friend: data.friend
      });

    });
    
    //io.emit('updateData', user_data);
  })
  
  socket.on('request-friend-list-HTML', (data) => {
    socket.emit("response-friend-list-HTML", generateFriendListHTML(data));
  })
  
  socket.on('update-pfp', (data) => {
    user_data[data.email].profile_picture = data.profile_picture;
    const user_json = JSON.stringify(user_data, null, 2);
      fs.writeFile('user_data.json', user_json, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
      });
    
    io.emit('updateData', user_data);
  });
  
  socket.on('request-interactions-history-HTML', (data) => {
    socket.emit("response-interactions-history-HTML", generateInteractionHistoryHTML(data));
  })
  
  socket.on('write-interactions', (data) => {
    user_data[data.email].interactions = data.interactions;
    const user_json = JSON.stringify(user_data, null, 2);
    fs.writeFile('user_data.json', user_json, (err) => {
      if (err) {
          throw err;
      }
      console.log("JSON data is saved.");
    });
    
    
    io.emit("updateData", user_data);
  });
  
});  






function getStatusColor(user_status){
  switch(user_status){
    case "negative":
      return "green";
      break;
    case "positive":
      return "red";
      break;
    case "lowrisk":
      return "yellow";
      break;
    case "potential":
      return "orange";
      break;
    case "safe":
      return "gray";
      break;
  }
  
  console.log("ERROR GETTING COLOR")
}

function generateFriendListHTML(friends) {
  friends = Array.from(new Set(friends));
  let output = ""
  let i = 0;
  for(let friend of friends) {
    let h = `
      <div class="friend">
        <img style="width:8.5%; height:75%;" src="${user_data[friend].profile_picture}">
        <p id="friend-list-name${i}">
          ${friend}
        </p>
        <div style="background-color:${getStatusColor(user_data[friend].status)};">
        </div>
      </div>
      <hr>
    `
    i += 1;
    output += h;
  }
  
  return output;
}


function generateInteractionHistoryHTML(interactions){
  let output = ""
  for(let interaction of interactions){
    console.log(interaction);
    let name = user_data[interaction.user].name;
    let h = `
      <div class="interaction">
        <div class="row" style="width:auto">
          <div class="i-color" style="background-color:${getStatusColor(user_data[interaction.user].status)};"></div>
          <div class="i-text">
            Interacted with ${interaction.user} (${name}) on ${interaction.time}.
          </div>
        </div>
      </div>
      <hr>
        
    `
    output += h;
  }
  
  return output;
}




function confirmSignup(data){
  if (!confirmPassword(data.data.password)){
      console.log('invalid password')
      return [false, 'password'];
    }
    if (!confirmEmail(data.data.email)){
      console.log('invalid email')
      return [false, 'email'];
    }
    if (!confirmDisplay(data.data.name)){
      console.log('invalid display')
      return [false, 'display'];
    }
    if(data.data.password !== data.confirm){
      console.log('passwords don\'t match')
      return [false, 'confirm'];
    }
    
    
    console.log('returning true')
    return [true, null];
}

function confirmDisplay(display_name){
  if (display_name && isNaN(display_name))
      return true
  return false
}

function confirmPassword(password){
  //At least 6 characters
  //Other characters can be alphanumeric + underscore
  const valid = password.match(/^\w{6,}$/);
  if(!valid) 
    // ################
    // show password error
    return false;
  return true
}

function confirmEmail(email){
  
  if(((email in user_data)) || !email.match(/^\w{1,}@\w{1,}.\w{1,}$/))
    return false;
  return true;
}
