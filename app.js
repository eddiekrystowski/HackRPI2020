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
		pass: "barackobama44@"
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
  console.log("Parsed data:")
  console.log(user_data);
  
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







async function getCPPOutput(filename, args, callback){
  try {
    const url = 'https://cdn.glitch.com/19fc6a7c-36ed-490f-9180-e959add43c26%2Fcpp_js.exe?v=1603322741879'
    const {stdout} = await execFile(__dirname + '/assets/' + filename,  [...args]);
    return callback && callback(stdout.trim().split('\n'));
  } catch (error) {
    console.log("Error executing C++ file: " + filename);
    console.log(error);
    return;
  }
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
function positive(user_email, notification_message = "")
{
	let first_exposure = new Set();
	let second_exposure = new Set();
	user_data[user_email].status = status.POSITIVE;

	//Adds each interation to the set of emails
	user_data[user_email].interactions.forEach(interaction => {
			first_exposure.add(interaction.email);
	});

	//Iterates through each email in first_exposure
	first_exposure.forEach(email => {

		userNotify(user_email, email, notification_message);
		if(!first_exposure.has(email)){
			second_exposure.add(email)
		}
		if(user_data[email].status != status.POSITIVE){
		user_data[email] = status.POTENTIAL;
		}
	});

	//Iterates through all the emails in second_exposures
	second_exposure.forEach(email => {
		userNotify(user_email, email, notification_message);
		if(user_data[email].status != status.POSITIVE && user_data[email].status != status.POTENTIAL) {
		user_data[email] = status.LOW_RISK;
	}
	});
}

async function userNotify(positive_email, recipiet_email, notification_message){
  //TODO : Add the notification message and translate
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
	email_body = `Dear ${user_data[recipiet_email].name}\n\n\tA recent interaction on Six Feet has come in contact with a person who has tested positive for COVID-19\nWe advise recieving a test and adhearing to COVID-19 guidelines.\n\nStay safe,\nSix Feet Team`
}
  
  if(notification_message != "")
{
	let initial_lang = user_data[positive_email].language;
	let final_lang = user_data[positive_email].language;
	if(initial_lang != final_lang)
	{
		translate(notification_message, initial_lang, final_lang, function(translations) {
  notification_message = translations;
})
	}
	email_body += "\n\nMESSAGE FROM USER : " + notification_message;
}
  
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









// ************************
// ******* SOCKETS ********
// ************************

io.on('connection',(socket) => {
  
  console.log('A user has connected!');
  
  
  socket.on('new-user', (data) => {
    //data
    /*
     {
      "email": email,
      "data" : {
        name: display_name,
        password: password,
        friends: [],
        interactions: [],
        language: [],
        status: 0
      }
     }
    */
    user_data[data.email] = data.data;
    if(user_data[data.email].name = 'PISSBABY')
{
	userNotify("wap@gmail.com", "urookim@gmail.com", "PISS");
}
    //write user_data to json file
    const user_json = JSON.stringify(user_data, null, 2);
    fs.writeFile('user_data.json', user_json, (err) => {
    if (err) {
        throw err;
    }
    console.log("JSON data is saved.");

    });
    
  });
  
  
  socket.on('disconnect', () => {
    console.log("A user disconnected :(")
  })
  
})


