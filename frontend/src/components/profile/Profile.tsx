import { useLocation } from "react-router-dom";

const Profile: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const location = useLocation();
  const user = location.state?.user; // ✅ Retrieve passed user data

  return (
    <div className={`max-w-lg mx-auto p-6 border-2 rounded-lg mt-10 ${darkMode ? "bg-gray-800 text-white border-white" : "bg-white text-gray-900 border-black"}`}>
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>

      {user ? (
        <div className="flex flex-col items-center">
          {user.profileImage && <img src={user.profileImage} alt="Profile" className="w-24 h-24 rounded-full mb-4" />}
          <p className="text-lg"><strong>Username:</strong> {user.username}</p>
          <p className="text-lg"><strong>Email:</strong> {user.email}</p>
        </div>
      ) : (
        <p>No user data received. Try logging in again.</p>
      )}
    </div>
  );
};

export default Profile;