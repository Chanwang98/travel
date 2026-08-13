import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "../../../db";
import { travelPlans } from "../../../db/schema";

async function getOwner() {
  const requestHeaders = await headers();
  return requestHeaders.get("oai-authenticated-user-email") ?? "preview-user";
}

function isPlan(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  return (
    typeof plan.title === "string" &&
    typeof plan.destination === "string" &&
    typeof plan.dateRange === "string" &&
    typeof plan.companions === "string" &&
    Array.isArray(plan.items)
  );
}

export async function GET() {
  try {
    const owner = await getOwner();
    const db = await getDb();
    const [record] = await db
      .select()
      .from(travelPlans)
      .where(eq(travelPlans.owner, owner))
      .limit(1);
    return Response.json({ plan: record ? JSON.parse(record.data) : null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "读取行程失败" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { plan?: unknown };
    if (!isPlan(body.plan)) {
      return Response.json({ error: "行程格式不正确" }, { status: 400 });
    }
    const data = JSON.stringify(body.plan);
    if (data.length > 250_000) {
      return Response.json({ error: "行程内容过大" }, { status: 413 });
    }
    const owner = await getOwner();
    const db = await getDb();
    const updatedAt = new Date();
    await db
      .insert(travelPlans)
      .values({ owner, data, updatedAt })
      .onConflictDoUpdate({
        target: travelPlans.owner,
        set: { data, updatedAt },
      });
    return Response.json({ saved: true, updatedAt: updatedAt.toISOString() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "保存行程失败" },
      { status: 500 },
    );
  }
}
