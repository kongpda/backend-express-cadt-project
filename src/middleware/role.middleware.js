const ROLES = {
  user: 0,
  moderator: 1,
  admin: 2,
  superAdmin: 3
};

const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!ROLES.hasOwnProperty(req.user.role)) {
      return res.status(403).json({ message: 'Invalid role' });
    }

    if (ROLES[req.user.role] < ROLES[requiredRole]) {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    next();
  };
};

const validateRoleChange = (currentRole, newRole, adminRole) => {
  // Admin can only set roles lower than their own level
  if (ROLES[adminRole] <= ROLES[newRole]) {
    return false;
  }

  // Admin must have higher role than the user they're modifying
  if (ROLES[adminRole] <= ROLES[currentRole]) {
    return false;
  }

  // New role must be valid
  if (!ROLES.hasOwnProperty(newRole)) {
    return false;
  }

  return true;
};

module.exports = {
  checkRole,
  validateRoleChange,
  ROLES
};
