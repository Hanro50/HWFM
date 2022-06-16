import cluster from "cluster";

import express from "express";
import { copyFileSync, createReadStream, existsSync, fstatSync, lstatSync, mkdirSync, readdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "fs";
import { cpus } from "os";
import { join, resolve } from "path";
export type fileType = "file" | "dir" | "link" | "sys";
export type file = {
    name: string,
    link: string,
    type: fileType,
    mod?: number
}

if (cluster.isPrimary) {
    console.log(`Number of CPUs is ${cpus().length}`);
    console.log(`Master ${process.pid} is running`);

    cluster.on("exit", (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died with code ${code}`);
        console.log("Let's fork another worker!");
        cluster.fork();
    });
    if (!existsSync("download")) {
        mkdirSync("download")
    }
    writeFileSync(join("download", "lastReboot.txt"), new Date().toISOString());
    let src = join("download", "source");
    const srcStat = lstatSync(src)
    if (srcStat.isSymbolicLink()) {
        unlinkSync(src)
        symlinkSync(resolve("src"), src, "junction");
    }
    copyFileSync("LICENSE", join("download", "LICENSE"))
    if (!existsSync("settings.json")) {
        writeFileSync("settings.json", JSON.stringify({ port: 3000 }))
    }

    cpus().forEach(e => {
        cluster.fork()
    })
} else {
    const settings = JSON.parse(readFileSync("settings.json").toString())
    const app = express();
    const port = settings.port;

    app.use("/favicon.ico", (req, res) => {
        res.status(200).send(readFileSync("favicon.ico")).end();
    })
    app.use("/script", express.static("dist/web"));
    app.get("/api/back", (req, res) => {
        res.redirect(settings.main || "/")
    })
    app.use((req, res) => {
        console.log(req.headers)
        if (req.url.includes(".."))
            return res.status(403).end();
        const dir = join(...["download", ...req.url.split("/")]);
        if (!existsSync(dir)) return res.status(404);
        if (lstatSync(dir).isFile()) {
            res.set('Cache-control', `public, max-age=${3600 * 24}`)
            res.set('Content-Type", "application/octet-stream');
            res.attachment();
            const stream = createReadStream(dir);
            stream.pipe(res, { end: true })
            return
        }
        res.set('Cache-control', `no-cache`)
        if (req.headers["content-type"] == "json") {

            console.log("html")
            let f = req.url.split('/')

            const links: Array<file> = [];

            if (f.pop() || f.pop()) {
                f.push('')
                links.push({ name: "back", link: f.join("/"), type: "sys" })

            } readdirSync(dir).forEach(e => {
                try {
                    const file = join(dir, e);

                    const fstad = lstatSync(file)
                    let type: "file" | "dir" | "link" = fstad.isDirectory() ? "dir" : fstad.isSymbolicLink() ? "link" : "file"


                    links.push({ mod: fstad.mtime.getTime(), type, name: e, link: `${req.url}${req.url.endsWith("/") ? "" : "/"}${e}` })
                } catch (e) {

                }
            })
            console.log(req.url)
            res.status(200).type("json").send(JSON.stringify(links))

        } else {
            res.status(200).type("html").send(readFileSync('404.html')).end()
        }
    })

    app.listen(port);
    console.log(`Client ${process.pid} is running`);
}