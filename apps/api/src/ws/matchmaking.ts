import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { prisma } from "../client.js";
import { JoinMsg } from "./types.js";

type Client = { ws: WebSocket; wallet: string; xp: number; nickname: string; escrowId?: bigint };
type Key = string; // gameId|playMode|stake

const queues = new Map<Key, Client[]>(); // simple FIFO per bucket
const pairs = new Map<string, { a: Client; b: Client }>(); // matchId -> paired clients

function genId(prefix = "m"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function bucket(gameId: string, playMode: string, stake: number) {
  return `${gameId}|${playMode}|${stake}`;
}

export async function registerMatchmakingWs(app: FastifyInstance) {
  app.get("/matchmaking", { websocket: true }, async (connection: any) => {
    const conn = connection.socket as WebSocket;
    conn.on("message", async (raw: WebSocket.RawData) => {
      let msg: JoinMsg;
      try { msg = JoinMsg.parse(JSON.parse(raw.toString())); }
      catch { return conn.send(JSON.stringify({ event: "error", data: { reason: "bad_request" } })); }

  const escrowId = msg.escrowId ? BigInt(msg.escrowId) : undefined;

      // upsert user (graceful fallback if DB is down)
      let userXp = msg.playerXP;
      let userNick = msg.wallet.slice(0, 6);
      try {
        const user = await prisma.user.upsert({
          where: { walletAddress: msg.wallet },
          update: {},
          create: { walletAddress: msg.wallet, xp: msg.playerXP }
        });
        userXp = user.xp;
        userNick = user.nickname || user.walletAddress.slice(0, 6);
      } catch {
        // DB unavailable; proceed with defaults
      }

      const client: Client = { ws: conn, wallet: msg.wallet.toLowerCase(), xp: userXp, nickname: userNick, escrowId };
      const key = bucket(msg.gameId, msg.playMode, msg.stakeAmount);
      const q = queues.get(key) ?? [];
      // try to match immediately
      const opponent = q.find(c => c.wallet !== client.wallet);
      if (opponent) {
        // remove opponent from queue
        queues.set(key, q.filter(c => c !== opponent));
        // create match in DB
        let matchId: string = genId();
        let p1Id = "p1";
        let p2Id = "p2";
        try {
          const [p1, p2] = await Promise.all([
            prisma.user.upsert({ where:{ walletAddress: opponent.wallet }, update:{}, create:{ walletAddress: opponent.wallet } }),
            prisma.user.upsert({ where:{ walletAddress: client.wallet }, update:{}, create:{ walletAddress: client.wallet } })
          ]);
          const match = await prisma.match.create({
            data: {
              game: (msg.gameId === "chess" ? "CHESS" : (msg.gameId === "connectfour" ? "C4" : (msg.gameId === "rockpaperscissors" ? "RPS" : "TTT"))) as any,
              p1Id: p1.id, 
              p2Id: p2.id, 
              result: "DRAW",
              arkStaked: msg.playMode === "stake" ? msg.stakeAmount : 0,
              ...(escrowId ? { escrowId: BigInt(escrowId) } : {})
            }
          });
          matchId = match.id;
          p1Id = p1.id;
          p2Id = p2.id;
        } catch {
          // DB down: proceed with generated matchId and ephemeral ids
        }

        const payloadOpp = { event: "match_found", data: {
          matchId,
          escrowId: escrowId ? escrowId.toString() : null,
          opponentId: p2Id,
          opponentName: client.nickname,
          opponentWallet: client.wallet,
          role: "p1"
        }};
        const payloadCli = { event: "match_found", data: {
          matchId,
          escrowId: escrowId ? escrowId.toString() : null,
          opponentId: p1Id,
          opponentName: opponent.nickname,
          opponentWallet: opponent.wallet,
          role: "p2"
        }};
        try { opponent.ws.send(JSON.stringify(payloadOpp)); } catch {}
        try { client.ws.send(JSON.stringify(payloadCli)); } catch {}

        // Track pair to forward escrow after creation if needed
        pairs.set(matchId, { a: opponent, b: client });
      } else {
        // enqueue and start timeout
        q.push(client); queues.set(key, q);
        const wsRef = conn;
        const t = setTimeout(() => {
          if (queues.get(key)?.includes(client)) {
            queues.set(key, (queues.get(key) ?? []).filter(c => c !== client));
            try { wsRef.send(JSON.stringify({ event: "match_timeout", data: {} })); } catch {}
          }
        }, 30_000); // 30 seconds timeout
        conn.once("close", () => {
          clearTimeout(t);
          queues.set(key, (queues.get(key) ?? []).filter(c => c !== client));
        });
      }
    });

    // Support forwarding coordination messages between matched peers (escrow, ready, signed, cancel)
    conn.on("message", (raw: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.action === "escrow" && msg?.matchId && msg?.escrowId) {
          const pair = pairs.get(msg.matchId as string);
          if (!pair) return;
          const sender = [pair.a, pair.b].find(c => c.ws === conn);
          const peer = sender === pair.a ? pair.b : pair.a;
          try { peer.ws.send(JSON.stringify({ event: "escrow", data: { matchId: msg.matchId, escrowId: String(msg.escrowId) } })); } catch {}
        } else if (msg?.action === "ready" && msg?.matchId) {
          const pair = pairs.get(msg.matchId as string); if (!pair) return;
          const sender = [pair.a, pair.b].find(c => c.ws === conn);
          const peer = sender === pair.a ? pair.b : pair.a;
          try { peer.ws.send(JSON.stringify({ event: "ready", data: { matchId: msg.matchId } })); } catch {}
        } else if (msg?.action === "signed_create" && msg?.matchId) {
          const pair = pairs.get(msg.matchId as string); if (!pair) return;
          const sender = [pair.a, pair.b].find(c => c.ws === conn);
          const peer = sender === pair.a ? pair.b : pair.a;
          try { peer.ws.send(JSON.stringify({ event: "signed_create", data: { matchId: msg.matchId } })); } catch {}
        } else if (msg?.action === "signed_join" && msg?.matchId) {
          const pair = pairs.get(msg.matchId as string); if (!pair) return;
          const sender = [pair.a, pair.b].find(c => c.ws === conn);
          const peer = sender === pair.a ? pair.b : pair.a;
          try { peer.ws.send(JSON.stringify({ event: "signed_join", data: { matchId: msg.matchId } })); } catch {}
        } else if (msg?.action === "cancel" && msg?.matchId) {
          const pair = pairs.get(msg.matchId as string); if (!pair) return;
          const sender = [pair.a, pair.b].find(c => c.ws === conn);
          const peer = sender === pair.a ? pair.b : pair.a;
          try { peer.ws.send(JSON.stringify({ event: "match_cancel", data: { matchId: msg.matchId, reason: msg.reason || "cancelled" } })); } catch {}
        }
      } catch {
        // ignore
      }
    });
  });
}
