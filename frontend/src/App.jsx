import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import TaskForm from "./components/TaskForm";
import TaskCard from "./components/TaskCard";
import FilterBar from "./components/FilterBar";
import AuthPage from "./components/AuthPage";

const API = import.meta.env.VITE_API_URL || "/api";

let toastId = 0;

// --- Axios auth interceptor setup ---
function setAuthHeader(token) {
  if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete axios.defaults.headers.common["Authorization"];
}

export default function App() {
  // --- Auth state ---
  const [token, setToken] = useState(() => localStorage.getItem("tt_token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tt_user") || "null"); } catch { return null; }
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [sortDir, setSortDir] = useState("asc");
  const [toasts, setToasts] = useState([]);

  // Drag-and-drop refs
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  // Theme: dark / light
  const [theme, setTheme] = useState(() => localStorage.getItem("tt_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tt_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      setAuthHeader(token);
    }
  }, [token]);

  const toast = (msg, type = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // --- Auth handlers ---
  const handleAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setAuthHeader(newToken);
    localStorage.setItem("tt_token", newToken);
    localStorage.setItem("tt_user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setTasks([]);
    setAuthHeader(null);
    localStorage.removeItem("tt_token");
    localStorage.removeItem("tt_user");
  };

  // --- Fetch tasks ---
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setTasks([]);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (search) params.search = search;
      if (sortBy) params.sortBy = sortBy;
      if (sortDir) params.sortDir = sortDir;
      const { data } = await axios.get(`${API}/tasks`, { params });
      setTasks(data.data);
    } catch (err) {
      if (err.response?.status === 401) { handleLogout(); return; }
      console.error("fetchTasks error:", err);
      toast(err.response?.data?.message || "Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, search, sortBy, sortDir, token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- CRUD ---
  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editTask) {
        const { data } = await axios.put(`${API}/tasks/${editTask._id}`, form);
        setTasks((prev) => prev.map((t) => (t._id === editTask._id ? data.data : t)));
        toast("Task updated ✅");
      } else {
        const { data } = await axios.post(`${API}/tasks`, form);
        setTasks((prev) => [data.data, ...prev]);
        toast("Task added ✅");
      }
      setShowForm(false);
      setEditTask(null);
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`${API}/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      if (editTask && editTask._id === id) { setEditTask(null); setShowForm(false); }
      toast("Task deleted");
    } catch (err) {
      console.error("handleDelete error:", err);
      toast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  const handleSortChange = (key, val) => {
    if (key === "sortBy") setSortBy(val);
    else setSortDir(val);
  };

  // --- Drag and drop ---
  const handleDragStart = (e, idx) => { dragItem.current = idx; e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnter = (e, idx) => { dragOver.current = idx; };
  const handleDragEnd = async () => {
    const from = dragItem.current;
    const to = dragOver.current;
    if (from === null || to === null || from === to) { dragItem.current = null; dragOver.current = null; return; }
    const reordered = [...tasks];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setTasks(reordered);
    dragItem.current = null;
    dragOver.current = null;
    try {
      await axios.put(`${API}/tasks/reorder`, { orderedIds: reordered.map((t) => t._id) });
    } catch (err) {
      console.error("reorder error:", err);
      toast("Failed to save order", "error");
      fetchTasks();
    }
  };

  // --- CSV Export ---
  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/tasks/export`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "tasks.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast("CSV exported 📥");
    } catch {
      toast("Export failed", "error");
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    high: tasks.filter((t) => t.priority === "high").length,
  };

  // Show auth page if not logged in
  if (!token) return <AuthPage onAuth={handleAuth} />;

  return (
    <div className="app">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" ? "✅" : "❌"} {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div>
            <h1>Task Tracker</h1>
            <p>Welcome back, {user?.name} 👋</p>
          </div>
          <div className="header-controls">
            <button
              className="theme-toggle"
              onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button className="btn btn-ghost logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-chip">Total <span>{stats.total}</span></div>
          <div className="stat-chip">Completed <span>{stats.completed}</span></div>
          <div className="stat-chip">Pending <span>{stats.pending}</span></div>
          <div className="stat-chip">High Priority <span>{stats.high}</span></div>
        </div>
      </div>

      {/* Task Form */}
      {showForm && (
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditTask(null); }}
          editTask={editTask}
          loading={submitting}
        />
      )}

      {/* Filter / Search Bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onAdd={() => { setShowForm(true); setEditTask(null); }}
        onExport={handleExport}
        onSearch={setSearch}
        search={search}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
      />

      {/* Task List */}
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>{search ? `No tasks match "${search}"` : "No tasks found. Add one to get started!"}</p>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map((task, idx) => (
            <div
              key={task._id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnter={(e) => handleDragEnter(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="draggable-wrapper"
            >
              <TaskCard task={task} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
