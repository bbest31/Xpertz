const firebase = require('firebase');
const util = require('./util');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

    /**
     * 
     * @param {*} req 
     * @param {*} res
     * @todo alter for new schema 
     */
    profileCommand: function (req, res) {
        var userName = req.body.user_name;
        var userID = req.body.user_id;
        var teamID = req.body.team_id;
        var enterpriseID = req.body.enterprise_id;
        var text = req.body.text;

        if (text) {
            var forSpecificUserId = text.substring(text.indexOf('<@') + 2, text.indexOf('|'));
            var forSpecificUserName = text.substring(text.indexOf('|') + 1, text.indexOf('>'));
            if (forSpecificUserId && forSpecificUserName) {
                userID = forSpecificUserId;
                userName = forSpecificUserName;
            }
        }

        var attachments = [
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
            {
                'fallback': "User name's expertise",
                'text': '*<@' + userID + ">'s Expertise*",
                'color': '#2F80ED',
                'attachment_type': 'default'
            }
        ];

        var id = '';
        if (enterpriseID) {
            id = enterpriseID;
        } else {
            id = teamID;
        }

        database.ref('workspaces').orderByChild('team').equalTo(id).once('value')
        .then(snapshot => {
            if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                var workspaceId = Object.keys(snapshot.val())[0];
                return database.ref('workspaces/'+workspaceId+'/users/').orderByChild('user_id').equalTo(userID).once('value')
                .then(userSnapshot => {
                    if (userSnapshot.val() && Object.keys(userSnapshot.val())[0]) {
                        var userId = Object.keys(userSnapshot.val())[0];
                        return database.ref('workspaces/'+workspaceId+'/users/'+userId+'/tags/').orderByChild('hi_five_count').once('value')
                        .then(tagsSnapshot => {
                            if (tagsSnapshot.val() && Object.values(tagsSnapshot.val()).length > 0) {
                                var tags = [];

                                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                                Object.values(tagsSnapshot.val()).forEach(tag => {
                                    tags.push(tag);
                                });

                                if (tags.length > 0) {
                                    tags.sort((tag1, tag2) => { return tag2.hi_five_count - tag1.hi_five_count });

                                    tags.forEach(tag => {
                                        var highFiveCount = tag.hi_five_count;
                                        var color = '#E0E0E0';
                                        var rankEmoji = '';

                                        if (highFiveCount >= 5 && highFiveCount < 15) {
                                            color = '#F2994A';
                                        } else if (highFiveCount >= 15 && highFiveCount < 30) {
                                            color = '#6989A7';
                                        } else if (highFiveCount >= 30) {
                                            color = '#F2C94C';
                                            if (highFiveCount >= 50 && highFiveCount < 75) {
                                                rankEmoji = ':medal:';
                                            } else if (highFiveCount >= 75 && highFiveCount < 100) {
                                                rankEmoji = ':sports_medal:';
                                            } else if (highFiveCount >= 100 && highFiveCount < 150) {
                                                rankEmoji = ':trophy:';
                                            } else if (highFiveCount >= 150 & highFiveCount < 250) {
                                                rankEmoji = ':gem:';
                                            } else if (highFiveCount >= 250) {
                                                rankEmoji = ':crown:';
                                            }

                                        }

                                        attachments.push({
                                            'fallback': 'Expertise',
                                            'fields': [
                                                {
                                                    'value': tag.tag + rankEmoji,
                                                    'short': true
                                                },
                                                {
                                                    'value': ':clap: ' + highFiveCount,
                                                    'short': true
                                                }
                                            ],
                                            'color': color,
                                            'attachment_type': 'default'
                                        });
                                    });

                                } else {
                                    // If user has no expertise added yet
                                    attachments.push({

                                        'fallback': 'No expertise added yet.',
                                        'text': 'No expertise tags added yet :disappointed:',
                                        'color': '#2F80ED',
                                        'attachment_type': 'default'

                                    });

                                }

                                res.contentType('json').status(200).send({
                                    'response_type': 'ephemeral',
                                    'replace_original': true,
                                    'attachments': attachments
                                });

                                return;
                            } else {
                                // If user has no expertise added yet
                                attachments.push({

                                    'fallback': 'No expertise added yet.',
                                    'text': 'No expertise tags added yet :disappointed:',
                                    'color': '#2F80ED',
                                    'attachment_type': 'default'

                                });
                                res.contentType('json').status(200).send({
                                    'response_type': 'ephemeral',
                                    'replace_original': true,
                                    'attachments': attachments
                                });
                                return;
                            }
                        })
                        .catch(err => {
                            if (err) console.log(err);
                            return;
                        });
                    } else {
                        // If user has no expertise added yet
                        attachments.push({

                            'fallback': 'No expertise added yet.',
                            'text': 'No expertise tags added yet :disappointed:',
                            'color': '#2F80ED',
                            'attachment_type': 'default'

                        });
                        res.contentType('json').status(200).send({
                            'response_type': 'ephemeral',
                            'replace_original': true,
                            'attachments': attachments
                        });
                        return;
                    }
                })
                .catch(err => {
                    if (err) console.log(err);
                    return;
                });
            } else {
                // If user has no expertise added yet
                attachments.push({

                    'fallback': 'No expertise added yet.',
                    'text': 'No expertise tags added yet :disappointed:',
                    'color': '#2F80ED',
                    'attachment_type': 'default'

                });
                res.contentType('json').status(200).send({
                    'response_type': 'ephemeral',
                    'replace_original': true,
                    'attachments': attachments
                });
                return;
            }
        })
        .catch(err => {
            if (err) console.log(err);
            return;
        });
    }
};
