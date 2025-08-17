import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AllAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await axios.get("/api/auctions");
        setAuctions(res.data.auctions || []);
      } catch (err) {
        console.error("Error fetching auctions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading auctions...</span>
        </div>
      </div>
    );
  }
  return (
    <div className="container py-5">
      <h2 className="mb-4 custom-name text-center">All Auctions</h2>

      {auctions.length === 0 ? (
        <p className="text-center">No auctions available at the moment.</p>
      ) : (
        <div className="row">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="col-md-4 mb-4"
              onClick={() => navigate(`/auctions/${auction.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{auction.itemName}</h5>
                  <p className="card-text text-truncate">
                    {auction.description || "No description"}
                  </p>

                  <div className="mt-auto">
                    <p className="mb-1">
                      <strong>Starting Price:</strong> ₹{auction.startingPrice}
                    </p>
                    <p className="mb-2">
                      <strong>Bid Increment:</strong> ₹{auction.bidIncrement}
                    </p>
                    <span
                      className={`badge ${
                        auction.status === "live"
                          ? "bg-success"
                          : auction.status === "scheduled"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {auction.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllAuctions;
