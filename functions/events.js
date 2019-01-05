const request = require('request');
const firebase = require('firebase');
const util = require('./util');
const bot = require('./bot');
// Get a reference to the database service
var database = firebase.database();
// var visitor = ua('UA-120285659-1', { https: true });

module.exports = {
    /**
     * Initiates an onboarding message from the bot to a new user to encourage them to user Xpertz.
     * @param {*} user 
     * @param {*} res 
     */
    teamJoin: function (user, res) {
        var teamID = user.team_id;
        var enterpriseID = user.enterprise_id;
        var id = null;
        if (enterpriseID) {
            id = enterpriseID;
        } else if (teamID) {
            id = teamID;
        }
        console.log('About to validate the team Access');
        // Not a bot user joined
        if (user.is_bot === false) {
            util.validateTeamAccess(id, res, hasAccess => {
                // visitor.event('Event', 'team_join event').send();
                bot.onboardMsg(user, id, res);
            });
        }
    },

    /**
     * This function checks whether the user has been reactivated or deactivated in order to alter the necessary population
     * stats for a Slack team. This includes the user count for their tags within the workspace.
     * @param {*} user 
     * @param {*} res 
     */
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

    },
    /**
     * This function alters the instance of a team id in the database to the new enterprise id
     * given by the team upgrading to a Slack Enterprise Grid. 
     * @param {*} teamID 
     * @param {*} enterpriseID 
     */
    enterpriseMigration: function (teamID, enterpriseID) {

        // Remap the user ids to global user ids.
        var tokenRef = database.ref('installations/' + teamID);
        tokenRef.child('bot_token').once('value').then(snapshot => {
            var token = snapshot.val();
            var teamUserRef = database.ref('workspaces/' + teamID + '/users');
            teamUserRef.once('value').then(snapshot => {
                var data = snapshot.val();
                var update = {};
                var userRequestString = '';
                data.forEach(user => {
                    userRequestString.concat(user.key + ',');
                });
                // strip last comma
                userRequestString = userRequestString.slice(0, -1);
                // Get the id mappings
                request.get('https://slack.com/api/migration.exchange?token=' + token + '&users=' + userRequestString, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    } else {
                        let payload = JSON.parse(body);
                        var userIdMap = body.user_id_map;
                        // Use new Id map to create the update to the user index using new global ids.
                        data.forEach(user => {
                            let globalID = userIdMap[user.key];
                            update[globalID] = user.val();
                        });
                        // Update user index.
                        return teamUserRef.update(update);
                    }
                });
                return null;
            }).catch(err => {
                console.log(err);
            });
            return console.log(teamID + ' local user Ids remapped successfully.');
        }).catch(err => {
            return console.log(err);
        });

        // Change in feedback id instance
        var feedbackRef = database.ref('feedback');
        feedbackRef.child(teamID).once('value').then(snapshot => {
            var data = snapshot.val();
            var update = {};
            update[teamID] = null;
            update[enterpriseID] = data;
            return feedbackRef.update(update);
        }).catch(err => {
            console.log(err);
        });

        // Change key in tags index
        var tagsRef = database.ref('tags');
        tagsRef.child(teamID).once('value').then(snapshot => {
            var data = snapshot.val();
            var update = {};
            update[teamID] = null;
            update[enterpriseID] = data;
            return tagsRef.update(update);
        }).catch(err => {
            console.log(err);
        });

        // Change key in workspaces index
        var workspaceRef = database.ref('workspaces');
        workspaceRef.child(teamID).once('value').then(snapshot => {
            var data = snapshot.val();
            var update = {};
            update[teamID] = null;
            update[enterpriseID] = data;
            return workspaceRef.update(update);
        }).catch(err => {
            console.log(err);
        });

        // Change key in workspaces index
        var usersRef = database.ref('users');
        var teamUsersArray = [];
        usersRef.once('value').then(snapshot => {
            snapshot.forEach(user => {
                // Check to see if the user belongs to the team migrating.
                var data = user.val();
                var teams = data.teams;
                var pos = teams.indexOf(teamID);
                if (pos !== -1) {
                    teamUsersArray.push(user.key);
                }
            }).catch(err => {
                console.log(err);
            });

            // Take all the users who have this team in their teams list and update.
            teamUsersArray.forEach(user => {
                var ref = database.ref('users/' + user);
                ref.once('value').then(snapshot => {
                    var data = snapshot.val();
                    // Clone array then alter it to include new enterprise id.
                    var update = {}
                    var newTeams = data.teams.splice(0);
                    var pos = newTeams.indexOf(teamID);
                    newTeams.splice(pos, 1);
                    newTeams.push(enterpriseID);
                    update['teams'] = newTeams;

                    return ref.update(update);

                }).catch(err => {
                    console.log(err);
                });
            });
            return;
        }).catch(err => {
            console.log(err);
        });

        // Change installation index information.
        var installRef = database.ref('installations');
        installRef.child(teamID).once('value').then(snapshot => {
            var data = snapshot.val();
            data.team = enterpriseID;
            var update = {};
            update[teamID] = null;
            update[enterpriseID] = data;
            return installRef.update(update);
        }).catch(err => {
            console.log(err);
        });



    }
}