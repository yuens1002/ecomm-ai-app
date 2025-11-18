import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAnyAdmin } from "@/lib/admin";
import bcrypt from "bcryptjs";

export async function HEAD() {
  try {
    const adminExists = await hasAnyAdmin();
    
    if (adminExists) {
      return new NextResponse(null, { status: 403 });
    }
    
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if an admin already exists
    const adminExists = await hasAnyAdmin();

    if (adminExists) {
      return NextResponse.json(
        { error: "An admin account already exists. Use the admin panel to manage users." },
        { status: 403 }
      );
    }

    const { email, password, name } = await req.json();

    // Validate inputs
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists. Please sign in and ask another admin to grant you admin privileges." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        isAdmin: true,
        emailVerified: new Date(), // Auto-verify for initial admin
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    console.log("✅ Initial admin account created:", adminUser.email);

    return NextResponse.json({
      message: "Admin account created successfully. You can now sign in.",
      user: adminUser,
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
