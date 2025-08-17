import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/me`, { withCredentials: true });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id]);
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    );

  if (!profile) return <p className="text-center mt-5">Profile not found.</p>;

  return (
    <div className="container py-5">
      <div className="card shadow-sm mx-auto mt-5" style={{ maxWidth: 600 }}>
        <div className="card-header custom-header text-white text-center">
          <h2>{profile.name || profile.username}'s Profile</h2>
        </div>
        <div className="card-body text-center">
          {/* User Info */}
          <h4 className="mb-2">{profile.name || profile.username}</h4>
          <p className="text-muted mb-1">@{profile.username}</p>

          <div className="row text-start mt-4">
            <div className="col-6 mb-2">
              <strong>Email:</strong>
            </div>
            <div className="col-6 mb-2">{profile.email || "N/A"}</div>
            <div className="col-6 mb-2">
              <strong>Member Since:</strong>
            </div>
            <div className="col-6 mb-2">{new Date(profile.createdAt).toLocaleDateString()}</div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
