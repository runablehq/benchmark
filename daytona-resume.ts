import { Daytona } from "@daytonaio/sdk";

const daytona = new Daytona();

const sandboxId = "7d49b6a6-98ef-4815-9853-c1a3dc0a7efc";
const sandbox = await daytona.get(sandboxId);

if (sandbox.state === "stopped") {
  await daytona.start(sandbox);
}

const previewLink = await sandbox.getPreviewLink(6080);

const computerUse = await sandbox.computerUse.start();

const windows = await sandbox.computerUse.display.getWindows();
const info = await sandbox.computerUse.display.getInfo();

console.log(windows);
console.log(info);
console.log(previewLink);
console.log(computerUse);
