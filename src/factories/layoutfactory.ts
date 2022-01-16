import {writeFile} from "../index";
import path from "path";

export default async function writeLayout(cwd: string, modulePath: string, modname: string, controller: boolean, service: boolean, test: boolean) {
const to = path.join(cwd, modulePath, "src")
    if (controller) {
        await writeFile(to + "/controller.rs", "//Happy controlling")
    }
    if (service) {
        await writeFile(to + "/service.rs", "//Happy servicing")
    }
    if (test) {
        await writeFile(to +"/test.rs", `#[cfg(test)]
mod ${modname}_test {
        
}`)
    }
}