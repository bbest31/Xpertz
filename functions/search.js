const util = require('./util');
const firebase = require('firebase');

const ua = require('universal-analytics');
var visitor = ua('UA-120285659-1', { https: true });

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;
const QUERYLIMIT = 15;

module.exports = {

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
    searchCommand: function (req, res) {
        this.sendSearchInitialTagMessage(res);
    },

    /**
     * 
     * @param {*} res 
     */
    sendSearchInitialTagMessage: function (res) {
        res.contentType('json').status(OK).send({
            'response_type': 'ephemeral',
            'replace_original': true,
            'text': '*Search by tag name* :mag:',
            'attachments': [
                {
                    'fallback': 'Interactive menu to search for people with specific tags',
                    'callback_id': 'search_tag',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'actions': [
                        {
                            'name': 'search_tag_menu_button',
                            'text': 'Enter tag name...',
                            'type': 'select',
                            'data_source': 'external',
                            'min_query_length': 1,
                        },
                        {
                            'name': 'cancel_search_button',
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
     * 
     * @param {*} payload 
     * @param {*} res
     * @todo alter for new schema 
     */
    searchTagAction: function (payload, res) {
        var teamID = payload.team.id;
        var enterpriseID = payload.team.enterprise_id;

        switch (payload.actions[0]['name']) {
            case 'search_tag_menu_button':
                visitor.event('Actions', 'Search Tags Menu Selection action').send();
                var selectedOptionSearchTag = payload.actions[0].selected_options[0].value;
                res.contentType('json').status(OK).send({
                    'response_type': 'ephemeral',
                    'replace_original': true,
                    'text': '*Search by tag name* :mag:',
                    'attachments': [
                        {
                            'fallback': 'Interactive menu to search for people with specific tags',
                            'callback_id': 'search_tag',
                            'color': '#3AA3E3',
                            'attachment_type': 'default',
                            'actions': [
                                {
                                    'name': 'search_tag_menu_button',
                                    'text': 'Enter tag name...',
                                    'type': 'select',
                                    'data_source': 'external',
                                    'min_query_length': 1,
                                    'selected_options': [
                                        {
                                            'text': selectedOptionSearchTag,
                                            'value': selectedOptionSearchTag
                                        }
                                    ]
                                },
                                {
                                    'name': 'search_tag_confirm_button',
                                    'text': 'Search',
                                    'type': 'button',
                                    'value': selectedOptionSearchTag,
                                    'style': 'primary'
                                },
                                {
                                    'name': 'cancel_search_button',
                                    'text': 'Cancel',
                                    'type': 'button',
                                    'value': 'cancel'
                                }
                            ]
                        }
                    ]
                });
                break;
            case 'search_tag_confirm_button':
                visitor.event('Actions', 'Search Team Tags Menu Selection action').send();
                var selectedSearchTag = payload.actions[0]['value'];
                this.performSearchAction(teamID, selectedSearchTag, enterpriseID, null, null, res);
                break;
            case 'start_again_search_button':
                visitor.event('Actions', 'Start Search Again action').send();
                this.sendSearchInitialTagMessage(res);
                break;
            case 'see_previous_search_button':
                visitor.event('Actions', 'See Previous Search action').send();
                this.searchPreviousAction(payload, res);
                break;
            case 'see_next_search_button':
                visitor.event('Actions', 'See Next Search action').send();
                this.searchNextAction(payload, res);
                break;
            case 'search_tag_direct_message_button':
                var userID = payload.actions[0]['value'];
                var token = payload.token;
                util.startDirectChat(userID, teamID, token);
                res.status(OK).send();
                break;
        }
    },

    /**
     * 
     * @param {*} teamID 
     * @param {*} tag 
     * @param {*} enterpriseID 
     * @param {*} nextBookmark 
     * @param {*} prevBookmark 
     * @param {*} res
     * @todo alter for new schema 
     */
    // performSearchAction: function (teamID, tag, enterpriseID, nextBookmark, prevBookmark, res) {
        
    //     var id = '';
    //     if (enterpriseID) {
    //         id = enterpriseID;
    //     } else {
    //         id = teamID;
    //     }
    //     database.ref('workspaces').orderByChild('team').equalTo(id).once('value')
    //     .then(snapshot => {
    //         if (snapshot.val() && Object.keys(snapshot.val())[0]) {
    //             var workspaceId = Object.keys(snapshot.val())[0];
    //             return database.ref('workspaces/'+workspaceId+'/tags/').orderByChild('tag').equalTo(tag).once('value')
    //             .then(tagSnapshot => {
    //                 if (tagSnapshot.val() && Object.keys(tagSnapshot.val())[0]) {
    //                     var tagId = Object.keys(tagSnapshot.val())[0];
    //                     var ref = database.ref('workspaces/'+workspaceId+'/tags/'+tagId+'/users/').orderByKey();
    //                     if (nextBookmark) {
    //                         ref = ref.startAt(nextBookmark).limitToFirst(QUERYLIMIT + 1);
    //                     } else if (prevBookmark) {
    //                         ref = ref.endAt(prevBookmark).limitToLast(QUERYLIMIT + 2);
    //                     } else {
    //                         ref = ref.limitToFirst(QUERYLIMIT + 1);
    //                     }
    //                     ref.once('value').then(userSnapshot => {
    //                         if (userSnapshot.val() && Object.values(userSnapshot.val()).length > 0) {

    //                             var options = {
    //                                 options: []
    //                             };
    //                             var nextNewBookmark = null;
    //                             var previousNewBookmark = null;
    //                             var isTherePrevPage = false;
    //                             var count = 0;
    //                             userSnapshot.forEach(childSnapshot => {
    //                                 if (prevBookmark && count === 0 && userSnapshot.numChildren() === QUERYLIMIT + 2) {
    //                                     isTherePrevPage = true;
    //                                 } else if (count < QUERYLIMIT) {
    //                                     var highFiveCount = childSnapshot.val().hi_five_count;
    //                                     var color = '#E0E0E0';
    //                                     var rankEmoji = '';

    //                                     if (highFiveCount >= 5 && highFiveCount < 15) {
    //                                         color = '#F2994A';
    //                                     } else if (highFiveCount >= 15 && highFiveCount < 30) {
    //                                         color = '#6989A7';
    //                                     } else if (highFiveCount >= 30) {
    //                                         color = '#F2C94C';
    //                                         if (highFiveCount >= 50 && highFiveCount < 75) {
    //                                             rankEmoji = ':medal:';
    //                                         } else if (highFiveCount >= 75 && highFiveCount < 100) {
    //                                             rankEmoji = ':sports_medal:';
    //                                         } else if (highFiveCount >= 100 && highFiveCount < 150) {
    //                                             rankEmoji = ':trophy:';
    //                                         } else if (highFiveCount >= 150 & highFiveCount < 250) {
    //                                             rankEmoji = ':gem:';
    //                                         } else if (highFiveCount >= 250) {
    //                                             rankEmoji = ':crown:';
    //                                         }
    //                                     }

    //                                     options.options.push({
    //                                         'fallback': childSnapshot.val().username,
    //                                         'callback_id': 'search_tag',
    //                                         'color': color,
    //                                         'title': '<@' + childSnapshot.val().user_id + '> ' + rankEmoji,
    //                                         // 'actions': [
    //                                         //     {
    //                                         //         'name': 'search_tag_direct_message_button',
    //                                         //         'text': 'Message',
    //                                         //         'type': 'button',
    //                                         //         'value': childSnapshot.key,
    //                                         //         'style': 'primary'
    //                                         //     }
    //                                         // ]
    //                                     });

    //                                     if (isTherePrevPage && count === 1) {
    //                                         previousNewBookmark = childSnapshot.key;
    //                                     }
    //                                 } else {
    //                                     nextNewBookmark = childSnapshot.key;
    //                                 }

    //                                 count++;
    //                             });

    //                             if (userSnapshot.numChildren() === 0) {
    //                                 // If the query was empty
    //                                 return this.sendSearchEmptyMessage(res);
    //                             } else {
    //                                 if (nextBookmark) {
    //                                     previousNewBookmark = nextBookmark;
    //                                 }
    //                                 options.options.splice(0, 0, {
    //                                     'fallback': 'Interactive menu to search for people with specific tags',
    //                                     'callback_id': 'search_tag',
    //                                     'color': '#E8E8E8',
    //                                     'attachment_type': 'default',
    //                                     'text': '*_Results for ' + tag + ' ..._*',
    //                                     'actions': [
    //                                         {
    //                                             'name': 'start_again_search_button',
    //                                             'text': 'Start Again',
    //                                             'type': 'button',
    //                                             'value': 'start_again'
    //                                         },
    //                                         {
    //                                             'name': 'cancel_search_button',
    //                                             'text': 'Cancel',
    //                                             'type': 'button',
    //                                             'value': 'cancel'
    //                                         }
    //                                     ]
    //                                 });
    //                                 return this.sendSearchMessage(options.options, tag, nextNewBookmark, previousNewBookmark, res);
    //                             }
    //                         } else {
    //                             // If the query was empty
    //                             return this.sendSearchEmptyMessage(res);
    //                         }
                            
    //                     });
    //                 } else {
    //                     // If the query was empty
    //                     return this.sendSearchEmptyMessage(res);
    //                 }
    //                 return;
    //             });
    //         } else {
    //             // If the query was empty
    //             return this.sendSearchEmptyMessage(res);
    //         }
    //     })
    //     .catch(err => {
    //         if (err) console.log(err);
    //         return;
    //     });
    // },

    /**
     * Sends the message indicating that the workspace has no tags currently in use.
     */
    sendSearchEmptyMessage: function (res) {
        res.contentType('json').status(OK).send({
            'response_type': 'ephemeral',
            'replace_original': true,
            'attachments': [
                {
                    'fallback': 'Interactive menu to search for people with specific tags - empty state',
                    'callback_id': 'search_tag_empty',
                    'color': '#F21111',
                    'attachment_type': 'default',
                    'text': '*There is currently nobody in your team with this expertise* :worried:',
                },
                {
                    'fallback': 'Interactive menu to search for people with specific tags',
                    'callback_id': 'search_tag',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'text': '*Search by tag name* :mag:',
                    'actions': [
                        {
                            'name': 'search_tag_menu_button',
                            'text': 'Enter tag name...',
                            'type': 'select',
                            'data_source': 'external',
                            'min_query_length': 1,
                        },
                        {
                            'name': 'cancel_search_button',
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
     * Sends the message listing the first 15 tags being used in the workspace and the 'Next' button present.
     */
    sendSearchMessage: function (attachments, tag, bookmarkNext, bookmarkPrevious, res) {

        // Increment global search count
        database.ref('globals').transaction(globalNode => {
            if (globalNode) {
                globalNode.searches++;
            }

            return globalNode;
        });

        if (bookmarkNext && bookmarkPrevious) {
            attachments.push({
                'fallback': 'Buttons to go next or previous',
                'callback_id': 'search_tag',
                'color': '#FFFFFF',
                'attachment_type': 'default',
                'actions': [
                    {
                        'name': 'see_previous_search_button',
                        'text': 'Previous',
                        'type': 'button',
                        'value': bookmarkPrevious + '|' + tag
                    },
                    {
                        'name': 'see_next_search_button',
                        'text': 'Next',
                        'type': 'button',
                        'value': bookmarkNext + '|' + tag
                    }
                ]
            })
        } else if (bookmarkNext) {
            attachments.push({
                'fallback': 'Buttons to go next or previous',
                'callback_id': 'search_tag',
                'color': '#FFFFFF',
                'attachment_type': 'default',
                'actions': [
                    {
                        'name': 'see_next_search_button',
                        'text': 'Next',
                        'type': 'button',
                        'value': bookmarkNext + '|' + tag
                    }
                ]
            })
        } else if (bookmarkPrevious) {
            attachments.push({
                'fallback': 'Buttons to go next or previous',
                'callback_id': 'search_tag',
                'color': '#FFFFFF',
                'attachment_type': 'default',
                'actions': [
                    {
                        'name': 'see_previous_search_button',
                        'text': 'Previous',
                        'type': 'button',
                        'value': bookmarkPrevious + '|' + tag
                    }
                ]
            })
        }
        res.contentType('json').status(OK).send({
            'response_type': 'ephemeral',
            'replace_original': true,
            'callback_id': 'search_tag',
            'attachments': attachments

        });
    },

    searchNextAction: function (payload, res) {
        const teamID = payload.team.id;
        const enterpriseID = payload.team.enterprise_id;
        const value = payload.actions[0]['value'];
        const bookmark = value.substring(0, value.indexOf('|'));
        const tag = value.substring(value.indexOf('|') + 1);

        this.performSearchAction(teamID, tag, enterpriseID, bookmark, null, res);
    },

    searchPreviousAction: function (payload, res) {
        const teamID = payload.team.id;
        const enterpriseID = payload.team.enterprise_id;
        const value = payload.actions[0]['value'];
        const bookmark = value.substring(0, value.indexOf('|'));
        const tag = value.substring(value.indexOf('|') + 1);

        this.performSearchAction(teamID, tag, enterpriseID, null, bookmark, res);
    },
};

