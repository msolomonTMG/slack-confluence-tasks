var user = require('./user')

module.exports = {
  create: user.create,
  getBySlackUsername: user.getBySlackUsername,
  getByTimeZone: user.getByTimeZone,
  getAll: user.getAll,
  update: user.update,
  deleteAll: user.deleteAll
}
