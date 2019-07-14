const firebase = require('firebase');
const request = require('request');
// Get a reference to the database service
var database = firebase.database();
const OK = 200;
// var visitor = ua('UA-120285659-1', { https: true });

module.exports = {

    /**
     * This function alters the instance of a team id in the database to the new enterprise id
     * given by the team upgrading to a Slack Enterprise Grid. 
     * @param {*} teamId 
     * @param {*} enterpriseId 
     */
    enterpriseMigration: function (teamId, enterpriseId) {

        // Remap the user ids to global user ids.
        database.ref('organizations').orderByChild('slack_team_id').equalTo(teamId).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var orgId = Object.keys(snapshot.val())[0];
                    var data = Object.values(snapshot.val())[0];
                    var token = data.slack_bot_token;
                    var users = data.users;
                    for (user in users) {
                        request.get('https://slack.com/api/migration.exchange?token=' + token + '&users=' + user.third_party.slack_id, (err, res, body) => {
                            if (err) {
                                return console.log(err);
                            } else {
                                let payload = JSON.parse(body);
                                let userId = payload.user_id_map[user.third_party.slack_id];
                                // update the slack_id with the new global user id
                                database.ref('organizations/' + orgId + '/users/').orderByChild('third_party/slack_id').equalTo(userId.key).transaction(user => {
                                    user.third_party.slack_id = userId;
                                    return user;
                                });
                            }
                        });
                    }
                }
                return true;
            }).catch(err => {
                console.error('enterpriseMigration: ',err);
                return;
            });

        // Change installation index information.
        database.ref('organizations').orderByChild('slack_team_id').equalTo(teamId).once('value')
            .then(snapshot => {
                if (snapshot.val() && Object.keys(snapshot.val())[0]) {
                    var orgId = Object.keys(snapshot.val())[0];
                    var data = Object.values(snapshot.val())[0];
                    data[slack_enterprise_id] = enterpriseId;
                    data[slack_team_id] = null;
                    return database.ref('installations' + orgId).update(data);
                }
                return true;
            }).catch(err => {
                console.log(err);
            });


    }
}