const functions = require('firebase-functions');
const firebase = require('firebase');
const rp = require('request-promise');
const express = require('express');
const app = express();
const engines = require("consolidate");
const bodyParser = require('body-parser');
//const methodOverride = require('method-override');

// // Routes initialization
// var indexRoutes = require('../public/routes/index');

// Middleware and quality of life usages
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('ejs',engines.ejs );
app.set('views','./views');
app.set('view engine','ejs');

// Requiring Routes
// app.use(indexRoutes);

// Slack Integrated Functions
const add = require('./add');
const remove = require('./remove');
const profile = require('./profile');
const hiFive = require('./hi-five');
const search = require('./search');
const tags = require('./tags');
const util = require('./util');
const oauth = require('./oauth');
const feedback = require('./feedback');

// Get a reference to the database service
var database = firebase.database();

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

const NOT_ACCEPTABLE = 406;
const UNAUTHORIZED = 401;
const OK = 200;
const VERIFICATION_TOKEN = 'n2UxTrT7vGYQCSPIXD2dp1th';

//var request = require("request");

//=========XPERTZ DASHBOARD FUNCTIONS===========

app.get('/', (req, res) => {
    res.render("dashboard");
});


exports.app = functions.https.onRequest(app);

//=========XPERTZ SLACK FUNCTIONS===========
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
    const user_id = payload.user.id;

    // Validations
    if (util.validateToken(token, res)) {
        if (type === "dialog_submission") {
            if (callback_id === "add_new_tag_dialog") {
                visitor.event("Dialog Actions", "Add new tag dialog submission").send();
                add.addNewTagDialog(payload, res);
            } else if (callback_id === "feedback_tag_dialog") {
                visitor.event("Dialog Actions", "Feedback dialog submission").send();
                feedback.feedbackSubmission(payload, res);
            }
        } else if (type === "dialog_cancellation") {
            visitor.event("Dialog Actions", "Add new tag dialog cancellation").send();
            add.dialogCancellation(payload, res);
        } else {
            // Interactive Message
            if (new String(payload.actions[0]["value"]).valueOf() === new String("cancel").valueOf()) {
                res.status(OK).send();
                util.cancelButtonIsPressed(response_url);
            } else if (callback_id === "add_tag") {
                add.addTagAction(payload, res);
            } else if (callback_id === "add_more_tags") {
                visitor.event("Actions", "Add More Tags action").send();
                switch (payload.actions[0]["name"]) {
                    case "add_more_tags_button":
                        add.checkAndFireAddCommandIsAvailable(team_id, user_id, token, res);
                        break;
                }
            } else if (callback_id === "remove_tag") {
                remove.removeTagAction(payload, res);
            } else if (callback_id === "remove_more_tags") {
                visitor.event("Actions", "Remove More Tags action").send();
                switch (payload.actions[0]["name"]) {
                    case "remove_more_tags_button":
                        remove.sendRemoveTagMessage(res);
                        break;
                }
            } else if (callback_id === "h5") {
                hiFive.hiFiveAction(payload, res);
            } else if (callback_id === "search_tag") {
                search.searchTagAction(payload, res);
            } else if (callback_id === "tags_list") {
                visitor.event("Actions", "Tags List action").send();
                tags.tagsSelectAction(payload, res);
            } else if (callback_id === "feedback_action") {
                visitor.event("Actions", "Feedback action").send();
                feedback.feedbackCommand(team_id, token, trigger_id, res);
            }
        }
    }
});

//==========MENU OPTIONS FUNCTION===========

/**
 *
 *
 *
 */
exports.menu_options = functions.https.onRequest((req, res) => {
    const payload = JSON.parse(req.body.payload);
    var token = payload.token;
    var user_id = payload.user.id;
    var team_id = payload.team.id;
    var enterprise_id = payload.team.enterprise_id;

    // Validations
    if (util.validateToken(token, res)) {
        const menuName = payload.name;

        if (menuName === 'team_tags_menu_button' || menuName === 'search_tag_menu_button') {
            if (menuName === 'team_tags_menu_button') {
                visitor.event("Menu Selection", "Team Tags menu").send();
            } else if (menuName === 'search_tag_menu_button') {
                visitor.event("Menu Selection", "Search menu").send();
            }
            var queryTextForTagsList = payload.value;
            tags.tagsListMenu(team_id, enterprise_id, queryTextForTagsList, res);
        } else if (menuName === "user_tags_menu_button") {
            visitor.event("Menu Selection", "User Tags menu").send();
            tags.userTagsMenu(team_id, user_id, enterprise_id, res);
        }
    }
});


//==========SLASH COMMAND FUNCTIONS==========

//Add tag command. For the response example see add.addCommand function comments.
exports.addTag = functions.https.onRequest((req, res) => {
    util.validateTeamAccess(team_id, res, hasAccess => {
        visitor.event("Slash command", "Add command").send();
        add.addCommand(req, res);
    });
});

/**
 * This command is the initial response when a user wants to remove a tag from their profile.
 */
exports.removeTag = functions.https.onRequest((req, res) => {
    util.validateTeamAccess(team_id, res, hasAccess => {
        visitor.event("Slash command", "Remove command").send();
        remove.removeCommand(req, res);
    });
});

// View Profile Command
exports.profile = functions.https.onRequest((req, res) => {
    util.validateTeamAccess(team_id, res, hasAccess => {
        visitor.event("Slash command", "Profile command").send();
        profile.profileCommand(req, res)
    });
});

// High-Five Command
exports.hi_five = functions.https.onRequest((req, res) => {
    util.validateTeamAccess(team_id, res, hasAccess => {
        visitor.event("Slash command", "High_Five command").send();
        hiFive.hiFiveCommand(req, res);
    });
});

// Search Command
exports.search = functions.https.onRequest((req, res) => {
    util.validateTeamAccess(team_id, res, hasAccess => {
        visitor.event("Slash command", "Search command").send();
        search.searchCommand(req, res);
    });
});

// View Tags Command
/**
 * Command returns a message containing the first 10 tags being used in the workspace
 * from which the request came from. An interactive button will be present to request the next 10 listed in alphabetic.
 */
exports.tags = functions.https.onRequest((req, res) => {
    util.validateTeamAccess(team_id, res, hasAccess => {
        visitor.event("Slash command", "Tags command").send();
        tags.tagsCommand(req, res);
    });
});

// Xpertz Command List
/**
 * This helper command returns a description of all the slash-commands Xpertz provides.
 */
exports.commands = functions.https.onRequest((req, res) => {
    visitor.event("Slash command", "Helper command").send();

    let slackRequest = req.body;
    let token = slackRequest.token;

    if (util.validateToken(token, res)) {
        // Validated
        res.contentType("json").status(OK).send({
            "text": "*Xpertz Command List* :scroll:",
            "response_type": "ephemeral",
            "attachments": [
                {
                    "callback_id": "profile_tag",
                    "color": "#FFFFFF",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "cancel_profile_button",
                            "text": "Close",
                            "type": "button",
                            "value": "cancel"
                        }
                    ]
                },
                { "text": "View your expertise tags or provide a username to view theirs:\n`/profile` _@username (optional)_" },
                { "text": "Add an expertise tag:\n`/add`" },
                { "text": "Remove an expertise tag:\n`/removetag`" },
                { "text": "View all tags used in this workspace or enterprise grid:\n`/tags`" },
                { "text": "Search for experts by tag:\n`/xpertz`" },
                {
                    "fallback": "Button to leave a feedback",
                    "callback_id": "feedback_action",
                    "text": "*We’d love your feedback* :raised_hands:",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "leave_feedback_button",
                            "text": "Feedback",
                            "type": "button",
                            "value": "feedback",
                            "style": "primary"
                        }
                    ]
                }
            ]
        });
    }
});


//Function to handle oauth redirect
exports.oauth_redirect = functions.https.onRequest((req, res) => {
    visitor.event("Oauth", "Add app to Slack").send();
    oauth.oauthRedirect(req, res);
});
