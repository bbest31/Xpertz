const request = require('request');
const firebase = require('firebase');
const util = require('./util');
const bot = require('./bot');
// Get a reference to the database service
var database = firebase.database();
// var visitor = ua('UA-120285659-1', { https: true });

module.exports = {
    teamJoin: function (user, res) {
        var teamID = user.team_id;
        var enterpriseID = user.enterprise_id;
        var id = null;
        if (enterpriseID) {
            id = enterpriseID;
        } else if (teamID) {
            id = teamID;
        }

        // Not a bot user joined
        if (user.is_bot === false) {
            util.validateTeamAccess(id, res, hasAccess => {
                // visitor.event('Event', 'team_join event').send();
                bot.onboardMsg(user,id, res);
            });
        }
    },
    
    userChange: function (user, res) {

        var deleted = user.deleted;
        var userEmail = user.profile.email;
        var teamID = user.team_id;
        var enterpriseID = user.enterprise_id;
        var id = null;
        if (enterpriseID) {
            id = enterpriseID;
        } else if (teamID) {
            id = teamID;
        }

        // Not a bot user
        if (user.is_bot === false) {
            util.validateTeamAccess(id, res, hasAccess => {
                // visitor.event('Event', 'user_change event').send();
                if (deleted) {
                    // Set active attribute of user index to false
                    database.ref('workspaces/' + id + '/users/' + user.user_id).transaction(userJson => {
                        if (userJson.active !== undefined) {
                            if (userJson.active) {
                                userJson.active = false;

                                // Update count of active users
                                // Obtain tags from user we need to decrement.
                                var userTags = userJson.tags;
                                // For each of the user tags decrement the count of the active users in the team index of that tag
                                for (var tag in userTags) {
                                    database.ref('tags/' + id + '/' + tag).transaction(tagValue => {
                                        if (tagValue !== null) {
                                            tagValue.count--;
                                        }
                                        return tagValue;
                                    });
                                }

                            }

                        } else {
                            // User index does not have active attribute so we set one
                            userJson.active = false;
                        }
                        res.status(OK).send();
                        return userJson;
                    });

                } else {
                    // Deleted attribute was false
                    // Check db active status of user incase this was a user rejoining the team.
                    database.ref('workspaces/' + id + '/users/' + user.user_id).transaction(userJson => {
                        if (userJson.active !== undefined) {
                            if (!userJson.active) {

                                userJson.active = true;

                                // Update count of active users
                                // Obtain tags from user we need to increment.
                                var userTags = userJson.tags;
                                // For each of the user tags increment the count of the active users in the team index of that tag
                                for (var tag in userTags) {
                                    database.ref('tags/' + id + '/' + tag).transaction(tagValue => {
                                        if (tagValue !== null) {
                                            tagValue.count++;
                                        }
                                        return tagValue;
                                    });
                                }
                            }
                        } else {
                            userJson.active = true;
                        }
                        res.status(OK).send();
                        return userJson;
                    });
                }
                

                //TODO Migration Event
            });
        }

    }
};