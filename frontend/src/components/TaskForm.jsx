import { useState, useEffect } from "react";

const getInitial = () => ({
  title: "", description: "", status: "pending",
  priority: "medium", dueDate: "", tags: [], progress: 0,
});

export default function TaskForm({ onSubmit, onCancel, editTask, loading }) {
  const [form, setForm] = useState(getInitial());
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title || "",
        description: editTask.description || "",
        status: editTask.status || "pending",
        priority: editTask.priority || "medium",
        dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : "",
        tags: editTask.tags || [],
        progress: editTask.progress ?? 0,
      });
    } else {
      setForm(getInitial());
    }
    setErrors({});
    setTagInput("");
  }, [editTask?._id, editTask]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    else if (form.title.trim().length < 3) e.title = "Title must be at least 3 characters";
    else if (form.title.trim().length > 100) e.title = "Title too long (max 100)";
    if (form.description.length > 500) e.description = "Description too long (max 500)";
    if (form.tags.length > 5) e.tags = "Maximum 5 tags allowed";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "progress" ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Auto-set progress to 100 when status is completed
  const handleStatusChange = (e) => {
    const status = e.target.value;
    setForm((prev) => ({
      ...prev,
      status,
      progress: status === "completed" ? 100 : status === "pending" && prev.progress === 100 ? 0 : prev.progress,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || form.tags.includes(tag) || form.tags.length >= 5) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag) => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  const progressColor = form.progress < 30 ? "#ff4f6a" : form.progress < 70 ? "#f5a623" : "#2dd4b5";

  return (
    <div className="form-card">
      <h2>{editTask ? "✏️ Edit Task" : "➕ New Task"}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          {/* Title */}
          <div className="form-field full">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="What needs to be done?" className={errors.title ? "error" : ""} maxLength={100} />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-field full">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Add details (optional)" className={errors.description ? "error" : ""} maxLength={500} />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Status */}
          <div className="form-field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleStatusChange}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="form-field">
            <label>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="form-field">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
          </div>

          {/* Progress */}
          <div className="form-field">
            <label>Progress — {form.progress}%</label>
            <div className="progress-slider-wrap">
              <input type="range" name="progress" min="0" max="100" step="5"
                value={form.progress} onChange={handleChange} className="progress-slider"
                style={{ "--thumb-color": progressColor }} />
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${form.progress}%`, background: progressColor }} />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-field full">
            <label>Tags (max 5)</label>
            <div className="tag-input-wrap">
              <div className="tag-chips">
                {form.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>✕</button>
                  </span>
                ))}
              </div>
              {form.tags.length < 5 && (
                <div className="tag-input-row">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tag, press Enter"
                    className="tag-input"
                  />
                  <button type="button" className="tag-add-btn" onClick={addTag}>Add</button>
                </div>
              )}
            </div>
            {errors.tags && <span className="field-error">{errors.tags}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : editTask ? "Update Task" : "Add Task"}
          </button>
          <button type="button" className="btn btn-ghost"
            onClick={() => { setForm(getInitial()); setErrors({}); setTagInput(""); onCancel?.(); }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
