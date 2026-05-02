import React, { ChangeEvent, useRef } from "react";
import { User, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// 1. Define the Interface for Props
interface ProfileProps {
  imagePreview: string | null;
  setImagePreview: (value: string | null) => void;
  setImageFile: (file: File | null) => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  imagePreview, 
  setImagePreview, 
  setImageFile 
}) => {
  // 2. Add Type to useRef (HTMLInputElement)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Type the Event for file upload
  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Optional chaining for safety
    
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string); // Cast result to string
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast.error("Upload a valid image.");
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    // Stop propagation so clicking delete doesn't trigger the parent click (upload)
    e.stopPropagation(); 
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input so same file can be re-selected
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div
        onClick={handleIconClick}
        className="relative w-24 h-24 rounded-full cursor-pointer group"
      >
        <div className="w-full h-full rounded-full bg-gray-100 border border-green-400 flex items-center justify-center overflow-hidden shadow-md group-hover:ring-2 ring-green-300 transition">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User
              size={20}
              className="text-gray-400 group-hover:text-green-500 transition"
            />
          )}
        </div>

        {/* Improved logic: specific click handler for delete icon */}
        <div
          className="absolute bottom-0 right-0 bg-green-500 p-1.5 rounded-full shadow-lg group-hover:scale-110 transition"
          onClick={imagePreview ? handleDelete : undefined}
        >
          {imagePreview ? (
            <Trash2 size={16} className="text-white" />
          ) : (
            <Upload size={16} className="text-white" />
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Profile;