import fs from "fs"
import {promisify} from "util";
import path from "path";
const createDir = promisify(fs.mkdir)
import {writeFile} from "../index"
const TEXT = "//dont forget to derive these on EVERY DTO\nuse serde::Serialize;\nuse ts_rs::TS;"
export default async function createDtos(cwd: string, mpath: string) {
    const dtoPath = path.join(cwd, mpath, "src", "dto")
    await createDir(dtoPath)
    await Promise.all([
        writeFile(path.join(dtoPath, "mod.rs"), `pub mod response;\npub mod request`),
        writeFile(path.join(dtoPath, "request.rs"), TEXT),
        writeFile(path.join(dtoPath, "response.rs"), TEXT)
    ])
}