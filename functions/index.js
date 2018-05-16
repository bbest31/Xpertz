const admin = require('firebase-admin');
const functions = require('firebase-functions');
const firebase = require('firebase');
var rp = require('request-promise');
var request = require('request');

// admin.initializeApp(functions.config().firebase);
// var db = admin.firestore();
var config = {
    apiKey: "AIzaSyDm6i6hnoJbFO-cPb_6gTV9EmE1g5WqexA",
    authDomain: "xpertz-178c0.firebaseapp.com",
    databaseURL: "https://xpertz-178c0.firebaseio.com/"
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();

const NOT_ACCEPTABLE = 406;
const UNAUTHORIZED = 401;
const OK = 200;
const VERIFICATION_TOKEN = 'n2UxTrT7vGYQCSPIXD2dp1th';

//var request = require("request");

//=========XPERTZ FUNCTIONS===========
/*
This file contains all the functions called from Slack using HTTPS.
To deploy a single firebase function:
ex. firebase deploy --only functions:func1,functions:func2
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
    const type = payload.type;
    const callback_id = payload.callback_id;
    const response_url = payload.response_url;
    const token = payload.token;
    const trigger_id = payload.trigger_id;
    const team_id = payload.team.id;

    // Validations
    if (!validateToken(token)) {
        res.sendStatus(UNAUTHORIZED);
    } else {
        if (type === "dialog_submission") {
            if (callback_id === "add_new_tag_dialog") {
                const tag_title = payload.submission.tag_title;
                
                database.ref('tags/' + team_id + '/' + tag_title).once('value').then(snapshot => {
                    if (!snapshot.val()) {
                        database.ref('tags/' + team_id + "/" + tag_title).set({
                            tag_title,
                            value : tag_title.toLowerCase(),
                            count: 0
                        }).then(ref => {
                            //Success!!!
                            res.status(200).send();

                            retrieveAccessToken(team_id, token => {
                                if (token) {
                                    let options = {
                                        method: "POST",
                                        uri: "https://slack.com/api/chat.postEphemeral",
                                        headers: {
                                            'Content-Type': 'application/json; charset=utf-8',
                                            'Authorization': 'Bearer ' + token
                                        },
                                        body: {
                                            "response_type": "ephemeral",
                                            "replace_original": true,
                                            "text": "*Expertise tag was successfully added* :raised_hands:",
                                            "channel": payload.channel.id,
                                            "user": payload.user.id,
                                            "as_user": false,
                                            "attachments": [
                                                {
                                                    "fallback": "Confirmation of successful tag addition",
                                                    "callback_id": "create_new_tag_success",
                                                    "text": "Tag has been created successfully",
                                                    "color": "#00D68F",
                                                    "attachment_type": "default",
                                                },
                                                {
                                                    "fallback": "Interactive menu to add a workspace tag or create a new one",
                                                    "callback_id": "add_tag",
                                                    "text": "Select a tag to add or create a new one!",
                                                    "color": "#3AA3E3",
                                                    "attachment_type": "default",
                                                    "actions": [
                                                        {
                                                            "name": "team_tags_short_listing",
                                                            "text": "Pick a tag...",
                                                            "type": "select",
                                                            "data_source": "external",
                                                            "min_query_length": 3
                                                        },
                                                        {
                                                            "name": "add_tag_btn",
                                                            "text": "Add",
                                                            "type": "button",
                                                            "value": "add",
                                                            "style": "primary"
                                                        },
                                                        {
                                                            "name": "create_tag_btn",
                                                            "text": "Create New",
                                                            "type": "button",
                                                            "value": "create"
                                                        },
                                                        {
                                                            "name": "cancel_add_btn",
                                                            "text": "Cancel",
                                                            "type": "button",
                                                            "value": "cancel"
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        json: true
                                    }

                                    makeRequestWithOptions(options);
                                }
                            });
                            return;
                        }).catch(err => {
                            if (err) console.log(err);
                            res.status(200).send();
                            retrieveAccessToken(team_id, token => {
                                if (token) {
                                    failedToCreateTag(token, payload.channel.id, payload.user.id, "Tag has failed to be created");
                                }
                            });
                            return;
                        });
                    } else {
                        res.status(200).send();
                        retrieveAccessToken(team_id, token => {
                            if (token) {
                                failedToCreateTag(token, payload.channel.id, payload.user.id, "Tag already exists");
                            }
                        });
                    }
                    return;
                }).catch(err => {
                    if (err) console.log(err);
                    res.status(200).send();
                    retrieveAccessToken(team_id, token => {
                        if (token) {
                            failedToCreateTag(token, payload.channel.id, payload.user.id, "Tag has failed to be created");
                        }
                    });
                    return;
                });
            }
        } else if (type === "dialog_cancellation") {
            res.status(200).send();
            retrieveAccessToken(team_id, token => {
                if (token) {
                    let options = {
                        method: "POST",
                        uri: "https://slack.com/api/chat.postEphemeral",
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Authorization': 'Bearer ' + token
                        },
                        body: {
                            "response_type": "ephemeral",
                            "replace_original": true,
                            "text": "*Expertise tag was successfully added* :raised_hands:",
                            "channel": payload.channel.id,
                            "user": payload.user.id,
                            "as_user": false,
                            "attachments": [
                                {
                                    "fallback": "Interactive menu to add a workspace tag or create a new one",
                                    "callback_id": "add_tag",
                                    "text": "Select a tag to add or create a new one!",
                                    "color": "#3AA3E3",
                                    "attachment_type": "default",
                                    "actions": [
                                        {
                                            "name": "team_tags_short_listing",
                                            "text": "Pick a tag...",
                                            "type": "select",
                                            "data_source": "external",
                                            "min_query_length": 3
                                        },
                                        {
                                            "name": "add_tag_btn",
                                            "text": "Add",
                                            "type": "button",
                                            "value": "add",
                                            "style": "primary"
                                        },
                                        {
                                            "name": "create_tag_btn",
                                            "text": "Create New",
                                            "type": "button",
                                            "value": "create"
                                        },
                                        {
                                            "name": "cancel_add_btn",
                                            "text": "Cancel",
                                            "type": "button",
                                            "value": "cancel"
                                        }
                                    ]
                                }
                            ]
                        },
                        json: true
                    }

                    makeRequestWithOptions(options);
                }
            });
        } else {
            // Proceed
            if (new String(payload.actions[0]["value"]).valueOf() === new String("cancel").valueOf()) {
                cancelButtonIsPressed(response_url, success => {
                    if (success) {
                        res.sendStatus(OK);
                    }
                    return;
                });
            } else if (callback_id === "add_tag") {
                //Handle button response from add tag workflow
                switch (payload.actions[0]["value"]) {
                    case "create":
                        cancelButtonIsPressed(response_url, success => {
                            openDialogToAddNewTag(team_id, trigger_id, success => {
                                res.status(200).send();
                                return;
                            });
                            return;
                        });
                        break;
                    case "add":
                        res.sendStatus(OK);
                        break;
                }
            }
        }
    }
});

//POSSIBLE USAGE OF cancelButtonIsPressed FUNCTION:
//
//   1. This is one way to use the cancel function with the callback block, if something needs to be cleaned up in the database let's say.
//      cancelButtonIsPressed(payload.response_url, success => {
//        console.log("SUCCESS: ", success);
//        return;
//      });
//
//   2. This is simpler way to use cancel function, if callback is unnecessary
//      cancelButtonIsPressed(payload.response_url);
function cancelButtonIsPressed(response_url, success) {

    let options = {
        method: "POST",
        uri: response_url,
        body: { "delete_original": true },
        json: true
    }

    rp(options).
        then(response => {
            if (success) success(true);
            return;
        }).
        catch(err => {
            if (err) console.log(err);
            if (success) success(false);
            return;
        });
}

function openDialogToAddNewTag(team_id, trigger_id, success) {
    retrieveAccessToken(team_id, token => {
        if (!token) {
            success(false);
        } else {
            let options = {
                method: "POST",
                uri: "https://slack.com/api/dialog.open",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': 'Bearer ' + token
                },
                body: {
                    "trigger_id": trigger_id,
                    "dialog": {
                        "callback_id": "add_new_tag_dialog",
                        "title": "Create New Tag",
                        "submit_label": "Create",
                        "notify_on_cancel": true,
                        "elements": [
                            {
                                "type": "text",
                                "label": "Tag Title",
                                "name": "tag_title",
                                "placeholder": "Enter tag title"
                            }
                        ]
                    }
                },
                json: true
            }

            rp(options).
                then(response => {
                    if (success) success(true);
                    return;
                }).
                catch(err => {
                    if (err) console.log(err);
                    if (success) success(false);
                    return;
                });
        }
    });
}

//==========MENU OPTIONS FUNCTION===========

/**
 *
 *
 * Example Request
 *
 * {
    "name": "bugs_list",
    "value": "bot",
    "callback_id": "select_remote_1234",
    "type": "interactive_message",
    "team": {
        "id": "T012AB0A1",
        "domain": "pocket-calculator"
    },
    "channel": {
        "id": "C012AB3CD",
        "name": "general"
    },
    "user": {
        "id": "U012A1BCJ",
        "name": "bugcatcher"
    },
    "action_ts": "1481670445.010908",
    "message_ts": "1481670439.000007",
    "attachment_id": "1",
    "token": "verification_token_string"
}
 Example Response
 {
      "options": [
        {
            "text": "Unexpected sentience",
            "value": "AI-2323"
        },
        {
            "text": "Bot biased toward other bots",
            "value": "SUPPORT-42"
        },
        {
            "text": "Bot broke my toaster",
            "value": "IOT-75"
        }
    ]
 }
 */
exports.menu_options = functions.https.onRequest((req, res) => {
    const payload = JSON.parse(req.body.payload);
    var token = payload.token;
    // Validations
    if (!token) {
        res.contentType('json').status(200).send({
            "text": "_Incorrect request!_"
        });

    } else if (!validateToken(token)) {
        res.sendStatus(UNAUTHORIZED);

    } else {
        const menuName = payload.name;

        if (menuName === 'team_tags_short_listing') {
            var value = payload.value;
            var team_id = payload.team.id;

            // read workspace tags and add to response
            var teamTagsRef = database.ref('tags/' + team_id).once('value').then(function (snapshot) {
                return;
            });
            var tags = {};
            res.contentType('json').status(OK).send({
                "options": [
                    {
                        "text": "Microservices",
                        "value": "microservices"
                    },
                    {
                        "text": "Python",
                        "value": "python"
                    }
                ]
            });

            // Get collection of tags from team

            // Create JSON response.
            return;
        }

    }
});
//==========SLASH COMMAND FUNCTIONS==========


/**Add Tag Command
 * This function will initiate the add expertise tag workflow to the user if they are validated.
 *
 * Example Response Body
 *
 * body:  { token: 'th15i5AnAc355T0K3N',
  team_id: 'ABCDEFGHI',
  team_domain: 'xpertzdev',
  channel_id: 'CAAFC3RDJ',
  channel_name: 'general',
  user_id: 'UAJKE3ULE',
  user_name: 'bakurov.illya',
  command: '/add',
  text: '',
  response_url: 'https://hooks.slack.com/commands/ABCDEFGHI/359350492293/th15i5AnAc355T0K3N',
  trigger_id: '359113754147.350752158706.334e59ad4556e82cbea59be1f7b0b70f' }
 */
exports.addTag = functions.https.onRequest((req, res) => {
    var slackRequest = req.body;
    var token = req.body.token;

    //Validations
    if (!token) {
        res.contentType('json').status(200).send({
            "text": "_Incorrect request!_"
        });
    } else if (!validateToken(token)) {
        res.sendStatus(UNAUTHORIZED);
    } else {
        // Valid request so we proceed...

        // affirmation response
        res.contentType('json').status(200).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Add an expertise tag* :brain:",
            "attachments": [
                {
                    "fallback": "Interactive menu to add a workspace tag or create a new one",
                    "callback_id": "add_tag",
                    "text": "Select a tag to add or create a new one!",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "team_tags_short_listing",
                            "text": "Pick a tag...",
                            "type": "select",
                            "data_source": "external",
                            "min_query_length": 3
                        },
                        {
                            "name": "add_tag_btn",
                            "text": "Add",
                            "type": "button",
                            "value": "add",
                            "style": "primary"
                        },
                        {
                            "name": "create_tag_btn",
                            "text": "Create New",
                            "type": "button",
                            "value": "create"
                        },
                        {
                            "name": "cancel_add_btn",
                            "text": "Cancel",
                            "type": "button",
                            "value": "cancel"
                        }
                    ]
                }
            ]
        });
    }
});

/**
 * This command is the initial response when a user wants to remove a tag from their profile.
 */
exports.removeTag = functions.https.onRequest((req, res) => {
    var slackRequest = req.body;
    var token = req.body.token;

    //Validations
    if (!token) {
        res.contentType('json').status(200).send({
            "text": "_Incorrect request!_"
        });

    } else if (!validateToken(token)) {
        res.sendStatus(UNAUTHORIZED);

    } else {

        // Validated


        res.contentType("json").status(200).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Remove a tag* :x:",
            "attachments": [
                {
                    "fallback": "Interactive menu to remove a tag from user profile",
                    "text": "Choose a tag to remove",
                    "callback_id": "remove_tag",
                    "color": "#F21111",
                    "actions": [
                        {
                            "name": "my_tags_list",
                            "text": "Pick a tag...",
                            "type": "select",
                            "data_source": "external",

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
                            "value": "cancel",
                        }
                    ]
                }
            ]
        });

    }


});

// View Profile Command
exports.profile = functions.https.onRequest((req, res) => {

    res.contentType('json').status(200).send({
        "text": "Invoked the profile command"
    });
});

// Hi-Five Command
exports.hi_five = functions.https.onRequest((req, res) => {
    res.contentType('json').status(200).send({
        "text": "Invoked the hi-five command"
    });

});

// Search Command
exports.search = functions.https.onRequest((req, res) => {
    res.contentType('json').status(200).send({
        "text": "Invoked the search command"
    });
});

// View Tags Command
/**
 * Command returns a message containing the first 10 tags being used in the workspace
 * from which the request came from. An interactive button will be present to request the next 10 listed in alphabetic.
 */
exports.tags = functions.https.onRequest((req, res) => {
    res.contentType('json').status(200).send({
        "text": "Invoked the tag list command"
    });
});

// Xpertz Command List
/**
 * This helper command returns a description of all the slash-commands Xpertz provides.
 */
exports.commands = functions.https.onRequest((req, res) => {
    let slackRequest = req.body;
    let token = slackRequest.token;
    if (!token) {
        res.contentType('json').status(200).send({
            "text": "_Incorrect request!_"
        });
    } else if (!validateToken(token)) {
        res.sendStatus(UNAUTHORIZED);
    } else {

        // Validated

        res.contentType("json").status(200).send({
            "text": "*Xpertz Command List* :scroll:",
            "response_type": "ephemeral",
            "attachments": [
                { "text": "View your expertise tags or provide a username to view theirs:\n`/profile` _@username (optional)_" },
                { "text": "Add an expertise tag:\n`/add`" },
                { "text": "Remove an expertise tag:\n`/removetag`" },
                { "text": "View all tags used in this workspace or enterprise grid:\n`/tags`" },
                { "text": "Search for experts by tag:\n`/search`" }
            ]
        });
    }

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
        .then(slackResponse => {
            //Check the response value
            console.log("Repos: ", slackResponse);
            if (!slackResponse.ok) {
                console.error("The request was not ok: " + JSON.stringify(slackResponse));
                response.contentType('json').status(401).send({
                    "Status": "Failure - No response from Slack API"
                });
                return;
            }
            saveWorkspaceAsANewInstallation(slackResponse, response);
            return;
        })
        .catch(err => {
            //Handle the error
            console.log("Error: ", err);
            response.contentType('json').status(401).send({
                "Status": "Failure - request to Slack API has failed"
            });
            return;
        });
});

function saveWorkspaceAsANewInstallation(slackResponse, response) {
    //Add the entry to the database
    // db.collection('installations').doc(slackResponse.team_id).set({
    database.ref('installations/' + slackResponse.team_id).set({
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
        return;
    }).catch(err => {
        console.log('Error setting document', err);
        response.contentType('json').status(401).send({
            "Failure": "Failed to save data in the DB"
        });
        return;
    });
}


/**
 * Returns the team document of the requesting workspace by querying the installations document in the database.
 * @param {string} team_id
 */
function retrieveTeamDoc(team_id, res) {
    // var teamDoc = db.collection('installations').doc(team_id).get()
    // .then(doc => {
    //     console.log('doc in validateTeam', doc);
    //     if (!doc.exists) {
    //         //No team with that id found
    //         res(false);
    //     } else {
    //         // Existing document with that team id
    //         res(true);
    //     }
    //     return;
    // })
    // .catch(err => {
    //     console.log('Error getting document', err);
    //     res(false);
    //     return;
    // });
    database.ref('installations/' + team_id).once('value').then(snapshot => {
        if (!snapshot.val()) {
            //No team with that id found
            res(false);
        } else {
            // Existing document with that team id
            res(true);
        }
        return;
    }).catch(err => {
        console.log('Error getting document', err);
        res(false);
        return;
    });
}

/**
 * Returns the team document of the requesting workspace by querying the installations document in the database.
 * @param {string} team_id
 */
function retrieveAccessToken(team_id, res) {
    // var teamDoc = db.collection('installations').doc(team_id).get()
    // .then(doc => {
    //     console.log('doc in validateTeam', doc);
    //     if (!doc.exists) {
    //         //No team with that id found
    //         res(doc.);
    //     } else {
    //         // Existing document with that team id
    //         res(true);
    //     }
    //     return;
    // })
    // .catch(err => {
    //     console.log('Error getting document', err);
    //     res(false);
    //     return;
    // });
    database.ref('installations/' + team_id).once('value').then(snapshot => {
        if (!snapshot.val()) {
            //No team with that id found
            res(false);
        } else {
            // Existing document with that team id
            res(snapshot.val().token);
        }
        return;
    }).catch(err => {
        console.log('Error getting document', err);
        res(false);
        return;
    });
}

/**
 * Validates the token from the requesting body.
 * @param {string} token
 */
function validateToken(token) {
    if (token === VERIFICATION_TOKEN) {
        return true;
    } else {
        return false;
    }
}

function makeRequestWithOptions(options, success, failure) {
    rp(options).
        then(response => {
            if (response) console.log(response);
            if (success) success(response);
            return;
        }).
        catch(err => {
            if (err) console.log(err);
            if (failure) failure(err);
            return;
        });
}

function failedToCreateTag(token, channel_id, user_id, reason) {
    let options = {
        method: "POST",
        uri: "https://slack.com/api/chat.postEphemeral",
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + token
        },
        body: {
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Expertise tag was successfully added* :raised_hands:",
            "channel": channel_id,
            "user": user_id,
            "as_user": false,
            "attachments": [
                {
                    "fallback": "Confirmation of failed tag addition",
                    "callback_id": "create_new_tag_success",
                    "text": reason,
                    "color": "#C44236",
                    "attachment_type": "default",
                },
                {
                    "fallback": "Interactive menu to add a workspace tag or create a new one",
                    "callback_id": "add_tag",
                    "text": "Select a tag to add or create a new one!",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "team_tags_short_listing",
                            "text": "Pick a tag...",
                            "type": "select",
                            "data_source": "external",
                            "min_query_length": 3
                        },
                        {
                            "name": "add_tag_btn",
                            "text": "Add",
                            "type": "button",
                            "value": "add",
                            "style": "primary"
                        },
                        {
                            "name": "create_tag_btn",
                            "text": "Create New",
                            "type": "button",
                            "value": "create"
                        },
                        {
                            "name": "cancel_add_btn",
                            "text": "Cancel",
                            "type": "button",
                            "value": "cancel"
                        }
                    ]
                }
            ]
        },
        json: true
    }

    makeRequestWithOptions(options);
}
