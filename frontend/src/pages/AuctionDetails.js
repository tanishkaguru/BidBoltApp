import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AuctionDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [topBid, setTopBid] = useState(null);
  const [countdown, setCountdown] = useState("");
  const isSeller = user?.username === auction?.sellerUsername;
  useEffect(() => {
    axios
      .get(`/api/auctions/${id}`)
      .then((res) => setAuction(res.data))
      .catch((err) => console.error(err));
    axios
      .get(`/api/bids/${id}`, { withCredentials: true })
      .then((res) => setTopBid(res.data.bids?.[0] || null))
      .catch((err) => console.error(err));
  }, [id]);
  useEffect(() => {
    if (!auction || auction.status !== "live") return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.endTime).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setCountdown("Auction ended");
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        if (days > 0 || hours > 0) timeStr += `${hours}h `;
        timeStr += `${minutes}m ${seconds}s`;
        setCountdown(timeStr.trim());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);
  const placeBid = async () => {
    if (!bidAmount) {
      setMessage("Please enter a bid amount.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `/api/bids/${id}`,
        { amount: Number(bidAmount) },
        { withCredentials: true }
      );
      setMessage(res.data.message);
      setBidAmount("");
      setTopBid(res.data.topBid);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to place bid.");
    } finally {
      setLoading(false);
    }
  };
  const deleteAuction = async () => {
    if (!window.confirm("Are you sure you want to delete this auction?")) return;
    try {
      const res = await axios.delete(`/api/auctions/${id}`, {
        withCredentials: true,
      });
      alert(res.data.message || "Auction deleted successfully!");
      navigate("/");
    } catch (err) {
      if (err.response) {
        alert(err.response.data.error || "Failed to delete auction.");
      } else {
        alert("Network error. Please try again.");
      }
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
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
  };
  return (
    <div className="container container-item py-5 px-3">
      <div className="card shadow-lg border-0">
        <div className="card-body p-4">
          <h2 className="card-title text-center custom-name mb-4">{auction.itemName}</h2>
          <p className="card-text text-center mb-4">
            {auction.description || "No description available."}
          </p>
          {/* Auction Details */}
          <div className="row text-center mb-2">
            <div className="col-md-6 mb-3">
              <div className="p-3 border rounded bg-light">
                <h5 className="text-secondary">Starting Price</h5>
                <h4 className="fw-bold text-success">₹{auction.startingPrice}</h4>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="p-3 border rounded bg-light">
                <h5 className="text-secondary">Bid Increment</h5>
                <h5>₹{auction.bidIncrement}</h5>
              </div>
            </div>
          </div>
          <div className="row text-center mb-4">
            <div className="col-md-6 mb-3">
              <div className="p-3 border rounded bg-light">
                <h5 className="text-secondary">Goes Live</h5>
                <h6>{formatDate(auction.goLiveAt)}</h6>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="p-3 border rounded bg-light">
                <h5 className="text-secondary">Ends At</h5>
                <h6>{formatDate(auction.endTime)}</h6>
              </div>
            </div>
          </div>
          <div className="text-center mb-3">
            <span
              className={`badge fs-6 px-3 py-3 ${
                auction.status === "live"
                  ? "bg-success"
                  : auction.status === "upcoming"
                  ? "bg-warning text-dark"
                  : "bg-secondary"
              }`}
            >
              {auction.status?.toUpperCase()}
            </span>
          </div>
          {/* Countdown Timer */}
          {auction.status === "live" && (
            <div className="text-center mb-3">
              <h4>
                <strong>Time Left: {countdown}</strong>
              </h4>
            </div>
          )}
          {/* Seller Controls */}
          {isSeller && auction.status === "scheduled" && (
            <div className="text-center mb-3">
              <button
                className="btn btn-warning me-2"
                onClick={() => navigate(`/auctions/edit/${id}`)}
              >
                Edit Auction
              </button>
              <button className="btn btn-danger" onClick={deleteAuction}>
                Delete Auction
              </button>
            </div>
          )}
          {/* Place Bid Section */}
          {auction.status === "live" && (
            <div className="text-center mt-4">
              {topBid ? (
                <p>
                  Current Top Bid: <strong>₹{topBid.amount}</strong> by {topBid.username}
                </p>
              ) : (
                <p>No bids yet. Starting price: ₹{auction.startingPrice}</p>
              )}
              <input
                type="number"
                className="form-control mb-2"
                placeholder="Enter your bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <button
                className="btn btn-success mt-3 mb-3"
                onClick={placeBid}
                disabled={loading}
              >
                {loading ? "Placing Bid..." : "Place Bid"}
              </button>
              {message && <p className="mt-2 text-center">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;
