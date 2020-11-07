/*global io*/

//initialize client socket
let socket = io();


//add an event listener to the test button
document.getElementById("testButton").addEventListener('click', function(){
  console.log('clicked button');
  socket.emit('run cpp', { filename: 'cpp_js.exe', args: ['data.txt']})
})



//add a listener to the socket for the header 'cpp output'
socket.on('cpp output', (data) => {
  console.log(`${data.filename}: ${data.output}`)
})

