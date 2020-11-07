// app.js


const express = require("express");
const app = express();
const server = require('http').createServer(app);
const port = 8080;
const io = require('socket.io')(server);


const cp = require('child_process')
const util = require('util')
const execFile = util.promisify(cp.execFile);

const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const Authenticator = require('ibm-watson/auth').IamAuthenticator;

const fs = require('fs');

const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01'
});



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



function readJson(filePath, callback) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return callback && callback(err)
        }
        try {
            console.time()
            var object = JSON.parse(fileData)
            console.timeEnd();
            return callback && callback(null, object)
        } catch(err) {
            return callback && callback(err)
        }
    })
}



readJson('test.json', function(error, data){
  if(error){ 
    console.log(error)
    return;
  }
  //console.log(data);
  console.log('done');
  
})



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


translate("Hello, how are you?", "en", "es", function(translations) {
  console.log(translations);
})












// ************************
// ******* SOCKETS ********
// ************************

io.on('connection',(socket) => {
  
  console.log('A user has connected!');
  
  
  socket.on('run cpp', (data) => {
    
    getCPPOutput(data.filename, data.args, (output) => {
      socket.emit('cpp output', {filename: data.filename, output: output})
    })
    
  })
  
  
  socket.on('disconnect', () => {
    console.log("A user disconnected :(")
  })
  
})


