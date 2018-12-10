const util = require('./util');
const rp = require('request-promise');
const firebase = require('firebase');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

// Get a reference to the database service
const database = firebase.database();

const OK = 200;

const MAX_TAGS = 15;
// const MAX_USERS = 15;

module.exports = {

    /**Add Tag Command
     * This function will initiate the add expertise tag workflow to the user if they are validated.
     *
     * Example Response Body
     *
           ******* ENTERPRISE: ******
           { token: 'n2UxTrT7vGYQCSPIXD2dp1th',
            team_id: 'TB4R9R998',
            team_domain: 'testing-xpertz',
            channel_id: 'CB44RPD5E',
            channel_name: 'general',
            user_id: 'WB4G7PSBG',
            user_name: 'primary-owner',
            command: '/add',
            text: '',
            enterprise_id: 'EB4G7PKGE',
            enterprise_name: 'ELPS Xpertz',
            response_url: 'https://hooks.slack.com/commands/TB4R9R998/378866597600/tqgLJcmre6JIIwKIL5V2icgi',
            trigger_id: '379565085378.378859859314.02369bdf79ece5af2f8a5a1419d021c7' }
  
          ****** REGULAR: ******
          { token: 'n2UxTrT7vGYQCSPIXD2dp1th',
            team_id: 'TAAN44NLS',
            team_domain: 'xpertzdev',
            channel_id: 'DAHFVDG6Q',
            channel_name: 'directmessage',
            user_id: 'UAJKE3ULE',
            user_name: 'bakurov.illya',
            command: '/add',
            text: '',
            response_url: 'https://hooks.slack.com/commands/TAAN44NLS/379565572882/Yokp3KlyS2eFoXKouOoTvIF0',
            trigger_id: '379565572946.350752158706.ab321bbdd934febcd844dfe7e53a9a0e' }
     */
    addCommand: function (req, res) {
        var userID = req.body.user_id;
        var teamID = req.body.team_id;
        var enterpriseID = req.body.enterprise_id;

        this.checkAndFireAddCommandIsAvailable(teamID, userID, enterpriseID, req, res);
    },

    /**
     * Checks to see if the user has reached the limit on expertise. If not then sends the initial interactive message to start the add tag workflow.
     * @param {*} teamID 
     * @param {*} userID 
     * @param {*} enterpiseID 
     * @param {*} req 
     * @param {*} res 
     */
    checkAndFireAddCommandIsAvailable: function (teamID, userID, enterpiseID, req, res) {

        var ref = 'workspaces/';
        if (enterpiseID) {
            ref += enterpiseID + '/';
        } else {
            ref += teamID + '/';
        }
        ref += 'users/' + userID + '/tags';

        //Validations
        if (util.validateRequest(req, res)) {
            database.ref(ref).once('value')
                .then(snapshot => {
                    if (!snapshot.val() || (snapshot.val() && Object.keys(snapshot.val()).length < MAX_TAGS)) {
                        this.sendAddOrCreateTagMessage(res);
                    } else {
                        res.contentType('json').status(OK).send({
                            'response_type': 'ephemeral',
                            'replace_original': true,
                            'text': '*Max number of expertise tags already reached!*'
                        });
                    }
                    return;
                })
                .catch(err => {
                    if (err) console.log(err);
                    this.sendAddOrCreateTagMessage(res);
                });
        }
    },

    /**
     * This function takes in the HTTP repsonse and sends the initial message for the add tag workflow.
     * @param {*} res 
     */
    sendAddOrCreateTagMessage: function (res) {
        res.contentType('json').status(OK).send({
            'response_type': 'ephemeral',
            'replace_original': true,
            'text': '*Add an expertise tag* :brain:',
            'attachments': [
                {
                    'fallback': 'Interactive menu to add a workspace tag or create a new one',
                    'callback_id': 'add_tag',
                    'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')*',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'actions': [
                        {
                            'name': 'team_tags_menu_button',
                            'text': 'Pick a tag...',
                            'type': 'select',
                            'data_source': 'external',
                            'min_query_length': 1,
                        },
                        {
                            'name': 'create_tag_button',
                            'text': 'Create New',
                            'type': 'button',
                            'value': 'create'
                        },
                        {
                            'name': 'cancel_add_button',
                            'text': 'Cancel',
                            'type': 'button',
                            'value': 'cancel'
                        }
                    ]
                }
            ]
        });
    },

    /**
     * This function sends the dialog form to create a new expertise tag.
     * @param {*} teamID 
     * @param {*} triggerID 
     * @param {*} success 
     */
    openDialogToAddNewTag: function (teamID, triggerID, success) {
        util.retrieveAccessToken(teamID, token => {
            if (!token) {
                success(false);
            } else {
                let options = {
                    method: 'POST',
                    uri: 'https://slack.com/api/dialog.open',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + token
                    },
                    body: {
                        'trigger_id': triggerID,
                        'dialog': {
                            'callback_id': 'add_new_tag_dialog',
                            'title': 'Create New Tag',
                            'submit_label': 'Create',
                            'notify_on_cancel': true,
                            'elements': [
                                {
                                    'type': 'text',
                                    'label': 'Tag Title',
                                    'name': 'tag_title',
                                    'placeholder': 'Enter tag title',
                                    'hint': 'Consult your policy team on tag creation and check already in use tags with the /tags command'
                                },
                                {
                                    'type': 'textarea',
                                    'label': 'Description',
                                    'name': 'description',
                                    'max_length': 220,
                                    'min_length': 10,
                                    'hint': "Please, notice that creation of a new tag doesn't add it to your profile. You need to add tag after you have created it."
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
    },

    /**
     * This function replies with a failed creation of an expertise tag response.
     * @param {*} token 
     * @param {*} channelID 
     * @param {*} userID 
     * @param {*} reason 
     */
    failedToCreateTag: function (token, channelID, userID, reason) {
        let options = {
            method: 'POST',
            uri: 'https://slack.com/api/chat.postEphemeral',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + token
            },
            body: {
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': '*Add an expertise tag* :brain:',
                'channel': channelID,
                'user': userID,
                'as_user': false,
                'attachments': [
                    {
                        'fallback': 'Confirmation of failed tag addition',
                        'callback_id': 'create_new_tag_failure',
                        'text': reason,
                        'color': '#F21111',
                        'attachment_type': 'default',
                    },
                    {
                        'fallback': 'Interactive menu to add a workspace tag or create a new one',
                        'callback_id': 'add_tag',
                        'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')*',
                        'color': '#3AA3E3',
                        'attachment_type': 'default',
                        'actions': [
                            {
                                'name': 'team_tags_menu_button',
                                'text': 'Pick a tag...',
                                'type': 'select',
                                'data_source': 'external',
                                'min_query_length': 1
                            },
                            {
                                'name': 'create_tag_button',
                                'text': 'Create New',
                                'type': 'button',
                                'value': 'create'
                            },
                            {
                                'name': 'cancel_add_button',
                                'text': 'Cancel',
                                'type': 'button',
                                'value': 'cancel'
                            }
                        ]
                    }
                ]
            },
            json: true
        }

        util.makeRequestWithOptions(options);
    },

    /**
     * Responds to the user that the new expertise tag has been created and instantiated in the database.
     * @param {*} payload 
     * @param {*} res 
     */
    addNewTagDialog: function (payload, res) {
        const token = payload.token;
        const teamID = payload.team.id;
        const tag_title = payload.submission.tag_title;
        const description = payload.submission.description;
        const enterprise_id = payload.team.enterprise_id;
        const tag_code = tag_title.toLowerCase();

        var ref = 'tags/';
        if (enterprise_id) {
            ref += enterprise_id + '/';
        } else {
            ref += teamID + '/';
        }
        ref += util.groomKeyToFirebase(tag_title);

        database.ref(ref).once('value').then(snapshot => {
            if (!snapshot.val()) {
                database.ref(ref).set({
                    tag_title,
                    tag_code,
                    description,
                    count: 0
                }).then(ref => {
                    //Success!!!
                    res.status(OK).send();

                    util.retrieveAccessToken(teamID, token => {
                        if (token) {
                            let options = {
                                method: 'POST',
                                uri: 'https://slack.com/api/chat.postEphemeral',
                                headers: {
                                    'Content-Type': 'application/json; charset=utf-8',
                                    'Authorization': 'Bearer ' + token
                                },
                                body: {
                                    'response_type': 'ephemeral',
                                    'replace_original': true,
                                    'text': '*Expertise tag was successfully added* :raised_hands:',
                                    'channel': payload.channel.id,
                                    'user': payload.user.id,
                                    'as_user': false,
                                    'attachments': [
                                        {
                                            'fallback': 'Confirmation of successful tag addition',
                                            'callback_id': 'create_new_tag_success',
                                            'text': 'Tag has been created successfully',
                                            'color': '#00D68F',
                                            'attachment_type': 'default',
                                        },
                                        {
                                            'fallback': 'Interactive menu to add a workspace tag or create a new one',
                                            'callback_id': 'add_tag',
                                            'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')*',
                                            'color': '#3AA3E3',
                                            'attachment_type': 'default',
                                            'actions': [
                                                {
                                                    'name': 'team_tags_menu_button',
                                                    'text': 'Pick a tag...',
                                                    'type': 'select',
                                                    'data_source': 'external',
                                                    'min_query_length': 1
                                                },
                                                {
                                                    'name': 'create_tag_button',
                                                    'text': 'Create New',
                                                    'type': 'button',
                                                    'value': 'create'
                                                },
                                                {
                                                    'name': 'cancel_add_button',
                                                    'text': 'Cancel',
                                                    'type': 'button',
                                                    'value': 'cancel'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                json: true
                            }

                            util.makeRequestWithOptions(options);
                        }
                    });
                    return;
                }).catch(err => {
                    if (err) console.log(err);
                    res.status(OK).send();
                    util.retrieveAccessToken(teamID, token => {
                        if (token) {
                            this.failedToCreateTag(token, payload.channel.id, payload.user.id, 'Tag has failed to be created');
                        }
                    });
                    return;
                });
            } else {
                res.status(OK).send();
                util.retrieveAccessToken(teamID, token => {
                    if (token) {
                        this.failedToCreateTag(token, payload.channel.id, payload.user.id, 'Tag already exists');
                    }
                });
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            res.status(OK).send();
            util.retrieveAccessToken(teamID, token => {
                if (token) {
                    this.failedToCreateTag(token, payload.channel.id, payload.user.id, 'Tag has failed to be created');
                }
            });
            return;
        });
    },
    /**
     * Gives the initial add expertise tag workflow after the add tag dialog has been cancelled.
     * @param {*} payload 
     * @param {*} res 
     */
    dialogCancellation: function (payload, res) {
        const token = payload.token;
        const teamID = payload.team.id;

        res.status(OK).send();
        util.retrieveAccessToken(teamID, token => {
            if (token) {
                let options = {
                    method: 'POST',
                    uri: 'https://slack.com/api/chat.postEphemeral',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': 'Bearer ' + token
                    },
                    body: {
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Add an expertise tag* :brain:',
                        'channel': payload.channel.id,
                        'user': payload.user.id,
                        'as_user': false,
                        'attachments': [
                            {
                                'fallback': 'Interactive menu to add a workspace tag or create a new one',
                                'callback_id': 'add_tag',
                                'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')*',
                                'color': '#3AA3E3',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'team_tags_menu_button',
                                        'text': 'Pick a tag...',
                                        'type': 'select',
                                        'data_source': 'external',
                                        'min_query_length': 1
                                    },
                                    {
                                        'name': 'create_tag_button',
                                        'text': 'Create New',
                                        'type': 'button',
                                        'value': 'create'
                                    },
                                    {
                                        'name': 'cancel_add_button',
                                        'text': 'Cancel',
                                        'type': 'button',
                                        'value': 'cancel'
                                    }
                                ]
                            }
                        ]
                    },
                    json: true
                }

                util.makeRequestWithOptions(options);
            }
        });
    },

    /**
     * This functions handles the several button clicks that could be given on the add tags workflow.
     * @param {*} payload 
     * @param {*} res 
     */
    addTagAction: function (payload, res) {
        console.log('payload', payload);

        const response_url = payload.response_url;
        const teamID = payload.team.id;
        const user_id = payload.user.id;
        const enterprise_id = payload.team.enterprise_id;
        const username = payload.user.name;
        const trigger_id = payload.trigger_id;
        //const email = payload.user.email;

        //Handle button response from add tag workflow
        switch (payload.actions[0]['name']) {
            //Opens the create tag dialog.
            case 'create_tag_button':
                util.cancelButtonIsPressed(response_url, success => {
                    this.openDialogToAddNewTag(teamID, trigger_id, success => {
                        res.status(OK).send();
                        return;
                    });
                    return;
                });
                break;
            // User made a selection from the drill down menu so repsond with a populated selection and a confirm button.
            case 'team_tags_menu_button':
                visitor.event('Actions', 'Add Team Tags Menu Selection action').send();
                // This was a menu selection for adding a tag
                var tagToAdd = payload.actions[0].selected_options[0].value;
                res.contentType('json').status(OK).send({
                    'response_type': 'ephemeral',
                    'replace_original': true,
                    'text': '*Add an expertise tag* :brain:',
                    'attachments': [
                        {
                            'fallback': 'Interactive menu to add a workspace tag or create a new one',
                            'callback_id': 'add_tag',
                            'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')*',
                            'color': '#3AA3E3',
                            'attachment_type': 'default',
                            'actions': [
                                {
                                    'name': 'team_tags_menu_button',
                                    'text': 'Pick a tag...',
                                    'type': 'select',
                                    'data_source': 'external',
                                    'min_query_length': 1,
                                    'selected_options': [
                                        {
                                            'text': tagToAdd,
                                            'value': tagToAdd
                                        }
                                    ]
                                },
                                {
                                    'name': 'add_tag_confirm_button',
                                    'text': 'Add',
                                    'type': 'button',
                                    'value': tagToAdd,
                                    'style': 'primary'
                                },
                                {
                                    'name': 'create_tag_button',
                                    'text': 'Create New',
                                    'type': 'button',
                                    'value': 'create'
                                },
                                {
                                    'name': 'cancel_add_button',
                                    'text': 'Cancel',
                                    'type': 'button',
                                    'value': 'cancel'
                                }
                            ]
                        }
                    ]
                });
                break;
            // User confirmed their choice for a tag to add.
            case 'add_tag_confirm_button':
                visitor.event('Actions', 'Add Tag action').send();

                // var ref = 'workspaces/';
                // if (enterprise_id) {
                //    ref += enterprise_id + '/';
                // } else {
                //   ref += teamID + '/';
                // }
                // ref += 'users';
                //
                // database.ref(ref).once('value')
                //   .then(snapshot => {
                //       if (!snapshot.val() || (snapshot.val() && Object.keys(snapshot.val()).length < MAX_USERS)) {
                this.addTagConfirm(teamID, user_id, enterprise_id, username, payload, res);
                //     } else {
                //       res.contentType('json').status(OK).send({
                //           'response_type': 'ephemeral',
                //           'replace_original': true,
                //           'text': '*Looks like your team only has the free tier of Xpertz which only supports the first ' + MAX_USERS + ' members to add tags. Consult your manager/supervisor about upgrading to support more or contact us at <email or website link>*'
                //         });
                //     }
                //     return;
                //   })
                // .catch(err => {
                //   if (err) console.log(err);
                //   this.addTagConfirm(teamID, user_id, enterprise_id, username, payload, res);
                // });
                break;
        }
    },

    /**
     * This function adds a new tag to the user.
     * @param {*} teamID 
     * @param {*} userID 
     * @param {*} enterpriseID 
     * @param {*} username 
     * @param {*} payload 
     * @param {*} res 
     */
    addTagConfirm: function (teamID, userID, enterpriseID, username, payload, res) {
        var tagToAddConfirm = payload.actions[0]['value'];

        var refUser = 'workspaces/';
        var refTags = 'tags/';
        var id = undefined;
        if (enterpriseID) {
            refUser += enterpriseID + '/';
            refTags += enterpriseID + '/';
            id = enterpriseID;
        } else {
            refUser += teamID + '/';
            refTags += teamID + '/';
            id = teamID;
        }
        refUser += 'users/' + userID;
        var refUsersTag = refUser + '/tags/' + util.groomKeyToFirebase(tagToAddConfirm);
        refTags += util.groomKeyToFirebase(tagToAddConfirm);

        // Set the user as active
        database.ref(refUser).child('active').set(true);
        // Add this team to the user email index and create an index for them if necessary.
        this.updateEmailIndex(id, userID);

        database.ref(refUsersTag).once('value')
            .then(snapshot => {
                if (!snapshot.val()) {
                    //adds the tag to the user in the workspace index
                    database.ref(refUsersTag).set({
                        'tag': tagToAddConfirm,
                        'hi_five_count': 0
                    }).then(snap => {
                        database.ref(refTags).transaction(tagValue => {
                            if (tagValue) {
                                //increment user count for that tag
                                tagValue.count++;
                            } else {
                                // Just in case this tag no longer exists we initialize it.
                                // This should never happen however.
                                tagValue = {
                                    'tag_title': tagToAddConfirm,
                                    'tag_code': tagToAddConfirm.toLowerCase(),
                                    'count': 1
                                };
                            }
                            return tagValue;
                        });
                        return;
                    }).catch(err => {
                        if (err) console.log(err);
                        return;
                    });
                }
                return;
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });



        //=======================================================================
        //MAY BE REDUNANT CODE NEED TO GO OVER AND MAY DELETE.
        // Update the user reference index and update team child with this team id
        //var userRef = 'users/' + user_id;
        var ref = 'workspaces/';
        if (enterpriseID) {
            ref += enterpriseID + '/';
        } else {
            ref += teamID + '/';
        }
        ref += 'tags/' + util.groomKeyToFirebase(tagToAddConfirm) + '/users/' + userID;

        database.ref(ref).once('value')
            .then(snapshot => {
                if (!snapshot.val()) {
                    database.ref(ref).set({
                        'user_id': userID,
                        'username': username,
                        'hi_five_count': 0
                    }).catch(err => {
                        if (err) console.log(err);
                        return;
                    });
                }
                return;
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });

        res.contentType('json').status(OK).send({
            'response_type': 'ephemeral',
            'replace_original': true,
            'text': '*Expertise tag was succesfully added* :raised_hands:',
            'attachments': [
                {
                    'fallback': 'Confirmation that tag was successfully added',
                    'callback_id': 'add_more_tags',
                    'text': 'Tag: ' + tagToAddConfirm + ' has been successfully added to your profile',
                    'color': '#00D68F',
                    'attachment_type': 'default',
                    'actions': [
                        {
                            'name': 'add_more_tags_button',
                            'text': 'Add More Tags',
                            'type': 'button',
                            'value': 'add_more',
                            'style': 'primary'
                        },
                        {
                            'name': 'cancel',
                            'text': 'Finish',
                            'type': 'button',
                            'value': 'cancel'
                        }
                    ]
                }
            ]
        });
        //=======================================================================
    },

    /**
     * This function updates the user index in the database. It will add a new team to their teams list if necessary or initialize their index.
     * @param {*} teamID 
     * @param {*} userID 
     */
    updateEmailIndex: function (teamID, userID) {
        var ref = 'users/';
        database.ref('installations/' + teamId).once('value').then(snapshot => {
            var token = snapshot.val().bot_token;
            // Get the email of the user using the web api.
            request.get('https://slack.com/api/users.info?token=' + token + '&users=' + userID, (err, res, body) => {
                if (err) {
                    return console.log(err);
                } else {
                    let payload = JSON.parse(body);
                    var email = payload.user.profile.email;
                    ref += util.groomKeyToFirebase(email);
                    database.ref(ref).transaction(userRef => {
                        if (userRef) {
                            //user index exists
                            var teamsList = userRef.teams;
                            let duplicate = false;
                            for (team in teamsList) {
                                if (team === teamID) {
                                    duplicate = true;
                                }
                            }
                            if (!duplicate) {
                                teamsList.push(teamID);
                            }
                        } else {
                            //init index
                            var emailKey = util.groomKeyToFirebase(email);
                            userRef = {
                                emailKey: {
                                    teams: [teamID]
                                }
                            }

                        }

                        return userRef;
                    });
                }
            });
        }).catch(err => {
            if (err) console.log(err);
            return undefined;
        });
    }

};
