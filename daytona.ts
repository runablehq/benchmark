import { Daytona } from "@daytonaio/sdk";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const daytona = new Daytona();

const sandbox = await daytona.create({
  autoStopInterval: 1,
});

const response = await sandbox.computerUse.start();

const windows = await sandbox.computerUse.display.getWindows();
const info = await sandbox.computerUse.display.getInfo();

const previewLink = await sandbox.getPreviewLink(6080);
console.log(previewLink);
console.log(windows);
console.log(info);

await delay(1000);

console.log(sandbox.id);
