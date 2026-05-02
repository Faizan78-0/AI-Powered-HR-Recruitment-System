import multer, { FileFilterCallback } from "multer";
import { Request } from "express"; // Multer types depend on Express types
import path from "path";

// 1. Define Storage Configuration
const storage = multer.diskStorage({
  destination: (
    req: Request, 
    file: Express.Multer.File, 
    cb: (error: Error | null, destination: string) => void
  ) => {
    // In Next.js, saving to public/Uploads makes them web-accessible
    cb(null, "./public/Uploads/");
  },
  filename: (
    req: Request, 
    file: Express.Multer.File, 
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

// 2. Define File Filter with TypeScript types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = ["image/jpg", "image/png", "image/webp", "image/jpeg"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .png, .webp, and .jpeg formats are allowed") as any, false);
  }
};

// 3. Initialize Multer
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Optional: 5MB limit
  }
});

export default upload;