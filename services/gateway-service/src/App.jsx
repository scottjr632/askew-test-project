import { useEffect, useMemo, useState } from "react";

async function request(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return payload;
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [health, setHealth] = useState({ users: "unknown", projects: "unknown" });
  const [userForm, setUserForm] = useState({ name: "", email: "" });
  const [projectForm, setProjectForm] = useState({ name: "", ownerEmail: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () => ({ users: users.length, projects: projects.length }),
    [users.length, projects.length],
  );

  async function loadUsers() {
    const result = await request("/api/users");
    setUsers(result);
  }

  async function loadProjects() {
    const result = await request("/api/projects");
    setProjects(result);
  }

  async function loadHealth() {
    const [usersHealth, projectsHealth] = await Promise.all([
      request("/api/user-health"),
      request("/api/project-health"),
    ]);

    setHealth({
      users: usersHealth.status || "unknown",
      projects: projectsHealth.status || "unknown",
    });
  }

  async function refreshAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadHealth(), loadUsers(), loadProjects()]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function onCreateUser(event) {
    event.preventDefault();
    setError("");

    try {
      await request("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(userForm),
      });
      setUserForm({ name: "", email: "" });
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function onCreateProject(event) {
    event.preventDefault();
    setError("");

    try {
      await request("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(projectForm),
      });
      setProjectForm({ name: "", ownerEmail: "" });
      await loadProjects();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="panel">
        <h1>Askew Gateway</h1>
        <p>Simple web UI backed by users-service and projects-service.</p>
        <button type="button" onClick={refreshAll} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </header>

      <section className="panel metrics">
        <article>
          <h2>Users</h2>
          <p className="metric">{totals.users}</p>
          <p className="status">health: {health.users}</p>
        </article>
        <article>
          <h2>Projects</h2>
          <p className="metric">{totals.projects}</p>
          <p className="status">health: {health.projects}</p>
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Create User</h2>
          <form onSubmit={onCreateUser} className="form">
            <input
              value={userForm.name}
              onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Name"
              required
            />
            <input
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              type="email"
              required
            />
            <button type="submit">Add User</button>
          </form>
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <strong>{user.name}</strong> <span>{user.email}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Create Project</h2>
          <form onSubmit={onCreateProject} className="form">
            <input
              value={projectForm.name}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Project name"
              required
            />
            <input
              value={projectForm.ownerEmail}
              onChange={(event) =>
                setProjectForm((prev) => ({ ...prev, ownerEmail: event.target.value }))
              }
              placeholder="Owner email (optional)"
              type="email"
            />
            <button type="submit">Add Project</button>
          </form>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <strong>{project.name}</strong> <span>{project.ownerEmail || "unassigned"}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
