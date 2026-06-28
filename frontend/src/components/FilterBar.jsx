import { useState } from "react";

export default function FilterBar({ filters, onChange, onAdd, onExport, onSearch, search, sortBy, sortDir, onSortChange }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="filter-section">
      {/* Search bar */}
      {showSearch && (
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tasks by title, description, or tag…"
            autoFocus
          />
          {search && (
            <button className="search-clear" onClick={() => onSearch("")}>✕</button>
          )}
        </div>
      )}

      <div className="filter-bar">
        {/* Search toggle */}
        <button
          className={`icon-filter-btn ${showSearch ? "active" : ""}`}
          onClick={() => { setShowSearch((s) => !s); if (showSearch) onSearch(""); }}
          title="Search"
        >🔍</button>

        <span className="filter-label">Filter:</span>

        <select value={filters.status} onChange={(e) => onChange("status", e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select value={filters.priority} onChange={(e) => onChange("priority", e.target.value)}>
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={(e) => onSortChange("sortBy", e.target.value)}>
          <option value="order">Manual order</option>
          <option value="createdAt">Date created</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title A–Z</option>
        </select>

        <button
          className="icon-filter-btn"
          title={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
          onClick={() => onSortChange("sortDir", sortDir === "asc" ? "desc" : "asc")}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>

        <div className="filter-actions">
          <button className="btn-export" onClick={onExport} title="Export to CSV">📥 CSV</button>
          <button className="btn-add" onClick={onAdd}>+ New Task</button>
        </div>
      </div>
    </div>
  );
}
