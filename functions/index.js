const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp(functions.config().firebase);

const app = express();


// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

app.post('/send-sms', (request, response) => {
  const {
    sms, name,
    phoneNumber,
    senderNumber
  } = request.body;
  admin.database().ref(`sms`).push({
    sms,
    name,
    phoneNumber,
    senderNumber
  }).then(() => response.status(201).send({response: 'Message sent successfully'}))
});

const getUserMessages = (messages, phoneNumber, isSender) => {
  const arrayOfMessages = [];
  messages.forEach((message) => {
    if (isSender) {
      if (message.val().senderNumber === phoneNumber && !message.val().isDeleted) {
        arrayOfMessages.push(message.val())      
      }
    } else {
      if (message.val().phoneNumber === phoneNumber && !message.val().isDeleted) {
        arrayOfMessages.push(message.val())      
      }
    }
  });
  return arrayOfMessages;
}

app.get('/get-sms/:phoneNumber', (request, response) => {
  admin.database().ref('sms').once('value')
    .then((messages) => {
      const userMessages = getUserMessages(messages, request.params.phoneNumber, true)
      response.status(200).send({response: userMessages.length > 0 ? userMessages : 'No message yet for this number'});
    });
});

app.get('/get-sent-sms/:phoneNumber', (request, response) => {
  admin.database().ref('sms').once('value')
    .then((messages) => {
      const userMessages = getUserMessages(messages, request.params.phoneNumber, true)
      response.status(200).send({response: userMessages.length > 0 ? userMessages : 'No sent message yet for this number'});
    });
});

app.delete('/delete-messages/:phoneNumber', (request, response) => {
  admin.database().ref('sms').once('value')
    .then((messages) => {
      messages.forEach((message) => {
        if (message.val().phoneNumber === request.params.phoneNumber
          || message.val().senderNumber === request.params.phoneNumber) {
            message.key
            admin.database().ref(`sms/${message.key}`).update({
              isDeleted: true
            });
          }
      });
      response.status(200).send({response: 'Contact deleted'});
    });
});

app.get('*', (request, response) => {
  response.status(200).send({message: 'welcome to the sms managaement app'})
})

const sms = functions.https.onRequest(app);

module.exports = {
  sms
}
