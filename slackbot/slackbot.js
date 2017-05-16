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
        attachments.push({
          fallback: task.title,
          fields: [
            {
              title: "Task",
              value: task.title,
              short: true
            },
            {
              title: "Due Date",
              value: task.date,
              short: true
            }
          ]
        })
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
        console.log(data)
        return resolve(data)
      });
    });
  },
  sendTasksToUser: function(username, tasks) {
    return new Promise(function(resolve, reject) {
      helpers.formatTasks(tasks).then(formattedTasks => {
        console.log(formattedTasks)
        helpers.transformTasksIntoAttachments(formattedTasks).then(attachments => {
          let params = {}
          params.attachments = JSON.stringify(attachments)

          bot.postMessageToUser(username, formattedTasks[0].title, params, function(data) {
            return resolve(data)
          })
        })
        // helpers.transformTasksIntoAttachments(formattedTasks).then(attachments => {
        //
        // })

      })
    });
  }
}

module.exports = functions;
