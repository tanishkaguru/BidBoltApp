import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const EditAuction = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [form, setForm] = useState({
    itemName: "",
    description: "",
    startingPrice: "",
    bidIncrement: "",
    goLiveAt: "",
    durationMinutes: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch auction details
  useEffect(() => {
    axios
      .get(`/api/auctions/${id}`)
      .then((res) => {
        setAuction(res.data);
        setForm({
          itemName: res.data.itemName,
          description: res.data.description || "",
          startingPrice: res.data.startingPrice,
          bidIncrement: res.data.bidIncrement,
          goLiveAt: new Date(res.data.goLiveAt).toISOString().slice(0, 16),
          durationMinutes: res.data.durationMinutes,
        });
      })
      .catch((err) => console.error(err));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.put(`/api/auctions/${id}`, form, { withCredentials: true });
      alert(res.data.message || "Auction updated successfully!");
      navigate(`/auctions/${id}`);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update auction.");
    } finally {
      setLoading(false);
    }
  };

  if (!auction)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading auction...</span>
        </div>
      </div>
    );

  if (auction.sellerUsername !== user.username && !user.isAdmin) {
    return <p className="text-center mt-5">You are not authorized to edit this auction.</p>;
  }

  return (
    <div className="container py-5">
      <div className="card shadow-lg border-0 mx-auto" style={{ maxWidth: 700 }}>
        <div className="mt-3 fw-bold custom-name text-center">
          <h2>Edit Auction</h2>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-control"
                name="itemName"
                value={form.itemName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Starting Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  name="startingPrice"
                  value={form.startingPrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Bid Increment (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  name="bidIncrement"
                  value={form.bidIncrement}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Goes Live At</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="goLiveAt"
                  value={form.goLiveAt}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            {message && <p className="text-danger">{message}</p>}
            <button type="submit" className="btn btn-success w-100" disabled={loading}>
              {loading ? "Updating..." : "Update Auction"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAuction;
