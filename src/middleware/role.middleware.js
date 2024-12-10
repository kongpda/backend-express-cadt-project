const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const hasRole = roles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

module.exports = {
  checkRole,
};
