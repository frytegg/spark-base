import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { z } from "zod";
import { prisma } from "../client.js";

const Move = z.object({
  action: z.literal("move"),
  position: z.number().int().min(0).max(63) // TTT uses 0..8; C4 uses 0..6; chess can map to 0..63 later
});

const Choice = z.object({
  action: z.literal("choice"),
  choice: z.enum(["rock", "paper", "scissors"]) as unknown as z.ZodType<
    "rock" | "paper" | "scissors"
  >,
});

type Room = {
  type?: "TTT" | "C4" | "RPS";
  a?: WebSocket;
  b?: WebSocket;
  lastMove?: { position: number; timestamp: string };
  lastSide?: "a" | "b"; // whose turn moved last
  started?: boolean;
  startAt?: number; // ms epoch when match started
  currentSide?: "a" | "b"; // whose turn it is now
  // TTT state
  board?: Array<"X" | "O" | null>; // Tic-Tac-Toe board
  movesA?: number[]; // positions history for side A (X)
  movesB?: number[]; // positions history for side B (O)
  // C4 state
  c4Board?: Array<"red" | "yellow" | null>; // 7x6 grid = 42 cells
  // RPS state
  rpsRound?: number;
  rpsScores?: { a: number; b: number };
  rpsChoices?: { a: "rock" | "paper" | "scissors" | null; b: "rock" | "paper" | "scissors" | null };
  ended?: boolean;
  winner?: "a" | "b" | null;
};
const rooms = new Map<string, Room>(); // matchId -> room
// Active player counts by game type (approximate: counts connected sockets per type)
const activeCounts = { TTT: 0, C4: 0, RPS: 0 } as Record<Required<Room>["type"], number>;
const connTypes = new WeakMap<WebSocket, Room["type"]>();

export function getActiveCounts() {
  return { ...activeCounts };
}

export async function registerGameWs(app: FastifyInstance) {
  app.get("/game/:matchId", { websocket: true }, (connection: any, req) => {
    const conn = connection.socket as WebSocket;
    const matchId = (req.params as any).matchId as string;
    const room = rooms.get(matchId) ?? {};
    if (!room.a) room.a = conn; else room.b = conn;
    rooms.set(matchId, room);

    function getPeer(): WebSocket | undefined {
      const r = rooms.get(matchId);
      if (!r) return undefined;
      return r.a === conn ? r.b : r.a;
    }
    function getSide(): "a" | "b" | undefined {
      const r = rooms.get(matchId);
      if (!r) return undefined;
      return r.a === conn ? "a" : (r.b === conn ? "b" : undefined);
    }

    // On first connect per match, resolve game type from DB and store in room
    (async () => {
      const r = rooms.get(matchId) ?? {};
      if (!r.type) {
        try {
          const m = await prisma.match.findUnique({ where: { id: matchId } });
          const g = (m as any)?.game as string | undefined;
          const t = (g === "C4" ? "C4" : g === "RPS" ? "RPS" : "TTT") as Room["type"];
          r.type = t;
          rooms.set(matchId, r);
          // track active connection count by type
          const tt = t as "TTT"|"C4"|"RPS";
          activeCounts[tt] = (activeCounts[tt] ?? 0) + 1;
          connTypes.set(conn, tt);
        } catch {
          r.type = r.type ?? "TTT";
          rooms.set(matchId, r);
          const tt = (r.type ?? "TTT") as "TTT"|"C4"|"RPS";
          activeCounts[tt] = (activeCounts[tt] ?? 0) + 1;
          connTypes.set(conn, tt);
        }
      }
      // After type resolution, proceed with start/state flow for this connection
      const rSide = getSide();
      const rState = rooms.get(matchId)!;
      if (rSide && rState.started) {
        try {
          conn.send(JSON.stringify({
            event: "start",
            data: { startAt: rState.startAt, current: rState.currentSide, side: rSide }
          }));
        } catch {}
      }

      // Then send current authoritative state if available and applicable
      const t = rState.type ?? "TTT";
      if (t === "TTT" && rState.board && rState.currentSide) {
        conn.send(JSON.stringify({
          event: "state",
          data: { board: rState.board, current: rState.currentSide, timestamp: Date.now() }
        }));
      } else if (t === "C4" && rState.c4Board && rState.currentSide) {
        conn.send(JSON.stringify({
          event: "state",
          data: { board: rState.c4Board, current: rState.currentSide, timestamp: Date.now() }
        }));
      } else if (rState.lastMove) {
        // fallback legacy: send last move to newly connected player if it exists
        conn.send(JSON.stringify({ event: "opponent_move", data: rState.lastMove }));
      }

      // If both connected and not started, initialize and broadcast start
      const rNow = rooms.get(matchId)!;
      if (rNow.a && rNow.b && !rNow.started) {
        rNow.started = true;
        rNow.startAt = Date.now();
        rNow.currentSide = Math.random() < 0.5 ? "a" : "b";
        rNow.lastSide = undefined;
        rNow.ended = false;
        rNow.winner = null;
        // Initialize per-game state
        const type = rNow.type ?? "TTT";
        if (type === "TTT") {
          rNow.board = Array(9).fill(null);
          rNow.movesA = [];
          rNow.movesB = [];
        } else if (type === "C4") {
          rNow.c4Board = Array(42).fill(null);
        } else if (type === "RPS") {
          rNow.rpsRound = 1;
          rNow.rpsScores = { a: 0, b: 0 };
          rNow.rpsChoices = { a: null, b: null };
        }
        rooms.set(matchId, rNow);
        // Send individualized start with receiver side and current turn
        try { rNow.a.send(JSON.stringify({ event: "start", data: { startAt: rNow.startAt, current: rNow.currentSide, side: "a" } })); } catch {}
        try { rNow.b.send(JSON.stringify({ event: "start", data: { startAt: rNow.startAt, current: rNow.currentSide, side: "b" } })); } catch {}
        // Immediately follow with state for board-based games
        if (type === "TTT") {
          const statePayload = JSON.stringify({ event: "state", data: { board: rNow.board, current: rNow.currentSide, timestamp: Date.now() } });
          try { rNow.a.send(statePayload); } catch {}
          try { rNow.b.send(statePayload); } catch {}
        } else if (type === "C4") {
          const statePayload = JSON.stringify({ event: "state", data: { board: rNow.c4Board, current: rNow.currentSide, timestamp: Date.now() } });
          try { rNow.a.send(statePayload); } catch {}
          try { rNow.b.send(statePayload); } catch {}
        }
      }
    })();
    conn.on("close", () => {
      const t = connTypes.get(conn);
      if (t) {
        activeCounts[t] = Math.max(0, (activeCounts[t] ?? 0) - 1);
        connTypes.delete(conn);
      }
    });
    conn.on("message", (raw: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.action === "move") {
          const m = Move.parse(msg);
          // Switch based on room type
          const r = rooms.get(matchId);
          if (!r) return;
          const me = getSide();
          if (!me) return;
          // Stop accepting moves after game end
          if (r.ended) {
            conn.send(JSON.stringify({ event: "error", data: { reason: "game_already_ended" } }));
            return;
          }
          const type = r.type ?? "TTT";
          if (!r.currentSide || r.currentSide !== me) {
            conn.send(JSON.stringify({ event: "error", data: { reason: "not_your_turn" } }));
            return;
          }
          if (type === "TTT") {
            // Initialize board if needed
            if (!r.board) { r.board = Array(9).fill(null); }
            if (!r.movesA) r.movesA = [];
            if (!r.movesB) r.movesB = [];
            const symbol = me === "a" ? "X" : "O";
            const moves = me === "a" ? r.movesA! : r.movesB!;
            // Validate the cell is free (server-side rule)
            if (m.position < 0 || m.position >= 9 || r.board[m.position] !== null) {
              conn.send(JSON.stringify({ event: "error", data: { reason: "cell_occupied" } }));
              return;
            }
            // Infinity win-first rule: check win BEFORE removing oldest piece
            const tempBoard = r.board.slice();
            tempBoard[m.position] = symbol;
            const immediateWinner = checkTTTWinner(tempBoard);
            if (immediateWinner) {
              // Accept the winning placement without removing oldest
              r.board = tempBoard;
              moves.push(m.position);
              const ts = new Date().toISOString();
              r.lastMove = { position: m.position, timestamp: ts };
              r.lastSide = me;
              r.ended = true;
              r.winner = me; // winner is the mover
              rooms.set(matchId, r);
              const endPayload = JSON.stringify({
                event: "game_end",
                data: { winnerSide: r.winner, reason: "ttt_win" }
              });
              r.a?.send(endPayload);
              r.b?.send(endPayload);
              return;
            }

            // No immediate win: apply Infinity rule by removing oldest if needed, then place
            if (moves.length >= 3) {
              const oldest = moves.shift()!;
              r.board[oldest] = null;
            }
            r.board[m.position] = symbol;
            moves.push(m.position);
            const ts = new Date().toISOString();
            r.lastMove = { position: m.position, timestamp: ts };
            r.lastSide = me;
            // Toggle turn to other side and broadcast updated state
            r.currentSide = me === "a" ? "b" : "a";
            rooms.set(matchId, r);
            const statePayload = JSON.stringify({
              event: "state",
              data: { board: r.board, current: r.currentSide, timestamp: Date.now() }
            });
            r.a?.send(statePayload);
            r.b?.send(statePayload);
          } else if (type === "C4") {
            if (!r.c4Board) r.c4Board = Array(42).fill(null);
            const col = m.position;
            if (col < 0 || col > 6) {
              conn.send(JSON.stringify({ event: "error", data: { reason: "invalid_column" } }));
              return;
            }
            // Find lowest empty row in column
            let rowIdx = -1;
            for (let row = 5; row >= 0; row--) {
              const idx = row * 7 + col;
              if (r.c4Board[idx] === null) { rowIdx = row; break; }
            }
            if (rowIdx === -1) {
              conn.send(JSON.stringify({ event: "error", data: { reason: "column_full" } }));
              return;
            }
            const color = me === "a" ? "red" : "yellow";
            r.c4Board[rowIdx * 7 + col] = color;
            // Update last move and toggle turn
            r.lastMove = { position: col, timestamp: new Date().toISOString() };
            r.lastSide = me;
            // Check winner
            const winnerColor = checkC4Winner(r.c4Board);
            if (winnerColor) {
              r.ended = true;
              r.winner = winnerColor === "red" ? "a" : "b";
              rooms.set(matchId, r);
              const endPayload = JSON.stringify({ event: "game_end", data: { winnerSide: r.winner, reason: "c4_win" } });
              r.a?.send(endPayload);
              r.b?.send(endPayload);
              return;
            }
            // No winner: toggle turn and broadcast state
            r.currentSide = me === "a" ? "b" : "a";
            rooms.set(matchId, r);
            const statePayload = JSON.stringify({ event: "state", data: { board: r.c4Board, current: r.currentSide, timestamp: Date.now() } });
            r.a?.send(statePayload);
            r.b?.send(statePayload);
          } else {
            // Unsupported type for move (e.g., RPS)
            conn.send(JSON.stringify({ event: "error", data: { reason: "invalid_action_for_game" } }));
          }
        } else if (msg?.action === "end") {
          // Determine winner as the peer of the forfeiting side and notify both
          const me = getSide();
          const winnerSide = me === "a" ? "b" : "a";
          // Mark room as ended to prevent further moves
          const r = rooms.get(matchId);
          if (r) {
            r.ended = true;
            r.winner = winnerSide as any;
            rooms.set(matchId, r);
          }
          const payload = JSON.stringify({ event: "game_end", data: { reason: (msg.data?.reason || "forfeit"), winnerSide } });
          getPeer()?.send(payload);
          conn.send(payload);
        } else if (msg?.action === "choice") {
          // RPS simultaneous choice handling
          const c = Choice.safeParse(msg);
          if (!c.success) { conn.send(JSON.stringify({ event: "error", data: { reason: "bad_message" } })); return; }
          const r = rooms.get(matchId);
          if (!r) return;
          if (r.ended) { conn.send(JSON.stringify({ event: "error", data: { reason: "game_already_ended" } })); return; }
          const type = r.type ?? "TTT";
          if (type !== "RPS") { conn.send(JSON.stringify({ event: "error", data: { reason: "invalid_action_for_game" } })); return; }
          const me = getSide(); if (!me) return;
          if (!r.rpsRound) r.rpsRound = 1;
          if (!r.rpsScores) r.rpsScores = { a: 0, b: 0 };
          if (!r.rpsChoices) r.rpsChoices = { a: null, b: null };
          // Cache choice but don't reveal yet
          r.rpsChoices[me] = c.data.choice;
          rooms.set(matchId, r);
          // When both choices present, reveal and score
          if (r.rpsChoices.a && r.rpsChoices.b) {
            const aC = r.rpsChoices.a;
            const bC = r.rpsChoices.b;
            const roundWinner = rpsRoundWinner(aC, bC);
            const reveal = JSON.stringify({ event: "rps_reveal", data: { round: r.rpsRound, aChoice: aC, bChoice: bC, winnerSide: roundWinner } });
            r.a?.send(reveal);
            r.b?.send(reveal);
            if (roundWinner === "a") r.rpsScores.a += 1;
            else if (roundWinner === "b") r.rpsScores.b += 1;
            // Victory condition: first to 5
            if (r.rpsScores.a >= 5 || r.rpsScores.b >= 5) {
              r.ended = true;
              r.winner = r.rpsScores.a >= 5 ? "a" : "b";
              rooms.set(matchId, r);
              const endPayload = JSON.stringify({ event: "game_end", data: { winnerSide: r.winner, reason: "rps_first_to_5" } });
              r.a?.send(endPayload);
              r.b?.send(endPayload);
            } else {
              // Next round
              r.rpsRound += 1;
              r.rpsChoices = { a: null, b: null };
              rooms.set(matchId, r);
            }
          }
        }
      } catch {
        conn.send(JSON.stringify({ event: "error", data: { reason: "bad_message" } }));
      }
    });

    conn.on("close", () => {
      const r = rooms.get(matchId);
      if (!r) return;
      if (r.a === conn) r.a = undefined; else if (r.b === conn) r.b = undefined;
      if (!r.a && !r.b) rooms.delete(matchId); else rooms.set(matchId, r);
    });
  });
}

// Determine a winner on a 3x3 board; returns "X" | "O" | null
function checkTTTWinner(board: Array<"X" | "O" | null>): "X" | "O" | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  return null;
}

// Check Connect Four 7x6 winner; returns "red" | "yellow" | null
function checkC4Winner(board: Array<"red" | "yellow" | null>): "red" | "yellow" | null {
  const rows = 6, cols = 7;
  // Horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const i = r * cols + c;
      const v = board[i];
      if (v && v === board[i + 1] && v === board[i + 2] && v === board[i + 3]) return v;
    }
  }
  // Vertical
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - 4; r++) {
      const i = r * cols + c;
      const v = board[i];
      if (v && v === board[i + cols] && v === board[i + 2 * cols] && v === board[i + 3 * cols]) return v;
    }
  }
  // Diagonal down-right
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      const i = r * cols + c;
      const v = board[i];
      if (v && v === board[i + cols + 1] && v === board[i + 2 * cols + 2] && v === board[i + 3 * cols + 3]) return v;
    }
  }
  // Diagonal down-left
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 3; c < cols; c++) {
      const i = r * cols + c;
      const v = board[i];
      if (v && v === board[i + cols - 1] && v === board[i + 2 * cols - 2] && v === board[i + 3 * cols - 3]) return v;
    }
  }
  return null;
}

// Determine RPS round winner: returns "a" | "b" | null (draw)
function rpsRoundWinner(a: "rock" | "paper" | "scissors", b: "rock" | "paper" | "scissors"): "a" | "b" | null {
  if (a === b) return null;
  if ((a === "rock" && b === "scissors") || (a === "scissors" && b === "paper") || (a === "paper" && b === "rock")) return "a";
  return "b";
}
