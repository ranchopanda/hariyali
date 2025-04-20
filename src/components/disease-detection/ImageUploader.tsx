
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ImageUploaderProps {
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
}

export const ImageUploader = ({ onImageChange, selectedImage }: ImageUploaderProps) => {
  return (
    <div>
      <Label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Upload Plant Image
      </Label>
      <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-600">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 8m0 0v4"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600 dark:text-gray-300">
            <Label
              htmlFor="image-upload"
              className="relative cursor-pointer rounded-md font-medium text-kisan-green hover:text-kisan-green-dark dark:text-kisan-gold dark:hover:text-kisan-gold-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-kisan-green"
            >
              <span>Upload a file</span>
              <Input id="image-upload" type="file" className="sr-only" onChange={onImageChange} accept="image/*" />
            </Label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      </div>
      {selectedImage && (
        <div className="mt-4">
          <img src={selectedImage} alt="Uploaded Plant" className="w-full rounded-md" />
        </div>
      )}
    </div>
  );
};
