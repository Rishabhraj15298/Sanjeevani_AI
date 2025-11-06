// module.exports = function permit(...roles) {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Forbidden' });
//     }
//     next();
//   };
// };


module.exports = function(allowed) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'Unauthorized' });
    if (Array.isArray(allowed) ? allowed.includes(role) : allowed === role) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
};
