const { response } = require('express');

const accountSid = 'AC3685c3ecfd622fcd8106d55ee37b02ec';
const authToken  = '604807f4e7b62a4e92bea3d99fcc8766';
const client = require('twilio')(accountSid, authToken);


console.log("test message");

client.messages
  .create({
     body: '74835',
     from: '+12059647158',
     to: '+917907839670'
   }).then(message => console.log(message.sid));

  
  