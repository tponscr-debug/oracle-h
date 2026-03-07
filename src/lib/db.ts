/**
 * ORACLE-H — Database Layer (SQLite via better-sqlite3)
 * 
 * Ce module est le point unique d'accès à la base de données.
 * Il initialise automatiquement le schéma au premier démarrage.
 * Aucune configuration externe requise — le fichier oracle.db est
 * créé dans le répertoire racine du projet.
 * 
 * Tables :
 *  - agents              : bots enregistrés avec leur callback_url
 *  - validation_requests : actions soumises par les agents en attente de validation humaine
 *  - decisions           : log immuable de chaque décision humaine (auditabilité)
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "oracle.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);

  // Performance pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // ── Schema ──────────────────────────────────────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      callback_url  TEXT NOT NULL,
      signature_key TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS validation_requests (
      id               TEXT PRIMARY KEY,
      agent_id         TEXT NOT NULL REFERENCES agents(id),
      action           TEXT NOT NULL,
      rationale        TEXT NOT NULL,
      projected_impact TEXT NOT NULL,
      financial_amount REAL NOT NULL DEFAULT 0,
      status           TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      watchdog_alert   INTEGER NOT NULL DEFAULT 0,
      p_success_before REAL NOT NULL DEFAULT 0.81,
      p_success_after  REAL NOT NULL DEFAULT 0.999,
      expires_at       TEXT DEFAULT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id              TEXT PRIMARY KEY,
      request_id      TEXT NOT NULL REFERENCES validation_requests(id),
      decision        TEXT NOT NULL CHECK(decision IN ('approved','rejected')),
      decided_by      TEXT NOT NULL DEFAULT 'human',
      agent_signature TEXT NOT NULL,
      webhook_sent    INTEGER NOT NULL DEFAULT 0,
      timestamp       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Index pour les requêtes fréquentes
    CREATE INDEX IF NOT EXISTS idx_vr_status     ON validation_requests(status);
    CREATE INDEX IF NOT EXISTS idx_vr_agent      ON validation_requests(agent_id);
    CREATE INDEX IF NOT EXISTS idx_dec_request   ON decisions(request_id);
  `);

  // ── Seed : agent de démonstration ───────────────────────────────────────────
  const agentExists = db
    .prepare("SELECT id FROM agents WHERE id = ?")
    .get("agent-demo-001");

  if (!agentExists) {
    db.prepare(`
      INSERT INTO agents (id, name, callback_url, signature_key)
      VALUES (?, ?, ?, ?)
    `).run(
      "agent-demo-001",
      "OpenClaw Demo Agent",
      "https://webhook.site/oracle-demo",
      "demo-signature-key-change-in-production"
    );
  }

  return db;
}

// ── Types TypeScript ─────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  callback_url: string;
  signature_key: string;
  created_at: string;
}

export interface ValidationRequest {
  id: string;
  agent_id: string;
  action: string;
  rationale: string;
  projected_impact: string;
  financial_amount: number;
  status: "pending" | "approved" | "rejected";
  watchdog_alert: number;
  p_success_before: number;
  p_success_after: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined from agents:
  agent_name?: string;
  agent_callback_url?: string;
}

export interface Decision {
  id: string;
  request_id: string;
  decision: "approved" | "rejected";
  decided_by: string;
  agent_signature: string;
  webhook_sent: number;
  timestamp: string;
}
