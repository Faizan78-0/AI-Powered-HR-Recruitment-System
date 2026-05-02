import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('image') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(process.cwd(), 'public/Uploads', filename);

    await writeFile(uploadPath, buffer);

    const domain = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const imageUrl = `${protocol}://${domain}/Uploads/${filename}`;

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error: unknown) {
    // FIX: Type guard to access .message safely
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    return NextResponse.json(
      { success: false, error: errorMessage }, 
      { status: 500 }
    );
  }
}