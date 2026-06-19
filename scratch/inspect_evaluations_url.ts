import "dotenv/config";
import { db } from "../src/db";
import { blindEvaluations } from "../src/db/schema";

async function main() {
  try {
    const res = await db.select().from(blindEvaluations).limit(10);
    console.log("Evaluations:", res.map(e => ({ id: e.id, pdfUrl: e.pdfUrl, status: e.status })));
  } catch (err) {
    console.error(err);
  }
}
main().then(() => process.exit(0));
