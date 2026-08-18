import { router } from "./_core/trpc";
import { applicationRouter } from "./routers/application";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  application: applicationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
