import inquirer from "inquirer"
import fs from "fs"
import path from "path"
import getModules, {createPath, isDirCargoRoot} from "./dirresolver";
const pwd = process.cwd();
import pjson from "../package.json"
import {exec, execSync} from "child_process";
import {addDeps, addModToCore, addToMods} from "./factories/configfactory";
import {addModDeclrs, hookFn} from "./factories/boilerplate";
import {promisify} from "util";
import createDtos from "./factories/dtofactory";
export const writeFile = promisify(fs.writeFile)
const noop = () => {}
const cwd = process.cwd()

async function main() {
    const modules = await getModules()
    console.log("mods", modules)
    console.log(`Discovered ${modules.length} modules in ${path.join(pwd, "components")}`)
    const ps = [{
        type: "input",
        name: "modName",
        message: "Module name:",
        validate(input: string): boolean | string {
            const isValid = modules.every(v => !v.endsWith(input))
            if (!isValid) {
                return "This module already exists"
            } else {
                return true
            }
        }
    },
        {
            type: "input",
            name: "parentDir",
            message: `In which directory do you want your service (usually /services) to be put (relative to: ${pjson.compDir}, for deeper paths separate with /, use . for root):`,
            validate(input: string, ans: any): boolean | string {
                if (input === pjson.compDir) {
                    return "This is the root component folder!"
                }
                const pth = path.join(cwd, pjson.compDir, input)
                if (isDirCargoRoot(pth)) {
                    return "This directory can't be used"
                } else {
                    return true
                }
            }
        },
        {
            type: "checkbox",
            name: "isController",
            message: "Will this module respond to HTTP requests (create a controller)?",
            choices: [
                {
                    name: "Yes",
                    value: true
                },
                {
                    name: "No",
                    value: false
                }
            ],
            validate(input: boolean[]): boolean | string {
                if (input.length != 1) {
                    return "Please select only one."
                } else {
                    return true
                }
            }
        },
        {
            type: "checkbox",
            name: "isService",
            message: "Will this module expose functions in a service (create service)?",
            choices: [
                {
                    name: "Yes",
                    value: true
                },
                {
                    name: "No",
                    value: false
                }
            ],
            validate(input: boolean[]): boolean | string {
                if (input.length != 1) {
                    return "Please select only one."
                } else {
                    return true
                }
            }
        },

        {
            type: "checkbox",
            name: "hasDtos",
            message: "Since you chose to have a controller, do you want DTOs? (you probably do)",
            choices: [
                {
                    name: "Yes",
                    value: true
                },
                {
                    name: "No",
                    value: false
                }
            ],
            validate(input: boolean[]): boolean | string {
                if (input.length != 1) {
                    return "Please select only one."
                } else {
                    return true
                }
            },
            when: (answers) => {
                return answers.isController[0]
            }
        },

        {
            type: "checkbox",
            name: "deps",
            message: "Please choose the dependencies of this module",
            choices: modules.map(mname => {
                const splitted = mname.split("/")
                return {name: splitted[splitted.length - 1]}
            }).filter(v => v.name !== "core").concat([{name: "None (will overwrite the current selection)"}]),
        }
    ]
    inquirer.prompt(ps).then(ans => {
        const name = ans.modName
        const isCtrl = ans.isController[0] as boolean
        const isSvrc = ans.isService[0] as boolean
        const isDto = (ans.hasDtos || [])[0] || false as boolean
        const into = ans.parentDir
        const deps = ans.deps.filter(v => v.name !== "None (will overwrite the current selection)") as string[]
        const fixedPath = createPath(name, into)
        console.log("Creating new module in:", fixedPath)
        const cp = exec(`cargo new ${fixedPath} --lib --vcs none`, async (err, stdout, stderr) => {
            if (err) {
                console.log("Cargo error occurred", err)
                process.exit(0)
            } else {
                const libContent = addModDeclrs(true, isCtrl, isSvrc, isDto)
                await Promise.all([
                    addToMods(cwd, fixedPath),
                    writeFile(path.join(cwd, fixedPath, "src", "lib.rs"), libContent + "\n\n" + hookFn()),
                    isDto ? createDtos(cwd, fixedPath) : noop(),
                    addDeps(cwd, fixedPath, true, isCtrl, isDto, deps, modules),
                    addModToCore(cwd, fixedPath, name)
                ])
                console.log("Written all files!")
                const fC = `git add ${fixedPath}/* ${cwd}/Cargo.toml ${cwd}/components/core/*`
                console.log("Creating git commit", fC)
                const gitCp = exec(fC, (err) => {
                        if (err) {
                            console.log("Git error occured", err)
                            process.exit(0)
                        } else {
                            const otp = execSync(`git commit -m "feat(${into[0]}): create ${name} module"`)
                            console.log("Git commit created!", "resp:", otp.toString())
                        }
                })
                gitCp.stdout.on("data", (inp) => {
                    console.log(`[GIT]: ${inp}`)
                })
            }
        })
        cp.stdout.on("data", (inp) => {
            console.log(`[CARGO]: ${inp}`)
        })


    })
}
main()