import type { FastifyInstance } from "fastify";
import { getActiveCounts } from "../ws/game.js";

export async function registerMetricsRoutes(app: FastifyInstance) {
  app.get("/api/active-players", async () => {
    const c = getActiveCounts();
    // Map to frontend game ids
    return {
      tictactoe: c.TTT || 0,
      connectfour: c.C4 || 0,
      rockpaperscissors: c.RPS || 0
    };
  });
}
