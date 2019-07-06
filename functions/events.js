const firebase = require('firebase');
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
     * @todo remap slack user ids to global id versions
     */
    enterpriseMigration: function (teamId, enterpriseId) {

        // Remap the user ids to global user ids.


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