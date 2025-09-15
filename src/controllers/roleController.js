const { Role } = require('../models');

exports.list = async (req, res) => {
  const roles = await Role.findAll();
  res.json(roles);
};
