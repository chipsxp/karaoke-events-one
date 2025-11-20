"use client";

import { Upload } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { ClientUploadedFileData } from "uploadthing/types";
import { OurFileRouterValue } from "@/app/api/uploadthing/core";

type FileUploaderProps = {
  onFieldChange: (url: string) => void;
  imageUrl: string;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

export function FileUploader({
  imageUrl,
  onFieldChange,
  setFiles,
}: FileUploaderProps) {
  return (
    <div className="flex-center bg-dark-3 flex h-72 cursor-pointer flex-col overflow-hidden rounded-xl bg-grey-50">
      {imageUrl ? (
        <div className="flex h-full w-full flex-1 justify-center ">
          <img
            src={imageUrl}
            alt="image"
            width={250}
            height={250}
            className="w-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="flex-center flex-col py-5 text-grey-500">
          <Upload size={77} className="mb-2" aria-label="file upload" />
          <h3 className="mb-2 mt-2">Drag photo here</h3>
          <p className="p-medium-12 mb-4">SVG, PNG, JPG</p>
          <UploadButton<typeof OurFileRouterValue, "imageUploader">
            endpoint="imageUploader"
            onClientUploadComplete={(
              res: ClientUploadedFileData<{ uploadedBy: string }>[] | undefined
            ) => {
              if (res && res[0]?.ufsUrl) {
                onFieldChange(res[0].ufsUrl);
              }
            }}
            onUploadError={(error) => {
              alert("Upload failed: " + (error.message || "Unknown error"));
            }}
          />
        </div>
      )}
    </div>
  );
}
