const util = require('./util');
const rp = require('request-promise');
const firebase = require('firebase');
const request = require('request');
const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });
const presets = require('./preset_tags');
// Get a reference to the database service
const database = firebase.database();

const OK = 200;
const INTERNAL_ERROR = 500;

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
    /**
     * 
     * @param {*} id 
     * @param {*} req 
     * @param {*} res 
     */
    addCommand: function (idJSON, req, res) {
        var userId = req.body.user_id;
        util.slackUserExists(userId, idJSON, userExists => {
            if (userExists) {
                this.checkAndFireAddCommandIsAvailable(idJSON, userId, req, res);
            } else {
                res.contentType('json').status(OK).send({
                    'response_type': 'ephemeral',
                    'replace_original': true,
                    'text': 'Unable to identify this slack user under the Xpertz organization. Please make sure you have joined the Xpertz organization and both your Slack account and Xpertz account are using the same email.'
                });
            }

        });
    },

    /**
     * Checks to see if the user has reached the limit on expertise. If not then sends the initial interactive message to start the add tag workflow.
     * @param {*} idJSON
     * @param {*} userID 
     * @param {*} req 
     * @param {*} res 
     */
    checkAndFireAddCommandIsAvailable: function (idJSON, userId, req, res) {

        database.ref('organizations').orderByChild(idJSON['id_type']).equalTo(idJSON['id']).limitToFirst(1).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var orgId = Object.keys(snapshot.val()[0]);
                    return database.ref('organizations/' + orgId + '/users').orderByChild('third_party/slack_id').equalTo(userId).once('value')
                        .then(userSnapshot => {
                            if (userSnapshot.val() && Object.keys(userSnapshot.val())[0]) {
                                var userTags = userSnapshot.toJSON()['tags'];
                                if (Object.keys(userTags).length >= MAX_TAGS) {
                                    res.contentType('json').status(OK).send({
                                        'response_type': 'ephemeral',
                                        'replace_original': true,
                                        'text': '*Max number of expertise tags already reached!*'
                                    });
                                } else {
                                    let text = null;
                                    if (req.body.text) {
                                        text = req.body.text;
                                    }
                                    this.sendAddOrCreateTagMessage(text, idJSON, res);
                                }
                            } else {
                                response.contentType('json').status(OK).send({
                                    'response_type': 'ephemeral',
                                    'replace_original': true,
                                    'text': 'Request has failed. If this keeps happening, please, contact us at xpertz.software@gmail.com'
                                });
                            }
                            return;
                        })
                        .catch(err => {
                            if (err) {
                                console.log(err);
                                response.contentType('json').status(OK).send({
                                    'response_type': 'ephemeral',
                                    'replace_original': true,
                                    'text': 'Request has failed. If this keeps happening, please, contact us at xpertz.software@gmail.com'
                                });
                            } else {
                                let text = null;
                                if (req.body.text) {
                                    text = req.body.text;
                                }
                                this.sendAddOrCreateTagMessage(text, idJSON, res);
                            }
                        });
                } else {
                    let text = null;
                    if (req.body.text) {
                        text = req.body.text;
                    }
                    this.sendAddOrCreateTagMessage(text, idJSON, res);
                }
                return;
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    response.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': 'Request has failed. If this keeps happening, please, contact us at xpertz.software@gmail.com'
                    });
                }

            });

    },

    /**
     * This function takes in the HTTP repsonse and sends the initial message for the add tag workflow.
     * @param {*} res
     */
    sendAddOrCreateTagMessage: function (text, idJSON, res) {
        if (text !== null) {
            database.ref('organizations').orderByChild(idJSON['id_type']).equalTo(idJSON['id']).once('value')
                .then(orgSnapshot => {
                    if (orgSnapshot.val() && Object.keys(orgSnapshot.val())[0]) {
                        var orgId = Object.keys(orgSnapshot.val())[0];
                        return database.ref('organizations/' + orgId + '/tags/').orderByChild('key').once('value')
                            .then(snapshot => {
                                if (snapshot.hasChild(util.groomKeyToFirebase(text))) {
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
                                                                'text': text,
                                                                'value': text
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        'name': 'add_tag_confirm_button',
                                                        'text': 'Add',
                                                        'type': 'button',
                                                        'value': text,
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
                                } else {
                                    res.contentType('json').status(OK).send({
                                        'response_type': 'ephemeral',
                                        'replace_original': true,
                                        'text': '*Add an expertise tag* :brain:',
                                        'attachments': [
                                            {
                                                'fallback': 'Interactive menu to add a workspace tag or create a new one',
                                                'callback_id': 'add_tag',
                                                'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')* \n *That expertise tag does not currently exist!*',
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
                                                                'text': text,
                                                                'value': text
                                                            }
                                                        ]
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
                                }
                                return;
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    } else {
                        throw new Error;
                    }
                }).catch(err => {
                    console.log(err);
                    res.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Add an expertise tag* :brain:',
                        'attachments': [
                            {
                                'fallback': 'Interactive menu to add a workspace tag or create a new one',
                                'callback_id': 'add_tag',
                                'text': 'Select a tag to add or create a new one! *(max. ' + MAX_TAGS + ')* \n *An error has occurred, please try again!*',
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
                                                'text': text,
                                                'value': text
                                            }
                                        ]
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
                    return;
                });

        } else {
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
        }
    },

    /**
     * This function sends the dialog form to create a new expertise tag.
     * @param {*} idJSON 
     * @param {*} triggerID 
     * @param {*} success 
     */
    openDialogToAddNewTag: function (idJSON, triggerID, success) {
        util.retrieveAccessToken(idJSON, token => {
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
                                    'label': 'Preset Expertise Option',
                                    'name': 'preset_tags_menu_button',
                                    'type': 'select',
                                    'hint': 'Choose from one of our premade options.',
                                    'optional': true,
                                    'data_source': 'external'
                                },
                                {
                                    'type': 'text',
                                    'label': 'Tag Title',
                                    'name': 'tag_title',
                                    'placeholder': 'Enter tag title',
                                    'optional': true,
                                    'hint': 'Consult your policy team on tag creation and check already in use tags with the /xpertz-tagslist command'
                                },
                                {
                                    'type': 'textarea',
                                    'label': 'Description',
                                    'name': 'description',
                                    'max_length': 220,
                                    'min_length': 10,
                                    'optional': true,
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
    failedToCreateTag: function (token, payload, reason) {
        let options = {
            method: 'POST',
            uri: payload.response_url,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': '*Add an expertise tag* :brain:',
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
        const idJSON = util.correctIdFromPayload(payload);

        var preset_tag = payload.submission.preset_tags_menu_button;
        var tag_title = payload.submission.tag_title;
        var description = payload.submission.description;

        if (preset_tag) {
            if (tag_title || description) {
                //Error response
                return res.contentType('application/json').status(OK).send({
                    'errors': [
                        {
                            'name': 'preset_tags_menu_button',
                            'error': 'Please clear this selection if you wish to make a brand new tag.'
                        }
                    ]
                });
            } else {
                tag_title = preset_tag;
                description = presets.getGeneralJSON()[tag_title].description;
                this.createNewTagFromDialog(tag_title, description, payload, res);

            }

        } else if (tag_title && description) {

            tag_key = tag_title.toLowerCase();
            this.createNewTagFromDialog(tag_title, description, payload, res);

        } else {
            //Error responses
            if (!tag_title && !description) {
                //Error response
                return res.contentType('application/json').status(OK).send({
                    'errors': [
                        {
                            'name': 'tag_title',
                            'error': 'Please enter a valid expertise title.'
                        },
                        {
                            'name': 'description',
                            'error': 'Please enter a valid expertise description.'
                        }
                    ]
                });
            } else if (!tag_title) {
                //Error response
                return res.contentType('application/json').status(OK).send({
                    'errors': [
                        {
                            'name': 'tag_title',
                            'error': 'Please enter a valid expertise title.'
                        },
                    ]
                });
            } else if (!description) {
                //Error response
                return res.contentType('application/json').status(OK).send({
                    'errors': [
                        {
                            'name': 'description',
                            'error': 'Please enter a valid expertise description.'
                        }
                    ]
                });
            }

        }

    },

    /**
     * Gives the initial add expertise tag workflow after the add tag dialog has been cancelled.
     * @param {*} payload 
     * @param {*} res 
     */
    dialogCancellation: function (payload, res) {
        const token = payload.token;
        const teamId = payload.team.id;
        const idJSON = {
            id_type: "slack_team_id",
            id: teamId

        }
        res.status(OK).send();
        util.retrieveAccessToken(idJSON, token => {
            if (token) {
                let options = {
                    method: 'POST',
                    uri: payload.response_url,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                    body: {
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
        // console.log('payload', payload);

        const response_url = payload.response_url;
        const user_slack_id = payload.user.id;
        const username = payload.user.name;
        const trigger_id = payload.trigger_id;
        //const email = payload.user.email;
        const idJSON = util.correctIdFromPayload(payload);

        //Handle button response from add tag workflow
        switch (payload.actions[0]['name']) {
            //Opens the create tag dialog.
            case 'create_tag_button':
                util.cancelButtonIsPressed(response_url, success => {
                    this.openDialogToAddNewTag(idJSON, trigger_id, success => {
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
                this.addTagConfirm(idJSON, user_slack_id, username, payload, res);
                break;
        }
    },

    /**
     * This function adds a new tag to the user.
     * @param {json} idJSON
     * @param {*} userID 
     * @param {*} username 
     * @param {*} payload 
     * @param {*} res
     */
    addTagConfirm: function (idJSON, userSlackId, username, payload, res) {
        var tagToAddConfirm = payload.actions[0]['value'];

        database.ref('organizations').orderByChild(idJSON['id_type']).equalTo(idJSON['id']).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var orgId = Object.keys(snapshot.val())[0];
                    // Get the user index
                    database.ref('organizations/' + orgId + '/users').orderByChild('third_party/slack_id').equalTo(userSlackId).once('value')
                        .then(userSnapshot => {
                            if (userSnapshot.val() && Object.keys(userSnapshot.val())[0]) {
                                let userId = Object.keys(userSnapshot.val())[0];
                                //Increment the population count for that expertise
                                database.ref('organizations/' + orgId + '/tags/' + util.groomKeyToFirebase(tagToAddConfirm)).transaction(tagNode => {
                                    tagNode.count++;
                                    return tagNode;
                                });
                                // Add the tag to the user
                                return database.ref('organizations/' + orgId + '/users/' + userId).transaction(userNode => {
                                    userNode[util.groomKeyToFirebase(tagToAddConfirm)] = {
                                        count: 0,
                                        name: tagToAddConfirm,
                                        events: {}
                                    }
                                    return userNode;
                                });

                            } else {
                                // Couldn't find the user
                                console.error('addTagConfirm: Could not locate user to add tag to!')
                                return res.contentType('json').status(INTERNAL_ERROR).send({
                                    'response_type': 'ephemeral',
                                    'replace_original': true,
                                    'text': '*Error in adding tag to user!*',
                                });
                            }
                        })
                        .catch(err => {
                            if (err) console.log(err);
                            return;
                        });

                    return res.contentType('json').status(OK).send({
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
                } else {
                    // Couldn't get the org
                    return res.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Error in adding tag!*',
                        'attachments': [
                            {
                                'fallback': 'Error',
                                'callback_id': 'add_more_tags',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'cancel',
                                        'text': 'Exit',
                                        'type': 'button',
                                        'value': 'cancel'
                                    }
                                ]
                            }
                        ]
                    });
                }
            }).catch(err => {
                if (err) {
                    console.error('addTagConfirm: ', err);
                    res.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Error in adding tag!*',
                        'attachments': [
                            {
                                'fallback': 'Error',
                                'callback_id': 'add_more_tags',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'cancel',
                                        'text': 'Exit',
                                        'type': 'button',
                                        'value': 'cancel'
                                    }
                                ]
                            }
                        ]
                    });
                }
            });



    },

    /**
     * Creates the new tag for a workspace given the payload from the Create New dialog submission.
     * @param {*} idJSON 
     * @param {*} tag_title 
     * @param {*} description
     * @param {*} payload 
     * @param {*} res
     */
    createNewTagFromDialog: function (idJSON, tagTitle, description, payload, res) {

        database.ref('organizations').orderByChild(idJSON['id_type']).equalTo(idJSON['id']).once('value')
            .then(snapshot => {
                var orgId = Object.keys(snapshot.val())[0];
                return database.ref('organizations/' + orgId + '/tags').orderByChild('title').equalTo(tagTitle).once('value')
                    .then(tagSnapshot => {
                        if (!tagSnapshot.val()) {
                            // This is not a duplicate tag so we add it to the org
                            return database.ref('organizations/' + orgId + '/tags').transaction(tags => {
                                tags[util.groomKeyToFirebase(tagTitle)] = {
                                    count: 0,
                                    description: description,
                                    title: tagTitle
                                }
                                return tags;
                            })
                                .then(ref => {
                                    //Success!!!
                                    res.status(OK).send();
                                    util.retrieveAccessToken(idJSON, token => {
                                        if (token) {
                                            let options = {
                                                method: 'POST',
                                                uri: payload.response_url,
                                                headers: {
                                                    'Content-Type': 'application/json; charset=utf-8',
                                                },
                                                body: {
                                                    'response_type': 'ephemeral',
                                                    'replace_original': true,
                                                    'text': '*Expertise tag was successfully created* :raised_hands:',
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
                                                                    'min_query_length': 1,
                                                                    'selected_options': [
                                                                        {
                                                                            'text': tagTitle,
                                                                            'value': tagTitle
                                                                        }
                                                                    ]

                                                                },
                                                                {
                                                                    'name': 'add_tag_confirm_button',
                                                                    'text': 'Add',
                                                                    'type': 'button',
                                                                    'value': tagTitle,
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
                                                },
                                                json: true
                                            }

                                            util.makeRequestWithOptions(options);
                                        }
                                    });
                                    return;
                                }).catch(err => {
                                    if (err) console.error(err);
                                    res.status(OK).send();
                                    util.retrieveAccessToken(idJSON, token => {
                                        if (token) {
                                            this.failedToCreateTag(token, payload, 'Tag has failed to be created');
                                        }
                                    });
                                    return;
                                });
                        } else {
                            res.status(OK).send();
                            util.retrieveAccessToken(idJSON, token => {
                                if (token) {
                                    this.failedToCreateTag(token, payload, 'Tag already exists');
                                }
                            });
                        }
                        return;
                    })
                    .catch(err => {
                        if (err) console.log(err);
                        res.status(OK).send();
                        util.retrieveAccessToken(idJSON, token => {
                            if (token) {
                                this.failedToCreateTag(token, payload, 'Tag has failed to be created');
                            }
                        });
                        return;
                    });

            })
            .catch(err => {
                if (err) console.log(err);
                res.status(OK).send();
                util.retrieveAccessToken(idJSON, token => {
                    if (token) {
                        this.failedToCreateTag(token, payload, 'Tag has failed to be created');
                    }
                });
                return;
            });
    }

};
