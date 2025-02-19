const util = require('./util');
const firebase = require('firebase');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

    tagsCommand: function (req, res, id) {
        this.sendTagListMessage(res,id);
    },


    tagsSelectAction: function (payload, res) {
        const teamID = payload.team.id;
        const selectedTag = payload.actions[0].selected_options[0].value;
        const enterpriseID = payload.team.enterprise_id;
        this.sendTagListMessage(res, teamID, enterpriseID, selectedTag);
    },

    /**
     * Tag List message from /tags which provide menu button to look up in-use tags of workspace.
     * If a selectedTagCode is provided we populate the selected attribute of the menu button and show
     * the tag details to the user.
     */
    sendTagListMessage: function (response, teamID, enterpriseID, selectedTag) {

        //Check if there are any tags in the workspace

        var id = '';
        if (enterpriseID) {
            id = enterpriseID;
        } else {
            id = teamID;
        }

        var ref = 'tags/' + id;
        database.ref(ref).once('value').then(snapshot => {
            if (snapshot.exists()) {
                // Team has existing tags
                this.tagListResponse(response, id, selectedTag);
            } else {
                // No tags exist for this team
                this.tagListNoTagsResponse(response, id, selectedTag);
            }
            return;
        }).catch(err => {
            console.log(err);
        });

    },

    tagListResponse: function (response, id, selectedTag) {

        if (selectedTag === undefined) {
            // No selected tag
            response.contentType('json').status(OK).send({
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': '*Look up expertise in your workspace* :scroll:',
                'attachments': [
                    {
                        'fallback': 'Trouble displaying buttons. Delete message to close.',
                        'callback_id': 'tags_list',
                        'attachment_type': 'default',
                        'actions': [
                            {
                                'name': 'search_tag_menu_button',
                                'type': 'select',
                                'text': 'Search tag...',
                                'data_source': 'external'
                            },
                            {
                                'name': 'tags_list_done_button',
                                'text': 'Done',
                                'value': 'cancel',
                                'type': 'button'
                            }
                        ]
                    }
                ]
            });
        } else {

            var ref = 'tags/' + id + '/';
            ref += util.groomKeyToFirebase(selectedTag);

            database.ref(ref).once('value').then(snapshot => {
                if (snapshot.val()) {
                    var description = snapshot.child('description').val();
                    var count = snapshot.child('count').val();
                    return response.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Look up expertise in your workspace* :scroll:',
                        'attachments': [
                            {
                                'fallback': 'Trouble displaying buttons. Delete message to close.',
                                'callback_id': 'tags_list',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'search_tag_menu_button',
                                        'type': 'select',
                                        'text': 'Search tag...',
                                        'data_source': 'external',
                                        'selected_options': [
                                            {
                                                'text': util.groomKeyFromFirebase(snapshot.key),
                                                'value': util.groomKeyFromFirebase(snapshot.key)
                                            }
                                        ]
                                    },
                                    {
                                        'name': 'tags_list_done_button',
                                        'text': 'Done',
                                        'value': 'cancel',
                                        'type': 'button'
                                    }
                                ]
                            },
                            {
                                'fallback': util.groomKeyFromFirebase(snapshot.key) + '\n' + description + '\nColleagues using this tag: ' + count,
                                'color': '#3AA3E3',
                                'title': util.groomKeyFromFirebase(snapshot.key),
                                'text': description + '\nColleagues using this tag: ' + count
                            }
                        ]
                    });
                } else {
                    // Couldn't get tag information.
                    return response.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Look up expertise in your workspace* :scroll:',
                        'attachments': [
                            {
                                'fallback': 'Trouble displaying buttons. Delete message to close.',
                                'callback_id': 'tags_list',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'search_tag_menu_button',
                                        'type': 'select',
                                        'text': 'Search tag...',
                                        'data_source': 'external'
                                    },
                                    {
                                        'name': 'tags_list_done_button',
                                        'text': 'Done',
                                        'value': 'cancel',
                                        'type': 'button'
                                    }
                                ]
                            },
                            {
                                'title': 'Trouble getting tag information!',
                                'color': '#FF0000'
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

    tagListNoTagsResponse: function (response, id, selectedTag) {
        if (selectedTag === undefined) {
            // No selected tag
            response.contentType('json').status(OK).send({
                'response_type': 'ephemeral',
                'replace_original': true,
                'text': '*Look up expertise in your workspace* :scroll:',
                'attachments': [
                    {
                        'fallback': 'Trouble displaying buttons. Delete message to close.',
                        'callback_id': 'tags_list',
                        'attachment_type': 'default',
                        'actions': [
                            {
                                'name': 'search_tag_menu_button',
                                'type': 'select',
                                'text': 'Search tag...',
                                'data_source': 'external'
                            },
                            {
                                'name': 'tags_list_done_button',
                                'text': 'Done',
                                'value': 'cancel',
                                'type': 'button'
                            }
                        ]
                    },
                    {
                        'fallback': 'This team has no tags yet!',
                        'text': 'This team seems to not have any expertise tags yet!'

                    }
                ]
            });
        } else {

            var ref = 'tags/' + id + '/';
            ref += util.groomKeyToFirebase(selectedTag);

            database.ref(ref).once('value').then(snapshot => {
                if (snapshot.val()) {
                    return response.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Look up expertise in your workspace* :scroll:',
                        'attachments': [
                            {
                                'fallback': 'Trouble displaying buttons. Delete message to close.',
                                'callback_id': 'tags_list',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'search_tag_menu_button',
                                        'type': 'select',
                                        'text': 'Search tag...',
                                        'data_source': 'external',
                                        'selected_options': [
                                            {
                                                'text': util.groomKeyFromFirebase(snapshot.key),
                                                'value': util.groomKeyFromFirebase(snapshot.key)
                                            }
                                        ]
                                    },
                                    {
                                        'name': 'tags_list_done_button',
                                        'text': 'Done',
                                        'value': 'cancel',
                                        'type': 'button'
                                    }
                                ]
                            },
                            {
                                'fallback': 'This team has no tags yet!',
                                'text': 'This team seems to not have any expertise tags yet!'

                            }
                        ]
                    });
                } else {
                    // Couldn't get tag information.
                    return response.contentType('json').status(OK).send({
                        'response_type': 'ephemeral',
                        'replace_original': true,
                        'text': '*Look up expertise in your workspace* :scroll:',
                        'attachments': [
                            {
                                'fallback': 'Trouble displaying buttons. Delete message to close.',
                                'callback_id': 'tags_list',
                                'attachment_type': 'default',
                                'actions': [
                                    {
                                        'name': 'search_tag_menu_button',
                                        'type': 'select',
                                        'text': 'Search tag...',
                                        'data_source': 'external'
                                    },
                                    {
                                        'name': 'tags_list_done_button',
                                        'text': 'Done',
                                        'value': 'cancel',
                                        'type': 'button'
                                    }
                                ]
                            },
                            {
                                'title': 'Trouble getting tag information!',
                                'color': '#FF0000'
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

    tagsListMenu: function (teamID, enterpriseID, queryText, res) {
        var ref = 'tags/';
        if (enterpriseID) {
            ref += enterpriseID;
        } else {
            ref += teamID;
        }

        // read workspace tags and add to response
        database.ref(ref).orderByChild('tag_code')
            .startAt(queryText.toLowerCase())
            .endAt(queryText.toLowerCase() + '\uf8ff')
            .once('value').then(snapshot => {

                var options = {
                    options: []
                };

                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    options.options.push({
                        'text': util.groomKeyFromFirebase(childSnapshot.key),
                        'value': util.groomKeyFromFirebase(childSnapshot.key)
                    });

                });

                return res.contentType('json').status(OK).send(options);
            })
            .catch(err => {
                if (err) console.log(err);
                res.contentType('json').status(404).send('Error');
            });
    },

    userTagsMenu: function (teamID, userID, enterpriseID, res) {

        var ref = 'workspaces/';
        if (enterpriseID) {
            ref += enterpriseID + '/';
        } else {
            ref += teamID + '/';
        }
        ref += 'users/' + userID + '/tags';

        database.ref(ref)
            .once('value').then(snapshot => {

                var options = {
                    options: []
                };
                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                snapshot.forEach(childSnapshot => {
                    options.options.push({
                        'text': util.groomKeyFromFirebase(childSnapshot.key),
                        'value': util.groomKeyFromFirebase(childSnapshot.key)
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
