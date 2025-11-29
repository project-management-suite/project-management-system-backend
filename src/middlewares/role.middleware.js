// src/middlewares/role.middleware.js
exports.authorizeRoles = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Convert to uppercase to match Supabase role format
    const userRole = req.user.role.toUpperCase();
    const allowedRoles = allowed.map(role => role.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
