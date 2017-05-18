const
  SlackBot = require('slackbots'),
  user = require('../user'),
  confluence = require('../confluence'),
  APP_URL = process.env.APP_URL || `http://localhost:5000/`;

var bot = new SlackBot({
  token: process.env.SLACKBOT_TOKEN,
  name: 'Confluence'
});

bot.on('message', function(message) {
  // all ingoing events https://api.slack.com/rtm
  if (message.type == 'message' && message.user != null) {
    console.log('got a message', message)
    switch(message.text) {
      case 'tasks':
      helpers.getUsernameFromId(message.user).then(username => {
        user.getBySlackUsername(username).then(user => {
          if (!user) {
            bot.postMessageToUser(username, `You need to signup first. Signup by <${APP_URL}signup|clicking here>`)
          } else {
            confluence.getTasks(user.confluenceCredentials).then(tasks => {
              if (tasks.length === 0) {
                let noTasksMsg = ":thumbsup: No open tasks! You're all caught up!"
                bot.postMessageToUser(username, noTasksMsg)
              } else {
                functions.sendTasksToUser(username, tasks) //we need the user to send random string query param
              }
            })
          }
        })
      })
      break;
      case 'settings':
        helpers.getUsernameFromId(message.user).then(username => {
          user.getBySlackUsername(username).then(user => {
            functions.sendSettingsToUser(user) //we need the user to send random string query param
          })
        })
      break;
      case 'signup':
        helpers.getUsernameFromId(message.user).then(username => {
          user.getBySlackUsername(username).then(user => {

            console.log(user)
            if (user) {
              bot.postMessageToUser(username, `You're already signed up!`).then(function() {
                functions.sendSettingsToUser(user)
              })
            } else {
              console.log('no user')
              bot.postMessageToUser(username, `Signup by <${APP_URL}signup|clicking here>`)
            }

          })
        })
      break;
      default:
        console.log('default is happening')
        helpers.getUsernameFromId(message.user).then(username => {
          let response = ':wave: I can only do a few things right now. Say `settings` to adjust your settings, say `tasks` to view your open Confluence tasks, or say `signup` to signup!. I plan on getting smarter eventually!'
          bot.postMessageToUser(username, response).fail(function(data) {
            //data = { ok: false, error: 'user_not_found' }
            console.log(data)
          })
        })
    }
  }
});

var helpers = {
  getUsernameFromId: function(id) {
    return new Promise(function(resolve, reject) {
      bot.getUsers().then(data => {
        data.members.forEach((user, index) => {
          if (user.id == id) {
            return resolve(user.name)
          }
        })
      })
    });
  },
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
  sendSettingsToUser: function(user) {
    return new Promise(function(resolve, reject) {
      bot.postMessageToUser(user.slackUsername, `:hammer_and_wrench: <${APP_URL}settings?slackUsername=${user.slackUsername}&rs=${user.randomString}| Click here> to adjust your settings`, function(data) {
        return resolve(data)
      })
    });
  },
  sendTasksToUser: function(username, tasks) {
    console.log('SENDING TASKS')
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
