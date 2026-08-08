const User = require('../models/User');

function getUserQuery(id) {
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return { _id: id };
  }
  return { employeeId: id };
}

// GET /api/users  (admin only)
async function getUsers(req, res, next) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/directory  (any logged-in user — minimal public-safe fields)
async function getUserDirectory(req, res, next) {
  try {
    const users = await User.find().select('name employeeId imageUrl _id');
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/me  (any logged-in user)
async function getMe(req, res, next) {
  res.json(req.user);
}

// GET /api/users/:id  (admin only)
async function getUserById(req, res, next) {
  try {
    const user = await User.findOne(getUserQuery(req.params.id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me  (any logged-in user updates their OWN info)
// Deliberately whitelists fields: nobody can promote themselves to admin
// or change their own employeeId through this route.
async function updateMe(req, res, next) {
  try {
    const allowedFields = ['name', 'address', 'phone', 'speciality', 'password', 'imageUrl'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findById(req.user._id).select('+password');
    Object.assign(user, updates);
    await user.save(); // triggers password hashing if password was changed

    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/:id  (admin only — can edit any user, including role)
async function updateUser(req, res, next) {
  try {
    const allowedFields = ['name', 'address', 'phone', 'speciality', 'role', 'employeeId', 'password', 'imageUrl'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findOne(getUserQuery(req.params.id)).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, updates);
    await user.save();

    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id  (admin only)
async function deleteUser(req, res, next) {
  try {
    const user = await User.findOneAndDelete(getUserQuery(req.params.id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getMe, getUserById, updateMe, updateUser, deleteUser, getUserDirectory };