import { useEffect, useState } from "react";
import api from "./api";

function App() {
  const [artworks, setArtworks] = useState([]);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [tagFilter, setTagFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("");

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const res = await api.get("/artworks");
      setArtworks(res.data);
    } catch (error) {
      console.error("Failed to load artworks", error);
    }
  };

  const addArtwork = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", title);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await api.post("/artworks", formData);

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

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <input
          value={search}
          placeholder="Search title..."
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
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
          type="number"
          value={maxPrice}
          placeholder="Max price"
          onChange={(e) => setMaxPrice(e.target.value)}
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

      <div>
        <h1>Art Gallery</h1>

        <form onSubmit={addArtwork}>
          <input
            value={title}
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <button type="submit">Add</button>
        </form>

        {sortedArtworks.map((art) => (
          <div key={art._id}>
            <h3>{art.title}</h3>
            <img src={art.imageURL} width="200" alt={art.title} />
            <button onClick={() => deleteArtwork(art._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
