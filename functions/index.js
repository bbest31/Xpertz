const functions = require('firebase-functions');
const firebase = require('firebase');
const rp = require('request-promise');
const request = require('request');

// Slack Integrated Functions
const add = require('./add');
const remove = require('./remove');
const profile = require('./profile');
const hiFive = require('./hi-five');
const search = require('./search');
const tags = require('./tags');
const util = require('./util');
const events = require('./events');
const oauth = require('./oauth');
const feedback = require('./feedback');
const bot = require('./bot');

// Get a reference to the database service
var database = firebase.database();

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

const NOT_ACCEPTABLE = 406;
const UNAUTHORIZED = 401;
const OK = 200;


//var request = require('request');

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
//         'https://hooks.slack.com/services/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',
//         {json: {text: `New sign up from ${email} !!`}}
//     );
// });

//==========XPERTZ EVENT SUBSCRIPTION=====================
exports.events = functions.https.onRequest((req, res) => {

    // Get the JSON payload object
    let body = req.body;

    //Grab the attributes we want
    var type = body.type;


    if (util.validateRequest(req, res)) {
        // Event API verification hook (used once).
        if (type === 'url_verification') {
            var challenge = body.challenge;
            res.contentType('json').status(OK).send({
                'challenge': challenge
            });
            // New user joined team.
        } else if (type === 'team_join') {
            let user = body.user;
            events.teamJoin(user, res);
        } else if (type === 'user_change') {
            let user = body.user;
            events.userChange(user, res);
        } else {
            res.status(OK).send();
        }
    }
});


//==========ACTION BUTTON FUNCTION==========

exports.actions = functions.https.onRequest((req, res) => {
    //Get the JSON payload object
    const payload = JSON.parse(req.body.payload);
    //Grab the attributes we want
    const type = payload.type;
    const callbackID = payload.callback_id;
    const responseURL = payload.response_url;
    const triggerID = payload.trigger_id;
    const teamID = payload.team.id;
    const userID = payload.user.id;
    const enterpriseID = payload.team.enterprise_id;


    // Validations
    if (util.validateRequest(req, res)) {
        if (type === 'dialog_submission') {
            if (callbackID === 'add_new_tag_dialog') {
                visitor.event('Dialog Actions', 'Add new tag dialog submission').send();
                add.addNewTagDialog(payload, res);
            } else if (callbackID === 'feedback_tag_dialog') {
                visitor.event('Dialog Actions', 'Feedback dialog submission').send();
                feedback.feedbackSubmission(payload, res);
            }
        } else if (type === 'dialog_cancellation') {
            visitor.event('Dialog Actions', 'Add new tag dialog cancellation').send();
            add.dialogCancellation(payload, res);
        } else {
            // Interactive Message
            if (new String(payload.actions[0]['value']).valueOf() === new String('cancel').valueOf()) {
                res.status(OK).send();
                util.cancelButtonIsPressed(responseURL);
            } else if (callbackID === 'add_tag') {
                add.addTagAction(payload, res);
            } else if (callbackID === 'add_more_tags') {
                visitor.event('Actions', 'Add More Tags action').send();
                switch (payload.actions[0]['name']) {
                    case 'add_more_tags_button':
                        add.checkAndFireAddCommandIsAvailable(teamID, userID, enterpriseID, req, res);
                        break;
                }
            } else if (callbackID === 'remove_tag') {
                remove.removeTagAction(payload, res);
            } else if (callbackID === 'remove_more_tags') {
                visitor.event('Actions', 'Remove More Tags action').send();
                switch (payload.actions[0]['name']) {
                    case 'remove_more_tags_button':
                        remove.sendRemoveTagMessage(res);
                        break;
                }
            } else if (callbackID === 'h5') {
                hiFive.hiFiveAction(payload, res);
            } else if (callbackID === 'search_tag') {
                search.searchTagAction(payload, res);
            } else if (callbackID === 'tags_list') {
                visitor.event('Actions', 'Tags List action').send();
                tags.tagsSelectAction(payload, res);
            } else if (callbackID === 'feedback_action') {
                visitor.event('Actions', 'Feedback action').send();
                feedback.feedbackCommand(teamID, triggerID, res);
            } else if (callbackID === 'preset_tags') {
                bot.presetTagActions(payload, res);
            }
        }
    }
});

//==========MENU OPTIONS FUNCTION===========

/**
 *This export holds all the menu options for vaious select buttons in interactive messages.
 */
exports.menu_options = functions.https.onRequest((req, res) => {
    const payload = JSON.parse(req.body.payload);
    var userID = payload.user.id;
    var teamID = payload.team.id;
    var enterpriseID = payload.team.enterprise_id;

    // Validations
    if (util.validateRequest(req, res)) {
        const menuName = payload.name;

        if (menuName === 'team_tags_menu_button' || menuName === 'search_tag_menu_button') {
            if (menuName === 'team_tags_menu_button') {
                visitor.event('Menu Selection', 'Team Tags menu').send();
            } else if (menuName === 'search_tag_menu_button') {
                visitor.event('Menu Selection', 'Search menu').send();
            }
            var queryTextForTagsList = payload.value;
            tags.tagsListMenu(teamID, enterpriseID, queryTextForTagsList, res);
        } else if (menuName === 'user_tags_menu_button') {
            visitor.event('Menu Selection', 'User Tags menu').send();
            tags.userTagsMenu(teamID, userID, enterpriseID, res);
        } else if (menuName === 'preset_tags_menu_button') {
            //TODO
        }
    }
});


//==========SLASH COMMAND FUNCTIONS==========

//Add tag command. For the response example see add.addCommand function comments.
exports.addTag = functions.https.onRequest((req, res) => {
    var teamID = req.body.team_id;
    util.validateTeamAccess(teamID, res, hasAccess => {
        visitor.event('Slash command', 'Add command').send();
        add.addCommand(req, res);
    });
});

/**
 * This command is the initial response when a user wants to remove a tag from their profile.
 */
exports.removeTag = functions.https.onRequest((req, res) => {
    var teamID = req.body.team_id;
    util.validateTeamAccess(teamID, res, hasAccess => {
        visitor.event('Slash command', 'Remove command').send();
        remove.removeCommand(req, res);
    });
});

// View Profile Command
exports.profile = functions.https.onRequest((req, res) => {
    var teamID = req.body.team_id;
    util.validateTeamAccess(teamID, res, hasAccess => {
        visitor.event('Slash command', 'Profile command').send();
        profile.profileCommand(req, res)
    });
});

// High-Five Command
exports.hi_five = functions.https.onRequest((req, res) => {
    var teamID = req.body.team_id;
    util.validateTeamAccess(teamID, res, hasAccess => {
        visitor.event('Slash command', 'High_Five command').send();
        hiFive.hiFiveCommand(req, res);
    });
});

// Search Command
exports.search = functions.https.onRequest((req, res) => {
    var teamID = req.body.team_id;
    util.validateTeamAccess(teamID, res, hasAccess => {
        visitor.event('Slash command', 'Search command').send();
        search.searchCommand(req, res);
    });
});

// View Tags Command
/**
 * Command returns a message containing the first 10 tags being used in the workspace
 * from which the request came from. An interactive button will be present to request the next 10 listed in alphabetic.
 */
exports.tags = functions.https.onRequest((req, res) => {
    var teamID = req.body.team_id;
    util.validateTeamAccess(teamID, res, hasAccess => {
        visitor.event('Slash command', 'Tags command').send();
        tags.tagsCommand(req, res);
    });
});

// Xpertz Command List
/**
 * This helper command returns a description of all the slash-commands Xpertz provides.
 */
exports.commands = functions.https.onRequest((req, res) => {
    visitor.event('Slash command', 'Helper command').send();
    if(req.body.heartbeat){
        res.contentType('json').status(OK).send({
            'text':'Received Heartbeat'
        });
    }
    else if (util.validateRequest(req, res)) {
        // Validated
        res.contentType('json').status(OK).send({
            'text': '*Xpertz Command List* :scroll:',
            'response_type': 'ephemeral',
            'attachments': [
                {
                    'callback_id': 'profile_tag',
                    'color': '#FFFFFF',
                    'attachment_type': 'default',
                    'actions': [
                        {
                            'name': 'cancel_profile_button',
                            'text': 'Close',
                            'type': 'button',
                            'value': 'cancel'
                        }
                    ]
                },
                { 'text': 'View your expertise tags or provide a username to view theirs:\n`/profile` _@username (optional)_' },
                { 'text': 'Add an expertise tag:\n`/add`' },
                { 'text': 'Remove an expertise tag:\n`/removetag`' },
                { 'text': 'View all tags used in this workspace or enterprise grid:\n`/tags`' },
                { 'text': 'Search for experts by tag:\n`/xpertz`' },
                {
                    'fallback': 'Button to leave a feedback',
                    'callback_id': 'feedback_action',
                    'text': '*We’d love your feedback* :raised_hands:',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'actions': [
                        {
                            'name': 'leave_feedback_button',
                            'text': 'Feedback',
                            'type': 'button',
                            'value': 'feedback',
                            'style': 'primary'
                        }
                    ]
                }
            ]
        });
    }
});


//Function to handle oauth redirect
exports.oauth_redirect = functions.https.onRequest((req, res) => {
    visitor.event('Oauth', 'Add app to Slack').send();
    oauth.oauthRedirect(req, res);
});

// exports.test_endpoint = functions.https.onRequest((req, res) => {
//     let body = req.body;
//     let id = body.team_id;
//     let token = body.token;
//     if (token === "XpertzZtrepx") {
//         bot.presetTagOptions(id);
//     }

//     // res.status(OK).send();
// });
