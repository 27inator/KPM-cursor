import { ScanEvent } from "./schema";
// @ts-ignore
import { MerkleTree } from "merkletreejs";
// @ts-ignore
const keccak256 = require("keccak256");
import fs from "fs/promises";

const EVENTS_FILE = "events.json";

export async function buildAndStoreEvent(evt: ScanEvent): Promise<string> {
  // 1) Append event to storage
  const raw = await fs.readFile(EVENTS_FILE, "utf8").catch(() => "[]");
  const list = JSON.parse(raw) as ScanEvent[];
  list.push(evt);
  await fs.writeFile(EVENTS_FILE, JSON.stringify(list, null, 2));

  // 2) Build Merkle root
  const leaves = list.map(e => keccak256(JSON.stringify(e)));
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  const root = tree.getRoot().toString("hex");

  // 3) Append root to pending queue
  await fs.appendFile("pending_roots.txt", root + "\n");

  return root;
}

