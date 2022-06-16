import type { file, fileType } from "../index.js";

/**
 * @author Andrew V. <https://stackoverflow.com/users/3127587/andrew-v>
 * @copyright (c) 2013 Andrew V.
 */
export function humanFileSize(size: number) {
    var i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) + " " + ["B", "kB", "MB", "GB", "TB"][i];
}

export const blank = "";
const r = await fetch(window.location.pathname, { method: "POST", headers: { "content-type": "json" } });
const json: Array<file> = await r.json();
const fhandler = document.getElementById("fhandler") as HTMLSpanElement;
fhandler.innerText = `<${window.location.pathname}>`;
const table = document.getElementById("content") as HTMLTableElement;
let trh = document.createElement("tr");
let th1 = document.createElement("th");
th1.innerText = "Name";
trh.appendChild(th1);
let th2 = document.createElement("th");
th2.innerText = "Type";
trh.appendChild(th2);
let th3 = document.createElement("th");
th3.innerText = "Size";
trh.appendChild(th3);
let th4 = document.createElement("th");
th4.innerText = "Date modified";
trh.appendChild(th4);


table.appendChild(trh);

const srtMap = new Map<fileType, number>();
srtMap.set("dir", 1).set("link", 0.5).set("file", 0.25).set("sys", 0);
json.sort((a, b) => {
    if (a.type == b.type) {
        return a.name.localeCompare(b.name);
    } else {
        return (srtMap.get(a.type) || 0) - (srtMap.get(b.type) || 0);
    }
});

json.forEach((e) => {
    const trd = document.createElement("tr");
    trd.onclick = () => window.location.assign(e.link);

    let td1 = document.createElement("td");
    td1.innerText = e.name;
    trd.appendChild(td1);

    let td2 = document.createElement("td");
    td2.innerText = e.type;
    trd.appendChild(td2);

    let td3 = document.createElement("td");
    td3.innerText = e.size ? humanFileSize(e.size) : "--";
    trd.appendChild(td3);


    let td4 = document.createElement("td");
    if (e.mod) {
        const d = new Date(e.mod);
        let options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
        td4.innerText = d.toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, options);
    } else {
        td4.innerText = "--";
    }
    trd.appendChild(td4);


    table.appendChild(trd);
});
