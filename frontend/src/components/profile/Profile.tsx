import { useState } from "react";

interface User {
  username: string;
  email: string;
  profile_picture?: string;
}

const predefinedImages = [
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown"
];

const Profile: React.FC<{ 
  darkMode: boolean; 
  user: User | null; 
  setUser: React.Dispatch<React.SetStateAction<User | null>> 
}> = ({ user, setUser }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState(user?.profile_picture || predefinedImages[0]);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user) {
      setStatus("error");
      setMessage("You must be logged in to update your profile.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/auth/edit-profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, profile_picture: profileImage })
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser({ username, email, profile_picture: profileImage });
        setStatus("success");
        setMessage("Profile updated successfully!");
        setPassword("");
        setIsEditMode(false);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setMessage("");
        setStatus("idle");
      }, 5000);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 rounded-2xl shadow-xl mt-10 bg-white text-gray-900 border border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Your Profile</h2>
        {!isEditMode && user && (
          <button 
            onClick={() => setIsEditMode(true)} 
            className="py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {message && (
        <div 
          className={`p-4 mb-6 rounded-lg text-center transition-all duration-300 ${
            status === "success" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}
      
      {user ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
              <img 
                src={profileImage} 
                alt="Profile" 
                className="relative w-32 h-32 rounded-full border-4 border-white object-cover" 
              />
            </div>
            
            {isEditMode && (
              <div className="w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Choose an avatar:</h3>
                <div className="grid grid-cols-5 gap-3">
                  {predefinedImages.map((img, index) => (
                    <div key={index} className="relative cursor-pointer group" onClick={() => setProfileImage(img)}>
                      {profileImage === img && (
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full z-10"></div>
                      )}
                      <div className={`rounded-full overflow-hidden transition transform ${
                        profileImage === img ? "scale-105" : "scale-100 group-hover:scale-105"
                      }`}>
                        <img 
                          src={img} 
                          alt={`Avatar option ${index + 1}`} 
                          className="w-full h-auto" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                placeholder="Username" 
                disabled={!isEditMode} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                placeholder="Email" 
                disabled={!isEditMode} 
              />
            </div>
            
            {isEditMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password (Optional)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                  placeholder="Leave blank to keep current password" 
                />
              </div>
            )}
            
            {isEditMode && (
              <div className="flex space-x-4 pt-4">
                <button 
                  onClick={() => setIsEditMode(false)} 
                  className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isLoading} 
                  className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all ${
                    isLoading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-md"
                  }`}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-700 font-medium">No user data received. Please log in again.</p>
        </div>
      )}
    </div>
  );
};

export default Profile;