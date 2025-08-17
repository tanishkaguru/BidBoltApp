import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("auctions");
  const [bids, setBids] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/bids/my", { withCredentials: true })
      .then((res) => setBids(res.data))
      .catch((err) => console.error(err));

    axios
      .get("/api/auctions/my", { withCredentials: true })
      .then((res) => setAuctions(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4 custom-name">Dashboard</h2>

      {/* Tabs */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link dash-tab ${activeTab === "bids" ? "active" : ""}`}
            onClick={() => setActiveTab("bids")}
          >
            My Bids
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link dash-tab ${activeTab === "auctions" ? "active" : ""}`}
            onClick={() => setActiveTab("auctions")}
          >
            My Auctions
          </button>
        </li>
      </ul>

      {/* React-controlled tab content */}
      <div className="mt-4">
        {activeTab === "bids" && (
          <div>
            {bids.length > 0 ? (
              <ul className="list-group">
                {bids.map((bid, idx) => (
                  <li key={idx} className="list-group-item">
                    Bid of ₹{bid.amount} on{" "}
                    <strong>{bid.auction?.itemName || "Auction"}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven’t placed any bids yet.</p>
            )}
          </div>
        )}

        {activeTab === "auctions" && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>My Auctions</h5>
              <button
                className="btn btn-success"
                onClick={() => navigate("/auctions/create")}
              >
                + Create Auction
              </button>
            </div>

            {auctions.length > 0 ? (
              <ul className="list-group">
                {auctions.map((auction) => (
                  <li
                    key={auction.id}
                    className="list-group-item list-group-item-action"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/auctions/${auction.id}`)}
                  >
                    <strong>{auction.itemName}</strong> — Status:{" "}
                    {auction.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven’t created any auctions yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
