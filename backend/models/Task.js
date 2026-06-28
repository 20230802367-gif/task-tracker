const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    // NEW: tags / categories
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 tags allowed",
      },
    },
    // NEW: progress (0–100)
    progress: {
      type: Number,
      min: [0, "Progress cannot be below 0"],
      max: [100, "Progress cannot exceed 100"],
      default: 0,
    },
    // NEW: manual sort order for drag-and-drop persistence
    order: {
      type: Number,
      default: 0,
    },
    // NEW: user auth — owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Text index for server-side search
taskSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Task", taskSchema);
