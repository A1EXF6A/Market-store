import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { API_BASE } from "@services/api";
import { ImageIcon, Upload, X } from "lucide-react";
import React, { useRef, useState } from "react";

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  existingImages?: string[];
  onExistingImageRemove?: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  existingImages = [],
  onExistingImageRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        return false;
      }
      return true;
    });

    const totalImages =
      images.length + existingImages.length + validFiles.length;
    if (totalImages > maxImages) {
      const remainingSlots =
        maxImages - (images.length + existingImages.length);
      validFiles.splice(remainingSlots);
    }

    onImagesChange([...images, ...validFiles]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const removeExistingImage = (url: string) => {
    if (onExistingImageRemove) {
      onExistingImageRemove(url);
    }
  };

  const totalImages = images.length + existingImages.length;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {totalImages < maxImages && (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload
              className={`h-12 w-12 mb-4 ${dragActive ? "text-blue-500" : "text-gray-400"}`}
            />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500 text-center">
              Máximo {maxImages} imágenes, hasta 5MB cada una
              <br />
              Formatos soportados: JPG, PNG, GIF
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Image Preview Grid */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Existing Images */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className="relative group">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={`${API_BASE}${url}`}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {onExistingImageRemove && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExistingImage(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* New Images */}
          {images.map((file, index) => (
            <div key={`new-${index}`} className="relative group">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Nueva imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span>
            {totalImages} de {maxImages} imágenes
          </span>
        </div>
        {totalImages > 0 && (
          <span className="text-green-600 font-medium">
            ✓ Imágenes cargadas
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
