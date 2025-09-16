import { runSyncOrders } from "./syncOrders.ts";

runSyncOrders("332c7485-1a78-4863-8b46-7e0376a19363")
  .then(console.log)
  .catch(console.error);
