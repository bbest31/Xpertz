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
const feedback = require('./feedback');
const bot = require('./bot');
const presetTags = require('./preset_tags');

// Get a reference to the database service
var database = firebase.database();

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

const PASSCODE = "2465203142";
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


//========================================================
//==================XPERTZ FUNCTIONS======================
//========================================================


//==========XPERTZ EVENT SUBSCRIPTION=====================
exports.events_dev = functions.https.onRequest((req, res) => {

    // Get the JSON payload object
    let body = req.body;
    // Event API verification hook (used once).
    if (body.type === 'url_verification') {
        var challenge = body.challenge;
        res.contentType('json').status(OK).send({
            'challenge': challenge
        });
    } else {
        //Grab the attributes we want
        var type = body.event.type;
        console.log(type);
        if (util.validateRequest(req, res)) {
            if (type === 'grid_migration_finished') {
                // Workspace migrated to enterprise grid
                let teamId = body.team_id;
                let enterpriseId = body.event.enterprise_id;
                events.enterpriseMigration(teamId, enterpriseId);
            } else {
                res.status(OK).send();
            }
        }
    }
});


//==========ACTION BUTTON FUNCTION==========


exports.actions_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else {    //Get the JSON payload object
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
                } else if (callbackID === 'preset_tags') {
                    bot.presetTagActions(payload, res);
                }
            }
        }
    }
});

//==========MENU OPTIONS FUNCTION===========

/**
 *This export holds all the menu options for vaious select buttons in interactive messages.
 */
exports.menu_options_dev = functions.https.onRequest((req, res) => {
    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else {
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
                presetTags.generalPresets(res);
            }
        }
    }
});


//==========SLASH COMMAND FUNCTIONS==========

//Add tag command. For the response example see add.addCommand function comments.
exports.addTag_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else if (util.validateRequest(req, res)) {
        var id = util.checkForCorrectID(req)
        util.validateTeamAccess(id, res, hasAccess => {
            visitor.event('Slash command', 'Add command').send();
            add.addCommand(req, res);
        });
    }
});

/**
 * This command is the initial response when a user wants to remove a tag from their profile.
 */
exports.removeTag_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else if (util.validateRequest(req, res)) {
        var id = util.checkForCorrectID(req)
        util.validateTeamAccess(id, res, hasAccess => {
            visitor.event('Slash command', 'Remove command').send();
            remove.removeCommand(req, res);
        });
    }
});

// View Profile Command
exports.profile_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else if (util.validateRequest(req, res)) {
        var id = util.checkForCorrectID(req)
        util.validateTeamAccess(id, res, hasAccess => {
            visitor.event('Slash command', 'Profile command').send();
            profile.profileCommand(req, res)
        });
    }
});

// High-Five Command
exports.hi_five_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else if (util.validateRequest(req, res)) {
        var id = util.checkForCorrectID(req)
        util.validateTeamAccess(id, res, hasAccess => {
            visitor.event('Slash command', 'High_Five command').send();
            hiFive.hiFiveCommand(req, res);
        });
    }
});

// Search Command
exports.search_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else if (util.validateRequest(req, res)) {
        var id = util.checkForCorrectID(req)
        util.validateTeamAccess(id, res, hasAccess => {
            visitor.event('Slash command', 'Search command').send();
            search.searchCommand(req, res);
        });
    }
});

// View Tags Command
/**
 * Command returns a message containing the first 10 tags being used in the workspace
 * from which the request came from. An interactive button will be present to request the next 10 listed in alphabetic.
 */
exports.tags_dev = functions.https.onRequest((req, res) => {

    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
    } else if (util.validateRequest(req, res)) {
        var id = util.checkForCorrectID(req)
        util.validateTeamAccess(id, res, hasAccess => {
            visitor.event('Slash command', 'Tags command').send();
            tags.tagsCommand(req, res, id);
        });
    }
});

// Xpertz Command List
/**
 * This helper command returns a description of all the slash-commands Xpertz provides.
 */
exports.commands_dev = functions.https.onRequest((req, res) => {
    visitor.event('Slash command', 'Helper command').send();
    if (req.body.heartbeat) {
        util.heartbeatResponse(res);
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
                { 'text': 'View your expertise tags or provide a username to view theirs:\n`/xpertz-profile` _@username (optional)_' },
                { 'text': 'Add an expertise tag:\n`/xpertz-add`' },
                { 'text': 'Remove an expertise tag:\n`/xpertz-removetag`' },
                { 'text': 'Validate the help of your teammates by giving them high-fives with:\n`/xpertz-hi5` _@username_ ' },
                { 'text': 'View all tags used in this workspace or enterprise grid:\n`/xpertz-tagslist`' },
                { 'text': 'Search for experts by tag:\n`/xpertz-search`' },
            ]
        });
    }
});


//Function to handle oauth redirect
exports.oauth_redirect_dev = functions.https.onRequest((req, res) => {
    const oauth = require('./oauth');
    visitor.event('Oauth', 'Add app to Slack').send();
    oauth.oauthRedirect(req, res);
});


exports.transferdb = functions.https.onRequest((req, res) => {


    var installationsRef = 'installations/';
    database.ref(installationsRef).once('value')
        .then(snapshot => {

            snapshot.forEach(function (data) {
                database.ref(installationsRef).push(data.val());
                database.ref(installationsRef + '/' + data.key).remove();
            });



            res.contentType('json').status(OK).send({ 'success': true });
            return;
        })
        .catch({});


    var tagsRef = 'tags/';
    database.ref(tagsRef).once('value')
        .then(snapshot => {

            snapshot.forEach(function (data) {
                var newRef = database.ref(tagsRef).push({ "team": data.key });
                database.ref(tagsRef + '/' + data.key).remove();

                var tags = data.val()["tags"];
                console.log(JSON.stringify(tags));
                for (const [key, tag] of Object.entries(tags)) {
                    database.ref(tagsRef + '/' + newRef.key + '/tags').push(tag);
                }
            });

            res.contentType('json').status(OK).send({ 'success': true });
            return;
        })
        .catch({});


    var usersRef = 'users/';
    database.ref(usersRef).once('value')
        .then(snapshot => {

            snapshot.forEach(function (data) {
                var newData = data.val();
                newData["email"] = data.key;
                database.ref(usersRef).push(newData);
                database.ref(usersRef + '/' + data.key).remove();
            });



            res.contentType('json').status(OK).send({ 'success': true });
            return;
        })
        .catch({});



    var workspacesRef = 'workspaces/';
    database.ref(workspacesRef).once('value')
        .then(snapshot => {

            snapshot.forEach(function (data) {
                var newTeamRef = database.ref(workspacesRef).push({ "team": data.key });
                database.ref(workspacesRef + '/' + data.key).remove();

                var tags = data.val()["tags"];
                console.log(JSON.stringify(tags));
                for (const [keyTag, tag] of Object.entries(tags)) {
                    var newTagRef = database.ref(workspacesRef + '/' + newTeamRef.key + '/tags').push({ "tag": keyTag });

                    var users = tag["users"];
                    for (const [keyUser, user] of Object.entries(users)) {
                        database.ref(workspacesRef + '/' + newTeamRef.key + '/tags/' + newTagRef.key + '/users').push(user);
                    }
                }

                var users = data.val()["users"];
                for (const [keyUser, user] of Object.entries(users)) {
                    var newUserRef = database.ref(workspacesRef + '/' + newTeamRef.key + '/users').push({ "user_id": keyUser, "active": user["active"] });

                    var tags = user["tags"];
                    for (const [keyTag, tag] of Object.entries(tags)) {
                        database.ref(workspacesRef + '/' + newTeamRef.key + '/users/' + newUserRef.key + '/tags').push(tag);
                    }
                }
            });

            res.contentType('json').status(OK).send({ 'success': true });
            return;
        })
        .catch({});






});

/**
 * Updates the global counts in the database.
 */
exports.globals_dev = functions.https.onRequest((req, res) => {
    if (req.body.passcode === PASSCODE) {
        util.updateGlobals(res);
    } else {
        res.status(UNAUTHORIZED).send();
    }
});



