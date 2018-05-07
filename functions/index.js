
const admin = require('firebase-admin');
const functions = require('firebase-functions');
var rp = require('request-promise');

admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

//var request = require("request");

//=========XPERTZ FUNCTIONS===========
/*
This file contains all the functions called from Slack using HTTPS.
*/

// exports.notifyNewSignup = functions.auth.user().onCreate( event =>{
//     const user = event.data;
//     const email = user.email;
//     return request.post(
//         "https://hooks.slack.com/services/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",
//         {json: {text: `New sign up from ${email} !!`}}
//     );
// });

//==========ACTION BUTTON FUNCTION==========

exports.actions = functions.https.onRequest((req, res) => {
    //Get the JSON payload object
    const payload = JSON.parse(req.body.payload);
    //Grab the attributes we want
    const callback_id = payload.callback_id;
    const response_url = payload.response_url;

    //Send the response
    res.contentType("json").status(200).send({
         "text":"Callback ID retrieved ${callback_id}"
     });
});

//==========MENU OPTIONS FUNCTION===========

exports.menu_options = functions.https.onRequest((req, res) =>{
    res.sendStatus(200);
});
//==========SLASH COMMAND FUNCTIONS==========

// Add Tag Command
exports.addTag = functions.https.onRequest((req, res) => {
    //Any validation of user origin

    console.log("body: ", req.body);

    res.contentType("json").status(200).send({
        "fallback": "Add expertise tag inertactive message",
        "callback_id": "add_tag",
        "response_type": "ephemeral",
        "replace_original": true,
        "text": "*Add an expertise tag* :brain:",
        "attachments": [
            {
                "fallback": "Interactive menu to add a workspace tag or create a new one",
                "text": "Select a tag to add or create a new one!",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "tags_list",
                        "text": "Pick a tag...",
                        "type": "select",
                        "options": [
                            {
                                "text": "tag 1",
                                "value": "1"
                            },
                            {
                                "text": "tag 2",
                                "value": "2"
                            },
                            {
                                "text": "tag 3",
                                "value": "3"
                            },
                            {
                                "text": "tag 4",
                                "value": "4"
                            }
                        ]

                    },
                    {
                        "name": "add_tag_btn",
                        "text": "Add",
                        "type": "button",
                        "value": "add_tag",
                        "style": "primary"

                    },
                    {
                        "name": "create_tag_btn",
                        "text": "Create New",
                        "type": "button",
                        "value": "create_tag"

                    },
                    {
                        "name": "cancel_add_btn",
                        "text": "Cancel",
                        "type": "button",
                        "value": "cancel_add"

                    }

                ]
            }

        ]

    });

});

// Remove Tag Command
exports.removeTag = functions.https.onRequest((req, res) => {

    res.contentType("json").status(200).send({
        "response_type": "ephemeral",
        "replace_original": true,
        "text": "*Remove a tag* :x:",
        "attachments": [
            {
                "fallback": "Interactive menu to remove a tag from user profile",
                "text": "Choose a tag to remove",
                "color": "#F21111",
                "actions": [
                    {
                        "name": "my_tags_list",
                        "text": "Pick a tag...",
                        "type": "select",
                        "options": [
                            {
                                "text": "tag 1",
                                "value": "1"
                            },
                            {
                                "text": "tag 2",
                                "value": "2"
                            },
                            {
                                "text": "tag 3",
                                "value": "3"
                            },
                            {
                                "text": "tag 4",
                                "value": "4"
                            }
                        ]

                    },
                    {
                        "name": "remove_tag_btn",
                        "text": "Remove",
                        "type": "button",
                        "value": "remove_tag",
                        "style": "danger",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "Removing this tag will remove all of its hi-fives. Do you still want to?",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    },
                    {
                        "name": "cancel_remove",
                        "text": "Cancel",
                        "type": "button",
                        "value": "cancel_remove",
                    }
                ]
            }
        ]
    });
});

// View Profile Command
exports.profile = functions.https.onRequest((req, res) => {
    res.contentType('json').status(200).send({
        "text" : "Invoked the profile command"
        });
});

// Hi-Five Command
exports.hi_five = functions.https.onRequest((req, res) => {
    res.contentType('json').status(200).send({
        "text" : "Invoked the hi-five command"
        });
});

// Search Command
exports.search = functions.https.onRequest((req, res) => {
    res.contentType('json').status(200).send({
        "text" : "Invoked the search command"
        });
});

// View Tags Command
exports.tags = functions.https.onRequest((req, res) => {
res.contentType('json').status(200).send({
"text" : "Invoked the tag list command"
});
});

// Xpertz Command List
exports.commands = functions.https.onRequest((req, res) => {
res.contentType('json').status(200).send({
    "text" : "*Xpertz Command List* :scroll:",
    "attachments" : [
        {"text" : "View your expertise tags or provide a username to view theirs:\n`/profile` _@username (optional)_"},
        {"text" : "Add an expertise tag:\n`/add`"},
        {"text" : "Remove an expertise tag:\n`/removetag`"},
        {"text" : "View all tags used in current workspace:\n`/tags`"},
        {"text" : "Search for experts by tag:\n`/search`"}
    ]
});
});


//Function to handle oauth redirect

/*Response example:
{
  "access_token": "xoxp-XXXXXXXX-XXXXXXXX-XXXXX",
  "scope": "incoming-webhook,commands,bot",
  "team_name": "Team Installing Your Hook",
  "team_id": "XXXXXXXXXX",
  "incoming_webhook": {
      "url": "https://hooks.slack.com/TXXXXX/BXXXXX/XXXXXXXXXX",
      "channel": "#channel-it-will-post-to",
      "configuration_url": "https://teamname.slack.com/services/BXXXXX"
  },
  "bot":{
      "bot_user_id":"UTTTTTTTTTTR",
      "bot_access_token":"xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT"
  }
}
*/
exports.oauth_redirect = functions.https.onRequest((request, response) => {

  //Check if this is the GET request
  if (request.method !== "GET") {
      console.error(`Got unsupported ${request.method} request. Expected GET.`);
      response.contentType('json').status(405).send({
        "Status": "Failure - Only GET requests are accepted"
      });
      return;
  }

  //Check if we have code in the request query
  if (!request.query && !request.query.code) {
    response.contentType('json').status(401).send({
      "Status": "Failure - Missing query attribute 'code'"
    });
    return;
  }

  //Create the oauth.success request to Slack API
  const options = {
      uri: "https://slack.com/api/oauth.access",
      method: "GET",
      json: true,
      qs: {
          code: request.query.code,
          client_id: functions.config().slack.id,
          client_secret: functions.config().slack.secret
      }
  };

  //Execute request to Slack API
  rp(options)
    .then(function (slackResponse) {
      //Check the response value
      console.log("Repos: ", slackResponse);
      if (!slackResponse.ok) {
          console.error("The request was not ok: " + JSON.stringify(slackResponse));
          response.contentType('json').status(401).send({
            "Status": "Failure - No response from Slack API"
          });
          return;
      }

      //Add the entry to the database
      db.collection('installations').doc(slackResponse.team_id).set({
        token: slackResponse.access_token,
        team: slackResponse.team_id,
        webhook: {
            url: slackResponse.incoming_webhook.url,
            channel: slackResponse.incoming_webhook.channel_id
        }
      }).then(ref => {
        //Success!!!
        response.contentType('json').status(200).send({
          "Status": "Success"
        });
      });
    })
    .catch(function (err) {
      //Handle the error
      console.log("Error: ", err);
      response.contentType('json').status(401).send({
        "Status": "Failure - request to Slack API has failed"
      });
    });
});
