import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import websocket from "@fastify/websocket";
import { env } from "./env.js";
import { registerUserRoutes } from "./routes/user.js";
import { registerLeaderboardRoutes } from "./routes/leaderboard.js";
import { registerMatchRoutes } from "./routes/match.js";
import { registerMetricsRoutes } from "./routes/metrics.js";
import { registerFaucetRoutes } from "./routes/faucet.js";
import { registerMatchmakingWs } from "./ws/matchmaking.js";
import { registerGameWs } from "./ws/game.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(helmet);
await app.register(websocket);

app.get("/health", async () => ({ ok: true }));

await registerUserRoutes(app);
await registerLeaderboardRoutes(app);
await registerMatchRoutes(app);
await registerMetricsRoutes(app);
await registerFaucetRoutes(app);
await registerMatchmakingWs(app);
await registerGameWs(app);

const port = env.PORT;
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err); process.exit(1);
});
