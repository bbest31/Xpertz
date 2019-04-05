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
        database.ref('tags').orderByChild('team').startAt(id).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
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

            database.ref('tags').orderByChild('team').startAt(id).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var workspaceId = Object.keys(snapshot.val())[0];
                    return database.ref('tags/'+workspaceId+'/tags/').orderByChild('tag_title').startAt(selectedTag).once('value')
                    .then(tagSnapshot => {
                        if (tagSnapshot.val() && Object.values(tagSnapshot.val())[0]) {
                            var tagObject = Object.values(tagSnapshot.val())[0];
                            var description = tagObject.description;
                            var count = tagObject.count;
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
                                                        'text': tagObject.tag_title,
                                                        'value': tagObject.tag_title
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
                                        'fallback': tagObject.tag_title + '\n' + description + '\nColleagues using this tag: ' + count,
                                        'color': '#3AA3E3',
                                        'title': tagObject.tag_title,
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
                } else {
                    throw new Error;
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

            database.ref('tags').orderByChild('team').startAt(id).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var workspaceId = Object.keys(snapshot.val())[0];
                    return database.ref('tags/'+workspaceId+'/tags/').orderByChild('tag_title').startAt(selectedTag).once('value')
                    .then(tagSnapshot => {
                        if (tagSnapshot.val() && Object.values(tagSnapshot.val())[0]) {
                            var tagObject = Object.values(tagSnapshot.val())[0];
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
                                                        'text': tagObject.tag_title,
                                                        'value': tagObject.tag_title
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
                } else {
                    throw new Error;
                }
            }).catch(err => {
                if (err) console.log(err);
                return;
            });
        }
    },

    tagsListMenu: function (teamID, enterpriseID, queryText, res) {
        var id = '';
        if (enterpriseID) {
            id = enterpriseID;
        } else {
            id = teamID;
        }

        database.ref('tags').orderByChild('team').startAt(id).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var workspaceId = Object.keys(snapshot.val())[0];
                    return database.ref('tags/'+workspaceId+'/tags/').orderByChild('tag_code')
                    .startAt(queryText.toLowerCase())
                    .endAt(queryText.toLowerCase() + '\uf8ff').once('value')
                    .then(tagSnapshot => {
                        if (tagSnapshot.val() && Object.values(tagSnapshot.val()).length > 0) {
                            var options = {
                                options: []
                            };

                            // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                            Object.values(tagSnapshot.val()).forEach(childSnapshot => {
                                options.options.push({
                                    'text': childSnapshot.tag_title,
                                    'value': childSnapshot.tag_title
                                });
                            });

                            return res.contentType('json').status(OK).send(options);
                        } else {
                            throw new Error;
                        }
                    })
                    .catch(err => {
                        if (err) console.log(err);
                        res.contentType('json').status(404).send('Error');
                    });
                } else {
                    throw new Error;
                }
            })
            .catch(err => {
                if (err) console.log(err);
                res.contentType('json').status(404).send('Error');
            });
    },

    userTagsMenu: function (teamID, userID, enterpriseID, res) {
        var id = '';
        if (enterpriseID) {
            id = enterpriseID;
        } else {
            id = teamID;
        }

        database.ref('workspaces').orderByChild('team').startAt(id).once('value')
        .then(snapshot => {
            if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                var workspaceId = Object.keys(snapshot.val())[0];
                return database.ref('workspaces/'+workspaceId+'/users/').orderByChild('user_id').startAt(userID).once('value')
                .then(userSnapshot => {
                    if (userSnapshot.val() && Object.keys(userSnapshot.val())[0]) {
                        var userId = Object.keys(userSnapshot.val())[0];
                        return database.ref('workspaces/'+workspaceId+'/users/'+userId+"/tags").once('value')
                        .then(tagSnapshot => {
                            if (tagSnapshot.val() && Object.values(tagSnapshot.val()).length > 0) {
                                var options = {
                                    options: []
                                };
                                // Loop through tag child nodes and add each node key as text and value as the lower case of the key for option items in the response.
                                Object.values(tagSnapshot.val()).forEach(childSnapshot => {
                                    options.options.push({
                                        'text': childSnapshot.tag_title,
                                        'value': childSnapshot.tag_title
                                    })
                                });

                                return res.contentType('json').status(OK).send(options);
                            } else {
                                throw new Error;
                            }
                        })
                        .catch(err => {
                            if (err) console.log(err);
                            return;
                        });
                    } else {
                        throw new Error;
                    }
                })
                .catch(err => {
                    if (err) console.log(err);
                    return;
                });
            } else {
                throw new Error;
            }
        })
        .catch(err => {
            if (err) console.log(err);
            return;
        });
    }
};
