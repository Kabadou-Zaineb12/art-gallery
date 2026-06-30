import { useEffect, useState } from "react";
import api from "./api";
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return "";
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return `http://localhost:5000${imagePath}`;
};
function App() {
  const [artworks, setArtworks] = useState([]);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [tagFilter, setTagFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );
  const [authMode, setAuthMode] = useState("login");
  const [activeTab, setActiveTab] = useState("browse");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchArtworks();
    }
  }, []);

  const fetchArtworks = async () => {
    try {
      const res = await api.get("/artworks");
      setArtworks(res.data);
    } catch (error) {
      console.error("Failed to load artworks", error);
    }
  };

  const loginUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
      setAuthError("");
      fetchArtworks();
    } catch (error) {
      console.error("Login failed", error);
      setAuthError(
        error.response?.data?.error || error.message || "Login failed. Check credentials and try again."
      );
    }
  };

  const registerUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/register", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
      setAuthError("");
      fetchArtworks();
    } catch (error) {
      console.error("Registration failed", error);
      setAuthError(
        error.response?.data?.error || error.message || "Registration failed. Try another username."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    setArtworks([]);
    setActiveTab("browse");
  };

  const addArtwork = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", title);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await api.post("/artworks", formData, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      setTitle("");
      setImageFile(null);
      fetchArtworks();
    } catch (error) {
      console.error("Failed to add artwork", error);
    }
  };

  const deleteArtwork = async (id) => {
    try {
      await api.delete(`/artworks/${id}`);
      fetchArtworks();
    } catch (error) {
      console.error("Failed to delete artwork", error);
    }
  };
  const filteredArtworks = artworks.filter((art) => {
    const matchesTag =
      tagFilter === "" || art.tags?.includes(tagFilter);

    const matchesPrice =
      maxPrice === "" || art.price <= Number(maxPrice);

    const matchesSearch =
      search === "" ||
      art.title.toLowerCase().includes(search.toLowerCase());

    return matchesTag && matchesPrice && matchesSearch;
  });

  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    if (sortOption === "name-asc") {
      return a.title.localeCompare(b.title);
    }
    if (sortOption === "name-desc") {
      return b.title.localeCompare(a.title);
    }
    if (sortOption === "price-asc") {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortOption === "price-desc") {
      return (b.price || 0) - (a.price || 0);
    }
    return 0;
  });
  

  if (!isLoggedIn) {
    return (
      <div style={{ padding: "20px", maxWidth: "480px", margin: "0 auto" }}>
        <h1>{authMode === "login" ? "Login" : "Create Account"}</h1>

        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setAuthError("");
            }}
            style={{ marginRight: "8px" }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setAuthError("");
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={authMode === "login" ? loginUser : registerUser}>
          <div style={{ marginBottom: "12px" }}>
            <input
              style={{ width: "100%" }}
              value={username}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <input
              style={{ width: "100%" }}
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">
            {authMode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        {authError && <p style={{ color: "red" }}>{authError}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Art Gallery</h1>
          <p>Logged in as: {user?.username}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <nav style={{ margin: "20px 0" }}>
        <button
          onClick={() => setActiveTab("browse")}
          style={{ marginRight: "8px" }}
        >
          Browse
        </button>
        <button onClick={() => setActiveTab("add")}>Add Artwork</button>
      </nav>

      {activeTab === "add" ? (
        <section>
          <h2>Add Artwork</h2>
          <form onSubmit={addArtwork} style={{ marginBottom: "24px" }}>
            <div style={{ marginBottom: "12px" }}>
              <input
                style={{ width: "100%" }}
                value={title}
                placeholder="Title"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <button type="submit">Add</button>
          </form>
        </section>
      ) : (
        <section>
          <h2>Browse Artworks</h2>
          <div style={{ marginBottom: "20px" }}>
            <input
              value={search}
              placeholder="Search title..."
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              style={{ marginRight: "8px" }}
            >
              <option value="">All tags</option>
              <option value="painting">Painting</option>
              <option value="wall art">Wall art</option>
              <option value="digital">Digital</option>
              <option value="sketch">Sketch</option>
            </select>
            <input
              type="number"
              value={maxPrice}
              placeholder="Max price"
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="">Sort by</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
            </select>
          </div>

          {sortedArtworks.map((art) => (
            <div key={art._id} style={{ marginBottom: "20px" }}>
              <h3>{art.title}</h3>
              {art.imageURL && (
                         <img src={getImageUrl(art.imageURL)} width="200" alt={art.title} />
              )}
              <div>
                <button onClick={() => deleteArtwork(art._id)}>Delete</button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;
