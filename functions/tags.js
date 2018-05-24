const util = require('./util');
const firebase = require('firebase');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;
const QUERYLIMIT = 16;

module.exports = {

    tagsCommand: function (req, res) {
        var token = req.body.token;

        //Validations
        if (util.validateToken(token, res)) {
            var team_id = req.body.team_id;

            database.ref('tags/' + team_id).orderByChild('tag_code')
                .limitToFirst(QUERYLIMIT)
                .once("value").then(snapshot => {
                    var options = {
                        attachments: []
                    };
                    var paginationBookmark = "";
                    var count = 1;
                    snapshot.forEach(childSnapshot => {
                        if (count !== QUERYLIMIT) {
                            options.options.push({
                                "fallback": childSnapshot.tag_title + '\n' + childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count,
                                "color": "#3AA3E3",
                                "title": childSnapshot.tag_title,
                                "text": childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count
                            });
                        } else if (count === QUERYLIMIT) {
                            paginationBookmark = childSnapshot.tag_code;
                        }

                        count++;
                    });

                    if (snapshot.numChildren() === 0) {
                        // If the query was empty
                        return this.sendTagListEmptyMessage(res);
                    } else if (snapshot.numChildren() < QUERYLIMIT) {
                        // If the query retrieved some tags but will not have a second page to paginate to.
                        return this.sendTagListSingleMessage(res, options.attachments);
                    } else {
                        return this.sendTagListNextMessage(res, options.attachments, paginationBookmark);
                    }
                }).catch(err => {
                    if (err) console.log(err);
                    return;
                });
        }
    },

    /**
     * Sends the message indicating that the workspace has no tags currently in use.
     */
    sendTagListEmptyMessage: function (res) {
        res.contentType('json').status(OK).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "_There are currently no expertise in your workspace_ :cry:",
            "attachments":[
                {
                    "name":"tags_list_done_button",
                    "text":"Done",
                    "value":"cancel",
                    "type":"button"
                }
            ]
        });
    },

    /**
     * Initial message sent when the workspace has less than or equal to 15 tags.
     * Neither the 'Next' or 'Previous' button are present.
     */
    sendTagListSingleMessage: function (res, attachments) {
        res.contentType('json').status(OK).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Expertise in your workspace* :scroll:",
            "callback_id": "tags_list",
            "attachments": attachments
        });
    },

    /**
     * Sends the message listing the first 15 tags being used in the workspace and the 'Next' button present.
     */
    sendTagListNextMessage: function (res, attachments, bookmark) {
        attachments.push({
            "actions": [
                {
                    "name": "tags_next_button",
                    "text": "Next",
                    "type": "button",
                    "value": bookmark
                },
                {
                    "name":"tags_list_done_button",
                    "text":"Done",
                    "value":"cancel",
                    "type":"button"
                }
            ]
        })
        res.contentType('json').status(OK).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Expertise in your workspace* :scroll:",
            "callback_id": "tags_list",
            "attachments": attachments

        });
    },

    tagsNextAction: function (payload, res) {
        const team_id = payload.team.id;
        const bookmark = payload.actions[0]["value"];

        database.ref('tags/' + team_id).orderByChild('tag_code')
            .startAt(bookmark)
            .limitToFirst(QUERYLIMIT)
            .once("value").then(snapshot => {
                var options = {
                    options: []
                };

                var index = 1;
                var paginationNext = "";
                var paginationPrevious = "";

                snapshot.forEach(childSnapshot => {
                    if (index === 1) {
                        options.options.push({
                            "fallback": childSnapshot.tag_title + '\n' + childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count,
                            "color": "#3AA3E3",
                            "title": childSnapshot.tag_title,
                            "text": childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count
                        });
                        paginationPrevious = childSnapshot.tag_code;

                    } else if (index !== QUERYLIMIT) {
                        options.options.push({
                            "fallback": childSnapshot.tag_title + '\n' + childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count,
                            "color": "#3AA3E3",
                            "title": childSnapshot.tag_title,
                            "text": childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count
                        });
                    } else if (index === QUERYLIMIT) {
                        paginationNext = childSnapshot.tag_code;
                    }

                    index++;

                });

                if (snapshot.numChildren() < QUERYLIMIT) {
                    // This page is the last page.
                    return this.sendTagListPreviousMessage(res, options, paginationPrevious);
                } else {
                    //Still another page after this.
                    return this.sendTagListNextAndPreviousMessage(res, options.options, paginationNext, paginationPrevious);
                }

            }).catch(err => {
                if (err) console.log(err);
                return;
            });


    },

    tagsPreviousAction: function (payload, res) {
        const team_id = payload.team.id;
        const bookmark = payload.actions[0]["value"];

        database.ref('tags/' + team_id).orderByChild('tag_code')
            .endAt(bookmark)
            .limitToLast(QUERYLIMIT)
            .once("value").then(snapshot => {
                var options = {
                    options: []
                };

                var paginationNext = "";
                var paginationPrevious = "";
                var index = 1;

                snapshot.forEach(childSnapshot => {
                    if (index !== QUERYLIMIT) {
                        options.options.push({
                            "fallback": childSnapshot.tag_title + '\n' + childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count,
                            "color": "#3AA3E3",
                            "title": childSnapshot.tag_title,
                            "text": childSnapshot.description + '\nColleagues using this tag: ' + childSnapshot.count
                        });
                    } else if (index === QUERYLIMIT) {
                        paginationNext = childSnapshot.tag_code;
                    }
                });

                // Handle when the previous page we are sending is the first one
                return this.sendTagListNextMessage(res, options.options, paginationNext);

            }).catch(err => {
                if (err) console.log(err);
                return;
            });

    },

    /**
     * Sends tag list message when there is a 'Next' and 'Previous' page to paginate to.
     */
    sendTagListNextAndPreviousMessage: function (res, options, nextBookmark, previousBookmark) {
        res.contentType('json').status(OK).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Expertise in your workspace* :scroll:",
            "callback_id": "tags_list",
            "attachments": [
                {
                    "actions": [
                        {
                            "name": "tags_next_button",
                            "text": "Next",
                            "type": "button",
                            "value": nextBookmark
                        },
                        {
                            "name": "tags_previous_button",
                            "text": "Previous",
                            "type": "button",
                            "value": previousBookmark
                        }
                    ]
                },
                options
            ]
        });
    },

    /**
     * Sends tag list message when at the end of the tag list with no 'Next' button.
     */
    sendTagListPreviousMessage: function (res, options, previousBookmark) {
        res.contentType('json').status(OK).send({
            "response_type": "ephemeral",
            "replace_original": true,
            "text": "*Expertise in your workspace* :scroll:",
            "callback_id": "tags_list",
            "attachments": [
                {
                    "actions": [
                        {
                            "name": "tags_previous_button",
                            "text": "Previous",
                            "type": "button",
                            "value": previousBookmark
                        }
                    ]
                },
                options
            ]
        });
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
                return;
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
