const Task = require('../models/Task');

const POPULATE_FIELDS = [
  { path: 'assignedEmployees', select: 'name employeeId speciality' },
  { path: 'client', select: 'name address phone' },
  { path: 'createdBy', select: 'name employeeId' },
];

// POST /api/tasks  (admin only)
async function createTask(req, res, next) {
  try {
    const {
      taskType,
      numEmployees,
      description,
      assignedEmployees,
      client,
      startDate,
      endDate,
      status,
    } = req.body;

    if (!taskType || !numEmployees || !client || !startDate || !endDate) {
      return res.status(400).json({
        message: 'taskType, numEmployees, client, startDate and endDate are required',
      });
    }

    const task = await Task.create({
      taskType,
      numEmployees,
      description,
      assignedEmployees: assignedEmployees || [],
      client,
      startDate,
      endDate,
      status,
      createdBy: req.user._id,
    });

    const populated = await task.populate(POPULATE_FIELDS);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks
// Supports:
//   ?month=2026-07                     -> all tasks overlapping that month
//   ?startDate=2026-07-01&endDate=2026-07-15  -> all tasks overlapping that range
//   ?status=pending
//   ?mine=true                         -> only tasks assigned to the logged-in user
async function getTasks(req, res, next) {
  try {
    const { month, startDate, endDate, status, mine } = req.query;
    const filter = {};

    if (month) {
      // "2026-07" -> covers the whole month of July 2026
      const [year, m] = month.split('-').map(Number);
      if (!year || !m) {
        return res.status(400).json({ message: 'month must be in YYYY-MM format' });
      }
      const rangeStart = new Date(Date.UTC(year, m - 1, 1));
      const rangeEnd = new Date(Date.UTC(year, m, 1)); // first day of next month
      // A task is "in" the month if it overlaps the range at all
      filter.startDate = { $lt: rangeEnd };
      filter.endDate = { $gte: rangeStart };
    } else if (startDate || endDate) {
      const rangeStart = startDate ? new Date(startDate) : new Date('1970-01-01');
      const rangeEnd = endDate ? new Date(endDate) : new Date('2999-12-31');
      filter.startDate = { $lte: rangeEnd };
      filter.endDate = { $gte: rangeStart };
    }

    if (status) filter.status = status;
    if (mine === 'true') filter.assignedEmployees = req.user._id;

    const tasks = await Task.find(filter).populate(POPULATE_FIELDS).sort({ startDate: 1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id
async function getTaskById(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate(POPULATE_FIELDS);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id
// Admins can update any task field. Assigned employees can update the status.
async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssigned = task.assignedEmployees.some(
      (empId) => empId.toString() === req.user._id.toString()
    );

    const allowedFields =
      req.user.role === 'admin'
        ? ['taskType', 'numEmployees', 'description', 'assignedEmployees', 'client', 'startDate', 'endDate', 'status']
        : ['status'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    if (req.user.role !== 'admin' && !isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_FIELDS);

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id/progress
// (employee assigned to the task — can only touch startDate, endDate, status)
async function updateTaskProgress(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssigned = task.assignedEmployees.some(
      (empId) => empId.toString() === req.user._id.toString()
    );
    if (req.user.role !== 'admin' && !isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    const allowedFields = ['startDate', 'endDate', 'status'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    }

    await task.save();
    const populated = await task.populate(POPULATE_FIELDS);
    res.json(populated);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/hours  (assigned employee or admin — log worked hours)
async function logHours(req, res, next) {
  try {
    const { date, hours, startTime, endTime, notes } = req.body;
    if (!date || hours === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'date, hours, startTime and endTime are required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssigned = task.assignedEmployees.some(
      (empId) => empId.toString() === req.user._id.toString()
    );
    if (req.user.role !== 'admin' && !isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    const duplicate = task.hoursLogged.some(
      (entry) =>
        entry.employee.toString() === req.user._id.toString() &&
        entry.startTime === startTime &&
        entry.endTime === endTime
    );

    if (duplicate) {
      return res.status(409).json({ message: 'This hour entry already exists for this employee and time range' });
    }

    const serial = task.hoursLogged.length + 1;
    task.hoursLogged.push({ serial, date, hours, startTime, endTime, notes, employee: req.user._id });
    await task.save();
    const populated = await task.populate(POPULATE_FIELDS);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/photos  (assigned employee or admin — attach a photo URL)
async function addPhoto(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'url is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssigned = task.assignedEmployees.some(
      (empId) => empId.toString() === req.user._id.toString()
    );
    if (req.user.role !== 'admin' && !isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    task.photos.push(url);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id  (admin only)
async function deleteTask(req, res, next) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskProgress,
  logHours,
  addPhoto,
  deleteTask,
};
