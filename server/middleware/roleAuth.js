const isManager = (role) => role === 'manager' || role === 'user' || role === 'admin' || role === 'viewer'

const allowManagerOnly = (req, res, next) => {
  if (!isManager(req.user.role)) {
    return res.status(403).json({ error: 'Manager access only' })
  }
  next()
}

const allowWorkerOnly = (req, res, next) => {
  if (req.user.role !== 'worker') {
    return res.status(403).json({ error: 'Worker access only' })
  }
  next()
}

const blockWorker = (req, res, next) => {
  if (req.user.role === 'worker') {
    return res.status(403).json({ error: 'This feature is not available for worker accounts' })
  }
  next()
}

module.exports = { allowManagerOnly, allowWorkerOnly, blockWorker }
