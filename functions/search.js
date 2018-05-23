const util = require('./util');

const UNAUTHORIZED = 401;
const OK = 200;

module.exports = {

  searchCommand: function (req, res) {
    var token = req.body.token;

    //Validations
    if (util.validateToken(token, res)) {
        sendSearchInitialTagMessage(res);
    }
  },

  sendSearchInitialTagMessage: function (res) {
      res.contentType('json').status(OK).send({
          "response_type": "ephemeral",
          "replace_original": true,
          "text": "*Search by tag name* :mag:",
          "attachments": [
              {
                  "fallback": "Interactive menu to search for people with specific tags",
                  "callback_id": "search_tag",
                  "color": "#3AA3E3",
                  "attachment_type": "default",
                  "actions": [
                      {
                          "name": "search_tag_menu_button",
                          "text": "Enter tag name...",
                          "type": "select",
                          "data_source": "external",
                          "min_query_length": 1,
                      },
                      {
                          "name": "cancel_search_button",
                          "text": "Cancel",
                          "type": "button",
                          "value": "cancel"
                      }
                  ]
              }
          ]
      });
  },

  searchTagAction: function (payload, res) {
    switch (payload.actions[0]["name"]) {
        case "search_tag_menu_button":
            var selectedOptionSearchTag = payload.actions[0].selected_options[0].value;
            break;
        case "search_tag_filter_menu_button":
            break;
    }
  }

};
