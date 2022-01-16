import path from "path";
import {readFile} from "./configfactory";
import {writeFile} from "../index";

const HOOK_RGX = /fn init_mods\(\) \{[^]+info!\("All .+ set up"\);\s+\}/gm

//terrible rust manipulation logic
export async function addHookFnToCore(corePath: string, modName: string) {
    const mainRsPath = path.join(corePath, "src", "main.rs")
    const mainRs = (await readFile(mainRsPath)).toString()
    const hookFn = mainRs.match(HOOK_RGX)[0] as string
    const splitted = hookFn.split(";")
    const atIndex = splitted.findIndex(v => v.includes("info!(")) - 1
    const nArr: string[] = []
    let i = 0
    let incr = 1
    for (const ln of splitted) {
            if (i == atIndex) {
                nArr[i + 1] = `\n\t${modName}::hook();`
                nArr[i] = ln.endsWith("}") ? ln : ln + ";"
                incr++
            } else {
                nArr[i] = ln.endsWith("}") ? ln : ln + ";"
            }
            i = i + incr
    }
    const hookFunction = nArr.join("")
    const replaced = mainRs.replace(hookFn, hookFunction)
    await writeFile(mainRsPath, replaced)
}

