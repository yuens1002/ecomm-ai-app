import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { wizardAnswersSchema } from "@/lib/api-schemas/generate-about";

const bodySchema = z.object({
  answers: wizardAnswersSchema,
  selectedStyle: z.enum(["story", "values", "product"]).default("story"),
  selectedField: z.string().optional(),
});

const stateKey = (pageId: string) => `ai_assist_state_${pageId}`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await prisma.siteSettings.findUnique({
    where: { key: stateKey(id) },
  });

  if (!setting) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    return NextResponse.json(JSON.parse(setting.value));
  } catch (_error) {
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.siteSettings.upsert({
    where: { key: stateKey(resolved.id) },
    update: { value: JSON.stringify(parsed.data) },
    create: { key: stateKey(resolved.id), value: JSON.stringify(parsed.data) },
  });

  return NextResponse.json({ success: true });
}
