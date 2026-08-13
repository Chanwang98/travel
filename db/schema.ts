import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const travelPlans = sqliteTable("travel_plans", {
  owner: text("owner").primaryKey(),
  data: text("data").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
