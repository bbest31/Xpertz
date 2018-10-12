const firebase = require('firebase');
const util = require('./util');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

    profileCommand: function (req, res) {
        var token = req.body.token;
        var user_name = req.body.user_name;
        var user_id = req.body.user_id;
        var team_id = req.body.team_id;
        var enterprise_id = req.body.enterprise_id;
        var text = req.body.text;

        if (text) {
            var forSpecificUserId = text.substring(text.indexOf('<@') + 2, text.indexOf('|'));
            var forSpecificUserName = text.substring(text.indexOf('|') + 1, text.indexOf('>'));
            if (forSpecificUserId && forSpecificUserName) {
                user_id = forSpecificUserId;
                user_name = forSpecificUserName;
            }
        }

        //Validations
        if (util.validateToken(token, res)) {
            var attachments = [
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
                {
                    "fallback": "User name's expertise",
                    "text": "*<@" + user_id + ">'s Expertise*",
                    "color": "#2F80ED",
                    "attachment_type": "default"
                }
            ];

            var ref = 'workspaces/';
            if (enterprise_id) {
                ref += enterprise_id + '/';
            } else {
                ref += team_id + '/';
            }
            ref += 'users/' + user_id + '/tags';

            database.ref(ref).orderByChild('hi_five_count')
                .once("value").then(snapshot => {

                    var tags = [];

                    // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                    snapshot.forEach(childSnapshot => {
                        tags.push(childSnapshot.val());
                    });

                    if (tags.length > 0) {
                        tags.sort((tag1, tag2) => { return tag2.hi_five_count - tag1.hi_five_count });

                        tags.forEach(tag => {
                            var hi_five_count = tag.hi_five_count;
                            var color = "#E0E0E0";
                            var rankEmoji = "";

                            if (hi_five_count >= 5 && hi_five_count < 15) {
                                color = "#F2994A";
                            } else if (hi_five_count >= 15 && hi_five_count < 30) {
                                color = "#6989A7";
                            } else if (hi_five_count >= 30) {
                                color = "#F2C94C";
                                if (hi_five_count >= 50 && hi_five_count < 75) {
                                    rankEmoji = ":medal:";
                                } else if (hi_five_count >= 75 && hi_five_count < 100) {
                                    rankEmoji = ":sports_medal:";
                                } else if (hi_five_count >= 100 && hi_five_count < 150) {
                                    rankEmoji = ":trophy:";
                                } else if (hi_five_count >= 150 & hi_five_count < 250) {
                                    rankEmoji = ":gem:";
                                } else if (hi_five_count >= 250) {
                                    rankEmoji = ":crown:";
                                }

                            }

                            attachments.push({
                                "fallback": "Expertise",
                                "fields": [
                                    {
                                        "value": util.groomTheKeyFromFirebase(tag.tag) + rankEmoji,
                                        "short": true
                                    },
                                    {
                                        "value": ":clap: " + hi_five_count,
                                        "short": true
                                    }
                                ],
                                "color": color,
                                "attachment_type": "default"
                            });
                        });

                    } else {
                        // If user has no expertise added yet
                        attachments.push({

                            "fallback": "No expertise added yet.",
                            "text": "No expertise tags added yet :disappointed:",
                            "color": "#2F80ED",
                            "attachment_type": "default"

                        });

                    }

                    res.contentType('json').status(200).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "attachments": attachments
                    });

                    return;
                })
                .catch(err => {
                    if (err) console.log(err);
                    return;
                });
        }
    }
};
