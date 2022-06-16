import type { file } from "../index.js";
export const blank = "";
const r = await fetch(window.location.pathname, { method: "POST", headers: { "content-type": "json" } })
const json: Array<file> = await r.json();
const fhandler = document.getElementById("fhandler") as HTMLSpanElement
fhandler.innerText = `<${window.location.pathname}>`
const table = document.getElementById("content") as HTMLTableElement;
let trh = document.createElement("tr");
let th1 = document.createElement("th");
th1.innerText = "Name"
trh.appendChild(th1)
let th2 = document.createElement("th");
th2.innerText = "Type"
trh.appendChild(th2)
let th3 = document.createElement("th");
th3.innerText = "Date modified"
trh.appendChild(th3)

table.appendChild(trh);


console.log(json)
json.forEach(e => {
    const trd = document.createElement("tr");
    trd.onclick = () =>window.location.assign(e.link);

    let td1 = document.createElement("td");
    td1.innerText = e.name;
    trd.appendChild(td1)

    let td2 = document.createElement("td");
    td2.innerText = e.type;
    trd.appendChild(td2)

    let td3 = document.createElement("td");
    if (e.mod) {
        const d = new Date(e.mod);
        let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', "hour": "2-digit", "minute": "2-digit" };
        td3.innerText = d.toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, options)
    } else {
        td3.innerText = "";
    }

    trd.appendChild(td3)

    table.appendChild(trd)
})


