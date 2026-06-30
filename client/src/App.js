import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "./api";
import "./App.css";

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
  const [biddingStart, setBiddingStart] = useState("");
  const [biddingEnd, setBiddingEnd] = useState("");
  const [tag, setTag] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token")) && Boolean(localStorage.getItem("user"))
  );
  const [authMode, setAuthMode] = useState("login");
  const [activeTab, setActiveTab] = useState("browse");
  const [showProfile, setShowProfile] = useState(false);
  const [authError, setAuthError] = useState("");
  const [artworkError, setArtworkError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [bidAmounts, setBidAmounts] = useState({});
  const [bidMessage, setBidMessage] = useState("");
  const socketRef = useRef(null);

  const updateArtworkFromSocket = (updatedArtwork) => {
    const updatedId = updatedArtwork._id?.toString?.() || updatedArtwork._id;
    setArtworks((prev) =>
      prev.map((art) =>
        art._id?.toString?.() === updatedId ? { ...art, ...updatedArtwork } : art
      )
    );
    setBidAmounts((prev) => ({ ...prev, [updatedId]: "" }));
  };

  const getArtworkStatus = (art) => {
    const now = new Date();
    const start = art.biddingStart ? new Date(art.biddingStart) : null;
    const end = art.biddingEnd ? new Date(art.biddingEnd) : null;

    if (start && end) {
      if (now < start) return "pending";
      if (now < end) return "active";
      return "sold";
    }
    if (start) {
      return now < start ? "pending" : "active";
    }
    if (end) {
      return now < end ? "active" : "sold";
    }
    return art.auctionStatus || "pending";
  };

  useEffect(() => {
    if (localStorage.getItem("token") && localStorage.getItem("user")) {
      fetchArtworks();
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io("http://localhost:5000", {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socket.on("connect", () => {
      setBidMessage("");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error", err.message);
      setBidMessage(`Socket error: ${err.message}. Please refresh or login again.`);
    });

    socket.on("bidPlaced", (updatedArtwork) => {
      updateArtworkFromSocket(updatedArtwork);
      setBidMessage("Bid placed successfully.");
      fetchArtworks();
    });

    socket.on("bidSuccess", (updatedArtwork) => {
      updateArtworkFromSocket(updatedArtwork);
      setBidMessage("Bid placed successfully.");
      fetchArtworks();
    });

    socket.on("auctionStarted", (updatedArtwork) => {
      setArtworks((prev) => prev.map((art) => (art._id === updatedArtwork._id ? updatedArtwork : art)));
    });

    socket.on("auctionEnded", (updatedArtwork) => {
      setArtworks((prev) => prev.map((art) => (art._id === updatedArtwork._id ? updatedArtwork : art)));
    });

    socket.on("bidError", ({ message }) => {
      setBidMessage(message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isLoggedIn]);

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
      const res = await api.post("/register", { username, password, email });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
      setEmail("");
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
      formData.append("startingPrice", Number(startingPrice) || 0);
      if (!tag) {
        setArtworkError("Please choose a tag for the artwork.");
        return;
      }

      formData.append("tags", tag);
      if (biddingStart) {
        formData.append("biddingStart", biddingStart);
      }
      if (biddingEnd) {
        formData.append("biddingEnd", biddingEnd);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await api.post("/artworks", formData);

      setTitle("");
      setImageFile(null);
      setStartingPrice("");
      setTag("");
      setBiddingStart("");
      setBiddingEnd("");
      setArtworkError("");
      fetchArtworks();
    } catch (error) {
      console.error("Failed to add artwork", error);
    }
  };

  const placeBid = (artworkId) => {
    const amount = Number(bidAmounts[artworkId]);
    if (!amount || amount <= 0) {
      setBidMessage("Enter a valid bid amount.");
      return;
    }
    if (!socketRef.current || socketRef.current.disconnected) {
      setBidMessage("Cannot place bid: real-time connection is not established.");
      return;
    }
    socketRef.current.emit("placeBid", { artworkId, amount }, (response) => {
      if (!response?.success) {
        setBidMessage(response?.error || "Failed to place bid.");
        return;
      }
      updateArtworkFromSocket(response.artwork);
      setBidMessage("Bid placed successfully.");
    });
  };

  const handleBidInputChange = (artworkId, value) => {
    setBidAmounts((prev) => ({ ...prev, [artworkId]: value }));
    setBidMessage("");
  };

  const deleteArtwork = async (id) => {
    try {
      await api.delete(`/artworks/${id}`);
      setArtworks((prev) => prev.filter((art) => art._id !== id));
      setActionMessage("Artwork deleted successfully.");
      fetchArtworks();
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Failed to delete artwork.";
      console.error("Failed to delete artwork", error);
      setActionMessage(message);
    }
  };

  const subscribeToArtwork = async (id) => {
    try {
      await api.post(`/artworks/${id}/subscribe`);
      fetchArtworks();
    } catch (error) {
      console.error("Failed to subscribe to artwork", error);
    }
  };
  const filteredArtworks = artworks.filter((art) => {
    const matchesTag =
      tagFilter === "" || art.tags?.includes(tagFilter);

    const matchesPrice =
      maxPrice === "" || art.startingPrice <= Number(maxPrice);

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
      return (a.startingPrice || 0) - (b.startingPrice || 0);
    }
    if (sortOption === "price-desc") {
      return (b.startingPrice || 0) - (a.startingPrice || 0);
    }
    return 0;
  });
  

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>{authMode === "login" ? "Login" : "Create Account"}</h1>

          <div className="auth-toggle">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setEmail("");
                setAuthError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => {
                setAuthMode("register");
                setEmail("");
                setAuthError("");
              }}
            >
              Create Account
            </button>
          </div>

          <form className="auth-form" onSubmit={authMode === "login" ? loginUser : registerUser}>
            <input
              className="auth-input"
              value={username}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
            {authMode === "register" && (
              <input
                className="auth-input"
                type="email"
                value={email}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            <input
              className="auth-input"
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="primary-button" type="submit">
              {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          {authError && <p className="auth-error">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>Art Gallery</h1>
          <p className="user-label">Logged in as {user?.username}</p>
          <p className="user-label">Wallet: {user?.coins} coins</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={() => setShowProfile((prev) => !prev)}>
            {showProfile ? "Hide Profile" : "Profile"}
          </button>
          <button className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Gallery navigation">
        <button
          className={activeTab === "browse" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("browse")}
        >
          Browse
        </button>
        <button
          className={activeTab === "add" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("add")}
        >
          Add Artwork
        </button>
      </nav>

      {showProfile && (
        <section className="panel profile-panel">
          <h2>Your Profile</h2>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Wallet:</strong> {user?.coins} coins</p>
        </section>
      )}
      {bidMessage && (
        <section className="panel message-panel">
          <p className="bid-message">{bidMessage}</p>
        </section>
      )}
      {actionMessage && (
        <section className="panel message-panel">
          <p className="bid-message">{actionMessage}</p>
        </section>
      )}
      {activeTab === "add" ? (
        <section className="panel">
          <h2>Add Artwork</h2>
          <form className="artwork-form" onSubmit={addArtwork}>
            <input
              className="text-input"
              value={title}
              placeholder="Artwork title"
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <input
              className="text-input"
              type="number"
              min="0"
              value={startingPrice}
              placeholder="Starting price"
              onChange={(e) => setStartingPrice(e.target.value)}
            />
            <select
              className="select-input"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setArtworkError("");
              }}
            >
              <option value="">Select a tag</option>
              <option value="painting">Painting</option>
              <option value="wall art">Wall art</option>
              <option value="digital">Digital</option>
              <option value="sketch">Sketch</option>
            </select>
            {artworkError && <p className="error-text">{artworkError}</p>}
            <label className="label-text">Bidding start</label>
            <input
              className="text-input"
              type="datetime-local"
              value={biddingStart}
              onChange={(e) => setBiddingStart(e.target.value)}
            />
            <label className="label-text">Bidding end</label>
            <input
              className="text-input"
              type="datetime-local"
              value={biddingEnd}
              onChange={(e) => setBiddingEnd(e.target.value)}
            />
            <button className="primary-button" type="submit">
              Add Artwork
            </button>
          </form>
        </section>
      ) : (
        <section className="panel">
          <h2>Browse Artworks</h2>
          <div className="filters">
            <input
              className="text-input"
              value={search}
              placeholder="Search title..."
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="select-input"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">All tags</option>
              <option value="painting">Painting</option>
              <option value="wall art">Wall art</option>
              <option value="digital">Digital</option>
              <option value="sketch">Sketch</option>
            </select>
            <input
              className="text-input"
              type="number"
              value={maxPrice}
              placeholder="Max price"
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <select
              className="select-input"
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

          <div className="artwork-grid">
            {sortedArtworks.map((art) => (
              <article key={art._id} className="art-card">
                {art.imageURL && (
                  <img
                    className="art-image"
                    src={getImageUrl(art.imageURL)}
                    alt={art.title}
                  />
                )}
                <div className="art-card-content">
                  <h3>{art.title}</h3>
                  <p className="status-text">Status: {getArtworkStatus(art)}</p>
                  {art.biddingStart && <p>Starts: {new Date(art.biddingStart).toLocaleString()}</p>}
                  {art.biddingEnd && <p>Ends: {new Date(art.biddingEnd).toLocaleString()}</p>}
                  <p>
                    Current bid: {art.highestBid?.amount > 0 ? art.highestBid.amount : art.startingPrice || 0}
                    {art.highestBid?.bidderName ? ` by ${art.highestBid.bidderName}` : ""}
                  </p>
                  <div className="card-actions">
                    {art.ownerId?.toString() === user?._id?.toString() && (
                      <button type="button" className="secondary-button" onClick={() => deleteArtwork(art._id)}>
                        Delete
                      </button>
                    )}
                    {art.auctionStatus === "pending" && art.ownerId !== user?._id && (
                      <button type="button" className="secondary-button" onClick={() => subscribeToArtwork(art._id)}>
                        Subscribe
                      </button>
                    )}
                  </div>
                  {getArtworkStatus(art) === "active" && art.ownerId !== user?._id && (
                    <div className="bid-section">
                      <p className="bid-note">
                        Minimum bid: {Math.max(art.highestBid?.amount || 0, art.startingPrice || 0) + 1} coins
                      </p>
                      <input
                        className="text-input"
                        type="number"
                        min="0"
                        value={bidAmounts[art._id] || ""}
                        placeholder="Your bid"
                        onChange={(e) => handleBidInputChange(art._id, e.target.value)}
                      />
                      <button className="primary-button" onClick={() => placeBid(art._id)}>
                        Place Bid
                      </button>
                    </div>
                  )}
                  {getArtworkStatus(art) !== "active" && art.ownerId !== user?._id && (
                    <p className="auction-note">Bidding is only available while the auction is active.</p>
                  )}
                  {art.bidHistory?.length > 0 && (
                    <div className="bid-history">
                      <h4>Bid history</h4>
                      <ul>
                        {art.bidHistory.slice(-3).reverse().map((bid, index) => (
                          <li key={`${art._id}-bid-${index}`}>
                            {bid.bidderName}: {bid.amount} coins at {new Date(bid.timestamp).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
