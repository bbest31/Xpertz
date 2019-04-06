const request = require('request');
const firebase = require('firebase');
const util = require('./util');
const OK = 200;
const presetTagList = require('./preset_tags');
// Get a reference to the database service
var database = firebase.database();

// Actions executed by our Bot user.
module.exports = {
    /**
     * Onboarding msg direct messaged to a user that joins the workspace triggered by the team_join event type
     * @param {Object} user 
     * @param {String} teamId 
     * @param {Object} res 
     */
    onboardMsg: function (user, teamId, res) {

        var token = undefined;
        database.ref('installations').orderByChild('team').equalTo(teamId).once('value')
        .then(snapshot => {
            if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                token = Object.values(snapshot.val())[0].bot_token;
                //Get DM id
                request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + user.id + '&return_im=true', (err, res, body) => {
                    if (err) {
                        return console.log("Get DM id Err: " + err);
                    } else {

                        let payload = JSON.parse(body);
                        let dmId = payload.channel.id;
                        var msg = '*Welcome to the team* <@' + user.id + ">! Let's show your new colleagues what skills you bring to the team using Xpertz. You can start by using the `/xpertz-help` command to get started.";

                        //Send DM to user
                        request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dmId + '&text=' + encodeURIComponent(msg), (error, res, body) => {
                            if (error) {
                                return console.log(error);
                            } else {
                                // Success when new user joins
                                // console.log(res);
                                return;
                            }
                        });
                    }
                });
            }
           return;
        }).catch(err => {
            if (err) console.log(err);
            res.contentType('json').status(OK).send();
            return;
        });

        res.contentType('json').status(OK).send();
        return;
    },

    /**
     * This method DMs the installing user upon app installation with an initial onboarding message.
     * @param {*} user 
     * @param {*} teamId 
     * @param {*} res 
     */
    onboardInstallerMsg: function (userId, teamId) {
        var token = undefined;
        database.ref('installations').orderByChild('team').equalTo(teamId).once('value')
        .then(snapshot => {
            if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                token = Object.values(snapshot.val())[0].bot_token;
                //Get DM id
                request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + userId, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    } else {

                        let payload = JSON.parse(body);
                        let dmId = payload.channel.id;
                        var msg = "*Thank you for installing Xpertz!*\n\n*Xpertz is utilized using our slash commands that all start with `/xpertz-...`.*\n* Use the `/xpertz-help` command to see a list of all the commands Xpertz has to offer.*\n\n*To get your team started off right we suggest creating a number of tags that you believe will be prevelant amongst your colleagues, in terms of what skills they posses. (A preset tags option is in the works but has not been implemented at the time of this install)*\n\n*Create new expertise tags by using the `/xpertz-add` command then using the _Create New_ button to create one.*\n\n*We believe it's always best to lead by example and advise adding some tags to your profile so your team can see what to aim for!*\n\n*If you have any questions you can contact us on our website http://xpertzsoftware.com/About/#Contact or leave feedback through the `/xpertz-help` command.*";

                        //Send DM to user
                        request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dmId + '&text=' + encodeURIComponent(msg), (error, res, body) => {
                            if (error) {
                                return console.log(error);
                            } else {
                                // Success when new user joins
                                // console.log(res);
                                return;
                            }
                        });
                    }
                });
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            return;
        });
        return;
    },


    /**
     *  Sends a DM to the user by the bot notifying them one of their skills ranked up.
     * @param {*} userId 
     * @param {*} tagName 
     * @param {*} teamId 
     */
    tagRankUp: function (userId, tagName, teamId) {
        database.ref('installations').orderByChild('team').equalTo(teamId).once('value')
        .then(snapshot => {
            if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                token = Object.values(snapshot.val())[0].bot_token;
                //Get DM id
                request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + userId, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    } else {
                        let payload = JSON.parse(body);
                        let dmId = payload.channel.id;
                        var msg = '*Congratulations* <@' + userId + '> *your ' + tagName + ' expertise has ranked up!*';

                        //Send DM to user
                        //TODO change to json body post
                        request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dmId + '&text=' + encodeURIComponent(msg), (error, res, body) => {
                            if (error) {
                                return console.log(error);
                            } else {
                                // Success when new user joins
                                // console.log(res);
                                return;
                            }
                        });
                        return;
                    }
                });
            }
            return;
        }).catch(err => {
            if (err) console.log(err);
            return undefined;
        });

        return;
    }
};
