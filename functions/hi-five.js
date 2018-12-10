const firebase = require('firebase');
const util = require('./util');
const bot = require('./bot');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

    hiFiveCommand: function (req, res) {
        var text = req.body.text;

        if (util.validateRequest(req, res)) {
            if (!text) {
                res.contentType('json').status(OK).send({
                    'text': '_Must provide a mentioned user!_'
                });
            } else {
                var userId = text.substring(text.indexOf('<@') + 2, text.indexOf('|'));
                var userName = text.substring(text.indexOf('|') + 1, text.indexOf('>'));
                if (userId && userName) {
                    if (userId === req.body.user_id) {
                        res.contentType('json').status(OK).send({
                            'text': "_You can't high-five yourself!_"
                        });
                    } else {
                        this.sendHiFiveMessage(res, userName, userId, req.body.team_id, req.body.enterprise_id);
                    }
                } else {
                    res.contentType('json').status(OK).send({
                        'text': '_Must provide a mentioned user!_'
                    });
                }
            }
        }
    },

    /**
     * Not being used at the moment
     * @param {*} res
     */
    sendHiFiveInitialMessage: function (res) {
        res.contentType('json').status(OK).send({
            'response_type': 'ephemeral',
            'replace_original': true,
            'text': '*Give someone a high-five for helping!* :clap:',
            'attachments': [
                {
                    'fallback': 'Select a user that helped you out with your issue.',
                    'callback_id': 'h5',
                    'text': 'Choose the colleague that helped you',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'actions': [
                        {
                            'name': 'pick_user_menu_button',
                            'text': 'Choose colleague',
                            'type': 'select',
                            'data_source': 'users',
                        },
                        {
                            'name': 'cancel_h5_button',
                            'text': 'Close',
                            'value': 'cancel',
                            'type': 'button'
                        }

                    ]
                }
            ]
        });
    },

    /**
     * This function responds to start the hi_five workflow.
     * @param {Express.Response} res
     * @param {string} userName
     * @param {string} userID
     */
    sendHiFiveMessage: function (res, userName, userID, teamID, enterpriseID) {
        var ref = 'workspaces/';
        if (enterpriseID) {
            ref += enterpriseID + '/';
        }
        ref += teamID + '/users/' + userID + '/tags';

        database.ref(ref)
            .once('value').then(snapshot => {

                var options = {
                    options: []
                };
                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    options.options.push({
                        'text': util.groomKeyFromFirebase(childSnapshot.key),
                        'value': childSnapshot.key + '|' + userName + '|' + userID
                    });
                });

                if (options.options.length > 0) {
                    return res.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Choose one of <@' + userID + ">'s expertise to high-five!* :clap:",
                        'attachments': [
                            {
                                'fallback': 'Select one of their expertise they used to help you out',
                                'callback_id': 'h5',
                                'text': 'Choose the expertise they used to help',
                                'color': '#20BA42',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'h5_tag_menu_button',
                                        'text': 'Choose expertise',
                                        'type': 'select',
                                        'options': options.options,
                                    },
                                    {
                                        'name': 'cancel_h5_button',
                                        'text': 'Close',
                                        'value': 'cancel',
                                        'type': 'button'
                                    }

                                ]
                            }
                        ]
                    });
                } else {
                    return res.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Looks like <@' + userID + "> doesn't have any expertise to high-five at the moment!*",
                    });
                }
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });

    },

    sendHiFiveSelectedTagMessage: function (res, selectedOption, teamID, enterpriseID) {
        var userID = selectedOption.substring(selectedOption.lastIndexOf('|') + 1);
        var userName = selectedOption.substring(selectedOption.indexOf('|') + 1, selectedOption.lastIndexOf('|'));
        var selectedTag = selectedOption.substring(0, selectedOption.indexOf('|'));

        var ref = 'workspaces/';
        if (enterpriseID) {
            ref += enterpriseID + '/';
        }
        ref += teamID + '/users/' + userID + '/tags';

        database.ref(ref)
            .once('value').then(snapshot => {

                var options = {
                    options: []
                };
                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    options.options.push({
                        'text': util.groomKeyFromFirebase(childSnapshot.key),
                        'value': childSnapshot.key + '|' + userName + '|' + userID
                    });
                });

                return res.contentType('json').status(OK).send({
                    'response_type': 'ephemeral',
                    'replace_original': true,
                    'text': '*Choose one of <@' + userID + ">'s expertise to high-five!* :clap:",
                    'attachments': [
                        {
                            'fallback': 'Select one of their expertise they used to help you out',
                            'callback_id': 'h5',
                            'text': 'Choose the expertise they used to help',
                            'color': '#20BA42',
                            'attachment_type': 'default',
                            'actions': [
                                {
                                    'name': 'h5_tag_menu_button',
                                    'text': 'Choose expertise',
                                    'type': 'select',
                                    'options': options.options,
                                    'selected_options': [
                                        {
                                            'text': selectedTag,
                                            'value': selectedOption
                                        }
                                    ]
                                },
                                {
                                    'name': 'h5_button',
                                    'type': 'button',
                                    'text': 'High-Five!',
                                    'value': selectedOption,
                                    'style': 'primary'
                                },
                                {
                                    'name': 'cancel_h5_button',
                                    'text': 'Close',
                                    'value': 'cancel',
                                    'type': 'button'
                                }

                            ]
                        }
                    ]
                });
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });
    },

    hiFiveAction: function (payload, res) {
        const teamID = payload.team.id;
        const enterpriseID = payload.team.enterprise_id;
        const userID = payload.user.id;
        var id = false;
        if (enterpriseID) {
            id = enterpriseID;
        } else {
            id = teamID;
        }

        switch (payload.actions[0]['name']) {

            case 'h5_tag_menu_button':
                visitor.event('Actions', 'Hi_Five Tags Menu Selection action').send();
                var selectedOption = payload.actions[0].selected_options[0].value;
                this.sendHiFiveSelectedTagMessage(res, selectedOption, teamID, enterpriseID);
                break;

            case 'h5_button':
                visitor.event('Actions', 'Hi_Five action').send();

                var optionValue = payload.actions[0]['value'];
                var colleagueName = optionValue.substring(optionValue.indexOf('|') + 1, optionValue.lastIndexOf('|'));
                var colleagueID = optionValue.substring(optionValue.lastIndexOf('|') + 1);
                var colleagueTag = optionValue.substring(0, optionValue.indexOf('|'));

                var refUsers = 'workspaces/' + id + '/';
                refUsers += 'users/' + colleagueID + '/tags/' + util.groomKeyToFirebase(colleagueTag);

                // Increment the hi_five count
                database.ref(refUsers).once('value')
                    .then(snapshot => {
                        if (snapshot.val()) {
                            database.ref(refUsers).transaction(tagNode => {
                                if (tagNode) {
                                    tagNode.hi_five_count++;
                                    // Call async function to send rank up DM if appropriate
                                    if(util.rankUpCheck(tagNode.hi_five_count)){
                                        bot.tagRankUp(colleagueID,colleagueTag, id);
                                    }
                                }
                                return tagNode;
                            });
                        } else {
                            throw new Error;
                        }
                        return;
                    }).catch(err => {
                        if (err) console.log(err)
                        res.contentType('json').status(OK).send({
                            'response_type': 'ephemeral',
                            'replace_original': true,
                            'text': 'Oops! Something went wrong on our side :confused: Try again...'
                        });
                        return;
                    });

                var refTags = 'workspaces/' + id + '/';
                refTags += 'tags/' + util.groomKeyToFirebase(colleagueTag) + '/users/' + colleagueID;

                database.ref(refTags).once('value')
                    .then(snapshot => {
                        if (snapshot.val()) {
                            database.ref(refTags).transaction(tagNode => {
                                if (tagNode) {
                                    tagNode.hi_five_count++;
                                }
                                return tagNode;
                            });
                        } else {
                            throw new Error;
                        }
                        return;
                    }).catch(err => {
                        if (err) console.log(err)
                        res.contentType('json').status(OK).send({
                            'response_type': 'ephemeral',
                            'replace_original': true,
                            'text': 'Oops! Something went wrong on our side :confused: Try again...'
                        });
                        return;
                    });

                // Confirmation response
                res.contentType('json').status(OK).send({
                    'response_type' : 'in_channel',
                    'replace_original': false,
                    'attachments': [
                        {
                            'fallback': 'Confirmation that the high-five was successfully given',
                            'callback_id': 'h5',
                            'text': '*<@' + userID + '> gave <@' + colleagueID + '> a high-five towards their ' + colleagueTag + ' expertise* :+1:',
                            'color': '#20BA42',
                            'attachment_type': 'default',
                        }
                    ]
                });
                break;
        }
    }
};
