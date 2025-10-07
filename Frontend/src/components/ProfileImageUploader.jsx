import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImageutils";
import { useSelector, useDispatch } from "react-redux";
import { updateProfileImage } from "../features/auth/authSlice";

const ProfileImageUploader = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);

  // Handle File Selection
  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
      event.target.value = null;
    }
  };

  // Handle Cropping
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle Cropping Save
  const handleCropSave = async () => {
    if (!croppedAreaPixels || !image) return;
  
    const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
  
    // Convert Blob to File
    const file = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
  
    // Create FormData to send to the backend
    const formData = new FormData();
    formData.append("displayPicture", file);
  
    // Dispatch Redux action with FormData
    dispatch(updateProfileImage(formData));
  
    setImage(null); // Close cropping modal
  };
  

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Image Display */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
        {user?.image ? (
          <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
            No Image
          </div>
        )}
      </div>

      {/* File Upload */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={onFileChange}
      />
      <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
        Upload Image
      </button>

      {/* Cropping Modal */}
      {image && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-2">Adjust Image</h2>
            <div className="relative w-full h-64">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <button className="btn btn-error" onClick={() => setImage(null)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleCropSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUploader;
