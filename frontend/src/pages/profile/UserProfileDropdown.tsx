import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle,  LogOut,  Folder, Camera } from "lucide-react";


const predefinedImages = [
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=White&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Concerned&skinColor=Light",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Pale",
  "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=DarkBrown"
];

const UserProfileDropdown: React.FC<{ 
  user: { username: string; email: string; profile_picture?: string } | null;
  handleLogout: () => void;
  setUser?: React.Dispatch<React.SetStateAction<{ username: string; email: string; profile_picture?: string } | null>>;
}> = ({ user, handleLogout, setUser }) => {

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_picture || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.profile_picture) {
      setSelectedAvatar(user.profile_picture);
    }
  }, [user?.profile_picture]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowAvatarSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!user || !setUser) return;
    
    setIsUpdating(true);
    setSelectedAvatar(avatarUrl);
    
    try {
      const response = await fetch("http://localhost:5000/auth/edit-profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: user.username, 
          email: user.email, 
          profile_picture: avatarUrl 
        })
      });
      
      
      if (response.ok) {
        setUser({ ...user, profile_picture: avatarUrl });
        setUpdateMessage("Avatar updated!");
        setTimeout(() => {
          setShowAvatarSelector(false);
          setUpdateMessage("");
        }, 1500);
      } else {
        setUpdateMessage("Failed to update avatar");
        setTimeout(() => setUpdateMessage(""), 3000);
      }
    } catch (error) {
      setUpdateMessage("Error updating avatar");
      setTimeout(() => setUpdateMessage(""), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      {user ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            aria-expanded={isDropdownOpen}
            aria-label="User menu"
          >
            {user.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt="Profile" 
                className="w-11 h-11 rounded-full object-cover border-2 border-white" 
              />
            ) : (
              <UserCircle size={28} className="text-white" />
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl overflow-hidden z-50">
              {/* User Details as a Button */}
              <div className="p-4 relative">
                <button
                  onClick={() => navigate("/profile", { state: { user } })}
                  className="flex items-center space-x-4 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-200"
                >
                  <div className="relative group">
                    {user.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt="Profile" 
                        className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 dark:border-gray-600" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center">
                        <UserCircle size={28} className="text-blue-500 dark:text-gray-300" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </button>
                
                {setUser && (
                  <button
                    onClick={() => setShowAvatarSelector(prev => !prev)}
                    className="absolute bottom-1 left-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                    title="Change avatar"
                  >
                    <Camera size={18} />
                  </button>
                )}
              </div>
              
              {/* Avatar Selector */}
              {showAvatarSelector && (
                <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2 flex justify-between items-center">
                    <span>Select an avatar</span>
                    {updateMessage && (
                      <span className="text-xs text-green-600 dark:text-green-400">{updateMessage}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {predefinedImages.map((img, index) => (
                      <div 
                        key={index} 
                        className={`relative cursor-pointer rounded-full border-2 ${
                          selectedAvatar === img ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-300'
                        } transition-all`}
                        onClick={() => !isUpdating && handleAvatarChange(img)}
                      >
                        <img 
                          src={img} 
                          alt={`Avatar option ${index + 1}`} 
                          className="w-full h-auto rounded-full" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${showAvatarSelector ? 'border-t' : ''} border-gray-100 dark:border-gray-700`}>
                {/* Menu Items */}
                <Link to="/storage-overview" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Folder size={18} className="mr-3 text-blue-500 dark:text-blue-400" /> 
                  <span>Storage Access</span>
                </Link>
                
                {/* <Link to="/settings" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Settings size={18} className="mr-3 text-blue-500 dark:text-blue-400" /> 
                  <span>Settings</span>
                </Link>

                <Link to="/help" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <HelpCircle size={18} className="mr-3 text-blue-500 dark:text-blue-400" /> 
                  <span>Help Center</span>
                </Link> */}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
                >
                  <LogOut size={18} /> 
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300">
          Login
        </Link>
      )}
    </div>
  );
};

export default UserProfileDropdown;