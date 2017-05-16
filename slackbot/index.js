var slackbot = require('./slackbot')

module.exports = {
  postMessageToUser: slackbot.postMessageToUser,
  sendTasksToUser: slackbot.sendTasksToUser
}
