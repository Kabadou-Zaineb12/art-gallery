import { useEffect, useState } from "react";
import api from "./api";

function App() {
  const [artworks, setArtworks] = useState([]);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);

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

  return (
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

      {artworks.map((art) => (
        <div key={art._id}>
          <h3>{art.title}</h3>
          <img src={art.imageURL} width="200" alt={art.title} />
          <button onClick={() => deleteArtwork(art._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default App;
