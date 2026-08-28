import { test as teardown } from "@playwright/test";
import fs from "node:fs";

teardown("clean up auth state", async () => {
  if (fs.existsSync(".auth/user.json")) {
    fs.unlinkSync(".auth/user.json");
  }
});
