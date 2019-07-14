const request = require('request');
const firebase = require('firebase');
const util = require('./util');
const OK = 200;
// Get a reference to the database service
var database = firebase.database();

// Actions executed by our Bot user.
module.exports = {
    /**
     * This method DMs the installing user upon app installation with an initial onboarding message.
     * @param {*} user 
     * @param {*} teamId 
     * @param {*} res
     */
    onboardInstallerMsg: function (userId, teamId) {
        var token = undefined;
        database.ref('organizations').orderByChild('slack_team_id').equalTo(teamId).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.values(snapshot.val()).length > 0) {
                    token = Object.values(snapshot.val())[0].slack_bot_token;
                    //Get DM id
                    request.get('https://slack.com/api/conversations.open?token=' + token + '&users=' + userId, (err, res, body) => {
                        if (err) {
                            return console.log(err);
                        } else {

                            let payload = JSON.parse(body);
                            let dmId = payload.channel.id;
                            var msg = "*Your Slack workspace is now linked to your Xpertz organization!*\n\n*Xpertz is utilized in Slack using our slash commands that all start with `/xpertz-...`.*\n* Use the `/xpertz-help` command to see a list of all the commands Xpertz has to offer.*";

                            //Send DM to user
                            request.post('https://slack.com/api/chat.postMessage?token=' + token + '&channel=' + dmId + '&text=' + encodeURIComponent(msg), (error, res, body) => {
                                if (error) {
                                    return console.error("onbaordInstallerMsg|https://slack.com/api/chat.postMessage?", error);
                                } else {
                                    // Success when new user joins
                                    // console.log(res);
                                    return true;
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

};
