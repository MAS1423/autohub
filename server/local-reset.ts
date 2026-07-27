import "dotenv/config";
import { isLocalDataMode, resetLocalStore } from "./localStore";

async function main() {
  if (!isLocalDataMode()) {
    throw new Error("This command resets the JSON demo store only. Use `pnpm seed:mysql` when DATA_MODE=mysql.");
  }

  await resetLocalStore();
  console.log("Local demo data reset successfully.");
  console.log("Admin:  admin@autohub.sa / admin123");
  console.log("Dealer: dealer@autohub.sa / dealer123");
  console.log("User:   user@autohub.sa / user123");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
