var user = require('./user')

module.exports = {
  create: user.create,
  getBySlackUsername: user.getBySlackUsername,
  getAll: user.getAll,
  update: user.update,

}
