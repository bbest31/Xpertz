const util = require('./util');
const firebase = require('firebase');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

    tagsCommand: function (req, res) {
        var token = req.body.token;

        //Validations
        if (util.validateToken(token, res)) {
            this.sendTagListMessage(res);
        }
    },


    tagsSelectAction: function (payload, res) {
        const team_id = payload.team.id;
        const selectedTag = payload.actions[0].selected_options[0].value;
        console.log("Tag Selection Action: ",selectedTag);
        this.sendTagListMessage(res, team_id, selectedTag);
    },

    /**
     * Tag List message from /tags which provide menu button to look up in-use tags of workspace.
     * If a selectedTagCode is provided we populate the selected attribute of the menu button and show
     * the tag details to the user.
     */
    sendTagListMessage: function (response, team_id, selectedTag) {

        if (selectedTag === undefined) {

            response.contentType("json").status(OK).send({
                "response_type": "ephemeral",
                "replace_original": true,
                "text": "*Look up expertise in your workspace* :scroll:",
                "attachments": [
                    {
                        "fallback": "Trouble displaying buttons. Delete message to close.",
                        "callback_id": "tags_list",
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "search_tag_menu_button",
                                "type": "select",
                                "text": "Search tag...",
                                "data_source": "external"
                            },
                            {
                                "name": "tags_list_done_button",
                                "text": "Done",
                                "value": "cancel",
                                "type": "button"
                            }
                        ]
                    }
                ]
            });
        } else {

            database.ref('tags/' + team_id + '/' + selectedTag).once("value").then(snapshot => {
                if (snapshot.val()) {
                    var description = snapshot.child("description").val();
                    var count = snapshot.child("count").val();
                    console.log("Count and Desciption:", count, description);
                    return response.contentType('json').status(OK).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "text": "*Look up expertise in your workspace* :scroll:",
                        "attachments": [
                            {
                                "fallback": "Trouble displaying buttons. Delete message to close.",
                                "callback_id": "tags_list",
                                "attachment_type": "default",
                                "actions": [
                                    {
                                        "name": "search_tag_menu_button",
                                        "type": "select",
                                        "text": "Search tag...",
                                        "data_source": "external",
                                        "selected_options": [
                                            {
                                                "text": snapshot.key,
                                                "value": snapshot.key
                                            }
                                        ]
                                    },
                                    {
                                        "name": "tags_list_done_button",
                                        "text": "Done",
                                        "value": "cancel",
                                        "type": "button"
                                    }
                                ]
                            },
                            {
                                "fallback": snapshot.key + '\n' + description + '\nColleagues using this tag: ' + count,
                                "color": "#3AA3E3",
                                "title": snapshot.key,
                                "text": description + '\nColleagues using this tag: ' + count
                            }
                        ]
                    });
                } else {
                    // Couldn't get tag information.
                   return response.contentType("json").status(OK).send({
                        "response_type": "ephemeral",
                        "replace_original": true,
                        "text": "*Look up expertise in your workspace* :scroll:",
                        "attachments": [
                            {
                                "fallback": "Trouble displaying buttons. Delete message to close.",
                                "callback_id": "tags_list",
                                "attachment_type": "default",
                                "actions": [
                                    {
                                        "name": "search_tag_menu_button",
                                        "type": "select",
                                        "text": "Search tag...",
                                        "data_source": "external"
                                    },
                                    {
                                        "name": "tags_list_done_button",
                                        "text": "Done",
                                        "value": "cancel",
                                        "type": "button"
                                    }
                                ]
                            },
                            {
                                "title": "Trouble getting tag information!",
                                "color": "#FF0000"
                            }
                        ]
                    });
                }

            }).catch(err => {
                if (err) console.log(err);
                return;
            });
        }
    },

    tagsListMenu: function (team_id, queryText, res) {
        // read workspace tags and add to response
        database.ref('tags/' + team_id).orderByChild('tag_code')
            .startAt(queryText.toLowerCase())
            .endAt(queryText.toLowerCase() + "\uf8ff")
            .once("value").then(snapshot => {

                var options = {
                    options: []
                };
                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    options.options.push({
                        "text": childSnapshot.key,
                        "value": childSnapshot.key
                    });
                });
                return res.contentType('json').status(OK).send(options);
            })
            .catch(err => {
                if (err) console.log(err);
                res.contentType('json').status(404).send("Error");
            });
    },

    userTagsMenu: function (team_id, user_id, res) {
        database.ref('users/' + team_id + '/' + user_id + '/tags')
            .once("value").then(snapshot => {

                var options = {
                    options: []
                };
                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    options.options.push({
                        "text": childSnapshot.key,
                        "value": childSnapshot.key
                    });
                });

                return res.contentType('json').status(OK).send(options);
            })
            .catch(err => {
                if (err) console.log(err);
                return;
            });
    }
};
