import { NextResponse } from "next/server";

export async function GET() {
  // In real app: const conversations = await prisma.conversation.findMany(...)
  const conversations = [
    {
      id: "conv_1",
      name: "Jane Smith",
      role: "Senior Recruiter @ TechCorp",
      lastMessage: "Looking forward to our call!",
      timestamp: "10:45 AM",
      online: true
    },
    // ... more items
  ];
  
  return NextResponse.json(conversations);
}