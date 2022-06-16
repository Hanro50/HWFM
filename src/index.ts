import cluster from "cluster";

import express from "express";
import { createReadStream, existsSync, Stats } from "fs";
import { mkdir, writeFile, lstat, unlink, symlink, copyFile, readFile, readdir } from "fs/promises";
import { basename } from "path";
import { createHash } from "crypto";
import { cpus } from "os";
import { join, resolve } from "path";
import { excp, info, log, serv, strt } from "./lib/logging.js";
export type fileType = "file" | "dir" | "link" | "sys";
export type file = {
    name: string;
    link: string;
    size?: number;
    type: fileType;
    mod?: number;
};

function getFileType(stats: Stats): fileType {
    return stats.isDirectory() ? "dir" : stats.isSymbolicLink() ? "link" : "file";
}

if (cluster.isPrimary) {
    strt("MAIN", process.pid);
    info("THREADS", cpus().length, "->Threads");

    cluster.on("exit", (worker, code, signal) => {
        excp("WORKER", `Worker ${worker.process.pid} died with code ${code}`);
        cluster.fork();
    });
    if (!existsSync("download")) {
        await mkdir("download");
    }
    // await writeFile(join("download", "Up-since.txt"), new Date().toISOString());
    let src = join("download", "source");
    if (!existsSync(src)) await mkdir(src);
    const srcStat = await lstat(src);
    if (srcStat.isSymbolicLink()) {
        await unlink(src);
        await symlink(resolve("src"), src, "junction");
    }
    copyFile("LICENSE", join("download", "LICENSE"));
    if (!existsSync("settings.json")) {
        await writeFile("settings.json", JSON.stringify({ port: 3000 }));
    }

    cpus().forEach((e) => {
        cluster.fork();
    });

} else {
    const upSince = Date.now();
    strt("WORKER", process.pid);
    const settings = JSON.parse((await readFile("settings.json")).toString());
    const app = express();
    const port = settings.port;

    app.use("/favicon.ico", async (req, res) => {
        res.status(200)
            .send(await readFile("favicon.ico"))
            .end();
    });
    app.use("/script", express.static("dist/web"));
    app.get("/api/back", (req, res) => {
        res.redirect(settings.main || "/");
    });

    app.use(async (req, res) => {
        if (req.url.includes("..")) return res.status(403).end();
        const dir = join(...["download", ...req.path.split("/")]);
        if (!existsSync(dir)) return res.status(404).end();

        if ((await lstat(dir)).isFile()) {
            res.set("Cache-control", `public, max-age=${3600 * 24}`);
            if (req.query.meta) {
                serv("HASHES", dir);
                const stats = await lstat(dir);
                const type = getFileType(stats);
                const fileBuffer = await readFile(dir);
                const hash = {
                    md5: createHash("md5").update(fileBuffer).digest("hex"),
                    sha1: createHash("sha1").update(fileBuffer).digest("hex"),
                    sha256: createHash("sha256").update(fileBuffer).digest("hex"),
                };
                const meta = {
                    size: stats.size,
                    name: basename(dir),
                    path: req.path,
                    type,
                    hash,
                };
                res.status(200).type("json").send(meta).end();
                return;
            }
            serv("FILE", dir);
            res.set('Content-Type", "application/octet-stream');
            res.attachment();
            const stream = createReadStream(dir);
            stream.pipe(res, { end: true });
            return;
        }
        res.set("Cache-control", `no-cache`);
        if (req.headers["content-type"] == "json") {
            serv("DIR", req.path);
            let f = req.path.split("/");

            const links: Array<file> = [];

            if (f.pop() || f.pop()) {
                f.push("");
                links.push({ name: "back", link: f.join("/"), type: "sys" });
            }else{
                links.push({ name: "up-since", link: "./#", type: "sys", mod:upSince });
            }
            const dirLS = await readdir(dir);
            for (let index = 0; index < dirLS.length; index++) {
                const e = dirLS[index];

                try {
                    const file = join(dir, e);
                    const stats = await lstat(file);
                    const type = getFileType(stats);
                    links.push({
                        type,
                        mod: stats.mtime.getTime(),
                        size: type == "dir" ? undefined : stats.size,
                        name: e,
                        link: `${req.path}${req.path.endsWith("/") ? "" : "/"}${e}`,
                    });
                } catch (e) { }
            }
            res.status(200).type("json").send(JSON.stringify(links)).end();
        } else {
            res.status(200).type("html").send(await readFile('main.html')).end()
        }
    });
    app.listen(port);
}
