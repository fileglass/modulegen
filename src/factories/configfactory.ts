import fs from "fs";
import path from "path";
import {promisify} from "util";
export const readFile = promisify(fs.readFile)
const toml = require("@iarna/toml")
import pjson from "../../package.json"
import {writeFile} from "../index";
import {addHookFnToCore} from "./rust-cgen";

export async function addToMods(cwd: string, modPath: string) {
    const pth = path.join(cwd, "Cargo.toml")
    const tomlFile = (await readFile(pth)).toString()
    const tomlP = toml.parse(tomlFile)
    tomlP.workspace.members.push(modPath)
    const parsed = toml.stringify(tomlP)
    fs.writeFileSync(pth, parsed)
}

export async function addDeps(cwd: string, modPath: string, test: boolean, controller: boolean, dto: boolean, deps: string[], modules: string[]) {
    const cnfPath = path.join(cwd, modPath, "Cargo.toml")
    const fullModPath = path.join(cwd, modPath)
    const cnf = toml.parse((await readFile(cnfPath)).toString())
    if (controller || test) {
        cnf.dependencies["actix-web"] = "4.0.0-beta.10"
    }
    cnf.dependencies.log = "0.4"
    if (deps.includes("database")) {
        cnf.dependencies.sqlx = { version: "0.5", features: [ "postgres", "runtime-tokio-rustls" ] }
    }
    if (dto) {
        cnf.dependencies.serde = "1"
        cnf.dependencies["ts-rs"] = "6.1"
    }
    const root = cwd.replace(/\\/g, "/")
    console.log("Root path:", root)
    if (!deps.includes("None (will overwrite the current selection)")) {
        deps.forEach(dep => {
            const mp = modules.filter(m => m.endsWith(dep))[0]
            const rel = path.relative(fullModPath, mp).replace(/\\/g, "/")
            console.log(`Adding dep: ${dep} (path: ${rel}`)
            cnf.dependencies[dep] = {path: rel}
        })
        const str = toml.stringify(cnf)
        await writeFile(cnfPath, str)
        console.log(`Written ${cnfPath}:\n`, str)
    }
}

export async function addModToCore(cwd: string, modPath: string, modName: string) {
    const corePath = path.join(cwd, pjson.compDir, "core")
    const coreConfigPath = path.join(corePath, "Cargo.toml")
    const modulePath = path.join(cwd, modPath)
    const rel = path.relative(corePath, modPath).replace(/\\/g, "/")
    const config = toml.parse((await readFile(coreConfigPath)))
    config.dependencies[modName] = {path: rel}
    await writeFile(coreConfigPath, toml.stringify(config))
    await addHookFnToCore(corePath, modName)

}