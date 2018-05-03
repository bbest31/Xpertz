const functions = require('firebase-functions');
var request = require("request");

exports.notifyNewSignup = functions.auth.user().onCreate( event =>{
    const user = event.data;
    const email = user.email;
    return request.post(
        "https://hooks.slack.com/services/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",
        {json: {text: `New sign up from ${email} !!`}}
    );
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
