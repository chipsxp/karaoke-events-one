"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/actions/upload.actions";

type FileUploaderProps = {
  onFieldChange: (url: string) => void;
  imageUrl: string;
};

export function FileUploader({ imageUrl, onFieldChange }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setError("");

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadImage(dataUrl);
        if (result.error) {
          setError(result.error);
        } else if (result.url) {
          onFieldChange(result.url);
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onFieldChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxSize: 4 * 1024 * 1024,
    multiple: false,
  });

  const clearImage = () => {
    onFieldChange("");
    setError("");
  };

  return (
    <div className="flex h-72 flex-col justify-center overflow-hidden rounded-xl bg-gray-50">
      {imageUrl ? (
        <div className="relative flex h-full w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Event preview"
            className="h-full w-full object-cover object-center"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex-center h-full cursor-pointer flex-col rounded-xl border-2 border-dashed transition-colors ${
            isDragActive
              ? "border-purple-500 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex-center flex-col py-5 text-purple-600">
              <Loader2 size={48} className="mb-3 animate-spin" />
              <p className="p-medium-16">Uploading…</p>
            </div>
          ) : (
            <div className="flex-center flex-col py-5 text-gray-500">
              <Upload size={48} className="mb-3" />
              <h3 className="mb-1 p-medium-16">
                {isDragActive ? "Drop image here" : "Drag & drop an image"}
              </h3>
              <p className="p-regular-14 text-gray-400">
                JPG, PNG, WebP, GIF · up to 4 MB
              </p>
              {error && (
                <p className="mt-3 rounded-full bg-red-50 px-4 py-1.5 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
