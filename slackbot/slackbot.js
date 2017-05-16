var SlackBot = require('slackbots');

var bot = new SlackBot({
  token: process.env.SLACKBOT_TOKEN,
  name: 'Confluence'
});

var helpers = {
  formatTasks: function(tasks) {
    return new Promise(function(resolve, reject) {
      let formattedTasks = []

      // confluence URL with stripped special chars for regex
      let escapedURL = process.env.CONFLUENCE_URL.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // @user translates to url/wiki/display/~user from tasks endpoint
      let userMention = new RegExp(escapedURL + '\/display\/~[a-zA-Z]+\\s', "i")
      // match the last date in format DD MMM DDDD
      let date = new RegExp('\\d{2,2}\\s[A-Za-z]{3,3}\\s\\d{4,4}(?!.*\\d{2,2}\\s[A-Za-z]{3,3}\\s\\d{4,4})')

      tasks.forEach((task, index) => {
        task.date = (task.title.match(date)) ? task.title.match(date)[0] : 'none'
        task.title = task.title.replace(userMention, '').replace(date, '')

        formattedTasks.push(task)
        if (index + 1 == tasks.length) {
          return resolve(formattedTasks)
        }
      })
    });
  },
  transformTasksIntoAttachments: function(tasks) {
    let attachments = []
    return new Promise(function(resolve, reject) {
      tasks.forEach((task, index) => {
        let titleField = {
          title: "Task",
          value: task.title,
          short: true
        }
        let dateField = {
          title: "Due Date",
          value: task.date,
          short: true
        }

        // group slack attachments by confluence page
        let existingAttachments = attachments.filter(attachment => {
          return attachment.title_link == `${process.env.CONFLUENCE_URL}${task.item.url}`;
        });

        if (existingAttachments.length > 0) {
          existingAttachments[0].fields.push(titleField, dateField)
        } else {
          attachments.push({
            fallback: task.title,
            title: task.item.title,
            title_link: `${process.env.CONFLUENCE_URL}${task.item.url}`,
            fields: [ titleField, dateField ]
          })
        }
        if (index + 1 == tasks.length) {
          return resolve(attachments)
        }
      })
    });
  }
}

var functions = {
  postMessageToUser: function(username, msg) {
    return new Promise(function(resolve, reject) {
      bot.postMessageToUser(username, msg, function(data) {
        return resolve(data)
      });
    });
  },
  sendTasksToUser: function(username, tasks) {
    return new Promise(function(resolve, reject) {
      helpers.formatTasks(tasks).then(formattedTasks => {

        helpers.transformTasksIntoAttachments(formattedTasks).then(attachments => {
          let params = {}
          params.attachments = JSON.stringify(attachments)

          bot.postMessageToUser(username, ':memo: Here are your open Confluence Tasks', params, function(data) {
            return resolve(data)
          })
        })

      })
    });
  }
}

module.exports = functions;
