


export const addModDeclrs = (test: boolean, controller: boolean, service: boolean, dto: boolean) => `#[macro_use]
extern crate log;
${test ? "mod test;\n" : ""}${controller ? "pub mod controller;\n" : ""}${service ? "pub mod service;\n" : ""}${dto ? "mod dto;\n" : ""}
`

export const hookFn = () => `pub fn hook() {
    info!("Module initialized");
}`