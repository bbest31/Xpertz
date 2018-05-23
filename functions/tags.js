const util = require('./util');
const firebase = require('firebase');

// Get a reference to the database service
const database = firebase.database();

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  tagsCommand: function(req, res) {
    var token = req.body.token;

    //Validations
    if (util.validateToken(token, res)) {
      //TO DO: Add implementation
    }
  },

  tagsListMenu: function(team_id, queryText, res) {
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

  userTagsMenu: function(team_id, user_id, res) {
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
