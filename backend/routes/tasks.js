const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");
const protect = require("../middleware/auth");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// All task routes are protected
router.use(protect);

// GET /api/tasks — with search, filters, sort
router.get("/", async (req, res) => {
  try {
    const { status, priority, tag, search, sortBy = "order", sortDir = "asc" } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (tag) filter.tags = tag;

    // Full-text search across title, description, tags
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortMap = {
      order: { order: sortDir === "desc" ? -1 : 1, createdAt: -1 },
      createdAt: { createdAt: sortDir === "desc" ? -1 : 1 },
      dueDate: { dueDate: sortDir === "desc" ? -1 : 1 },
      priority: { priority: sortDir === "desc" ? -1 : 1 },
      title: { title: sortDir === "desc" ? -1 : 1 },
    };
    const sort = sortMap[sortBy] || sortMap.order;

    const tasks = await Task.find(filter).sort(sort);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/export — CSV export
router.get("/export", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    const header = "Title,Description,Status,Priority,Tags,Progress,Due Date,Created At\n";
    const rows = tasks.map((t) => [
      `"${(t.title || "").replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${(t.tags || []).join("; ")}"`,
      t.progress,
      t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
      t.createdAt.toISOString().slice(0, 10),
    ].join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=tasks.csv");
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res) => {
  if (!isValidId(req.params.id))
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, tags, progress } = req.body;
    // Assign next order value
    const last = await Task.findOne({ user: req.user._id }).sort({ order: -1 });
    const order = last ? last.order + 1 : 0;
    const task = await Task.create({
      title, description, status, priority, dueDate,
      tags: tags || [],
      progress: progress || 0,
      order,
      user: req.user._id,
    });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/reorder — drag-and-drop order persistence
router.put("/reorder", async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of task _ids in new order
    if (!Array.isArray(orderedIds))
      return res.status(400).json({ success: false, message: "orderedIds must be an array" });
    const ops = orderedIds.map((id, idx) => ({
      updateOne: { filter: { _id: id, user: req.user._id }, update: { order: idx } },
    }));
    await Task.bulkWrite(ops);
    res.json({ success: true, message: "Order saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  if (!isValidId(req.params.id))
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  try {
    const { _id, __v, createdAt, updatedAt, user, ...safeBody } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      safeBody,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  if (!isValidId(req.params.id))
    return res.status(400).json({ success: false, message: "Invalid task ID" });
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
