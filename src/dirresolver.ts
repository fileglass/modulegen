import fs from "fs"
import path from "path"
const cwd = process.cwd();
import pjson from "../package.json"
const compsDir = path.join(cwd, pjson.compDir || "components")
import glob from "glob"
import {promisify} from "util";

//func is kept bec i might find a usecase later
function calcPath(...paths: string[]) {
    return path.join(...paths)
}

export function isDirCargoRoot(dir: string) {
    return fs.existsSync(calcPath(dir, "Cargo.toml"))
}

function isFreeOfRustFiles(dir: string) {
    return fs.readdirSync(dir).filter(val => val.endsWith(".rs") || val.endsWith(".ts")).length == 0
}

function isDirectory(dir: string) {
return fs.statSync(calcPath(dir)).isDirectory()
}

async function listDir(inpdir: string) {
    return (await promisify(glob)(`${inpdir}/**/*`)).filter(f => isDirectory(f) && isFreeOfRustFiles(f))
}

function isDirOnlyDirs(dir: string) {
    const inpdrs = fs.readdirSync(dir);
    const dirs = inpdrs.filter(v => fs.statSync(path.join(dir, v)).isDirectory())
    return inpdrs.length == dirs.length
}



export default async function getModules() {
const dirs = await listDir(compsDir)
    return dirs.filter(d => !isDirOnlyDirs(d))
}

export function createPath(targetName: string, under: string) {
    if (under === ".") {
        return pjson.compDir + "/" + targetName
    }
    const fixed = Array.from(new Set(under.split("/").filter(v => v.trim().length !== 0)))
    fixed.push(targetName)
    return path.join(pjson.compDir, ...fixed).replace(/\\/g, "/")
}