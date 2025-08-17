import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateAuction = () => {
  const [form, setForm] = useState({
    itemName: "",
    description: "",
    startingPrice: "",
    bidIncrement: "",
    goLiveAt: "",
    durationMinutes: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("/api/auctions", form, { withCredentials: true })
      .then((res) => {
        navigate(`/auctions/${res.data.id}`);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to create auction");
      });
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center">
      <div className="card shadow-lg p-4" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4 text-dark">
            Create Auction
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                name="itemName"
                className="form-control"
                value={form.itemName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Starting Price (₹)</label>
              <input
                type="number"
                name="startingPrice"
                className="form-control"
                value={form.startingPrice}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Bid Increment (₹)</label>
              <input
                type="number"
                name="bidIncrement"
                className="form-control"
                value={form.bidIncrement}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Go Live At</label>
              <input
                type="datetime-local"
                name="goLiveAt"
                className="form-control"
                value={form.goLiveAt}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Duration (minutes)</label>
              <input
                type="number"
                name="durationMinutes"
                className="form-control"
                value={form.durationMinutes}
                onChange={handleChange}
                required
              />
            </div>
            <div className="d-flex justify-content-center">
              <button type="submit" className="btn btn-success px-4">
                Create Auction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;
