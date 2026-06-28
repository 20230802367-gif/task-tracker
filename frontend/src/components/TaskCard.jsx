export default function TaskCard({ task, onEdit, onDelete, dragHandleProps }) {
  const isOverdue = (() => {
    if (!task.dueDate || task.status === "completed") return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return task.dueDate.slice(0, 10) < todayStr;
  })();

  const getDaysLabel = () => {
    if (!task.dueDate || task.status === "completed") return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
    if (diff === 0) return { label: "Due today", urgent: true };
    if (diff === 1) return { label: "Due tomorrow", urgent: true };
    return { label: `${diff}d left`, overdue: false };
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
    });

  const progressColor =
    task.progress < 30 ? "#ff4f6a" : task.progress < 70 ? "#f5a623" : "#2dd4b5";

  const daysLabel = getDaysLabel();

  return (
    <div className={`task-card priority-${task.priority}`} data-id={task._id}>
      <div className="card-header">
        {/* Drag handle */}
        <span className="drag-handle" title="Drag to reorder" {...dragHandleProps}>⠿</span>
        <p className={`card-title ${task.status === "completed" ? "done" : ""}`}>{task.title}</p>
        <div className="card-actions">
          <button className="icon-btn" onClick={() => onEdit(task)} title="Edit">✏️</button>
          <button className="icon-btn delete" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
        </div>
      </div>

      {task.description && <p className="card-desc">{task.description}</p>}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="card-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="card-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="card-progress">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${task.progress}%`, background: progressColor }}
          />
        </div>
        <span className="progress-pct" style={{ color: progressColor }}>{task.progress}%</span>
      </div>

      <div className="card-meta">
        <span className={`badge badge-status-${task.status}`}>{task.status}</span>
        <span className={`badge badge-priority-${task.priority}`}>{task.priority}</span>

        {task.dueDate && (
          <span className={`due-date ${isOverdue ? "overdue" : ""}`}>
            {isOverdue ? "⚠️ " : "📅 "}{formatDate(task.dueDate)}
          </span>
        )}

        {daysLabel && (
          <span className={`countdown ${daysLabel.overdue ? "overdue" : daysLabel.urgent ? "urgent" : ""}`}>
            ⏱ {daysLabel.label}
          </span>
        )}
      </div>
    </div>
  );
}
