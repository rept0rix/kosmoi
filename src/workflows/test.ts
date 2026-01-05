
import { sleep } from "workflow";

export async function verifyIntegration() {
    "use workflow";
    console.log("Workflow integration verified!");
    await sleep("1s");
    return { status: "success" };
}
