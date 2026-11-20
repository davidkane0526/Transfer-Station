#!/usr/bin/env python3
"""Serve the private assembly preview and persist part revisions in SQLite."""

import argparse
from contextlib import closing
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import sqlite3
from urllib.parse import urlsplit

PART = r"[AB](?:\d{2}[A-Z]{0,2}|-H\d{2})"
PART_PATH = re.compile(rf"/api/parts/({PART})(/history)?")
FIELDS = {
    "name", "maker", "model", "dims", "material", "qty", "unit", "price",
    "currency", "priceSource", "datasheet", "drawing", "connection", "note", "manualConfirmed",
}
LINKS = {"priceSource", "datasheet", "drawing"}


def connect(path):
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    return db


def initialize(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect(path)) as db, db:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("""
            CREATE TABLE IF NOT EXISTS part_revision (
                revision INTEGER PRIMARY KEY,
                part TEXT NOT NULL,
                parent INTEGER REFERENCES part_revision(revision),
                changed_at TEXT NOT NULL,
                field TEXT NOT NULL,
                previous TEXT NOT NULL,
                value TEXT NOT NULL,
                snapshot TEXT NOT NULL
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS part_head ON part_revision(part, revision DESC)")


def head(row):
    return {"revision": row["revision"], "values": json.loads(row["snapshot"])} if row else {
        "revision": 0, "values": {},
    }


def clean_value(field, value):
    if not isinstance(value, str) or len(value) > 4000:
        raise ValueError("字段必须是 4000 字以内的文本。")
    value = value.strip()
    if field in {"qty", "price"} and value and not re.fullmatch(r"\d{1,9}(?:\.\d{1,4})?", value):
        raise ValueError("请输入非负数字。")
    if field == "manualConfirmed" and value not in {"true", "false"}:
        raise ValueError("人工确认状态无效。")
    if field == "currency" and value and not re.fullmatch(r"[A-Z]{3}", value.upper()):
        raise ValueError("请用三字母币种代码，例如 CNY。")
    if field in LINKS and value:
        url = urlsplit(value)
        if url.scheme != "https" or not url.hostname:
            raise ValueError("请填写完整的 HTTPS 链接。")
    return value.upper() if field == "currency" else value


class Preview(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory, database, **kwargs):
        self.database = database
        super().__init__(*args, directory=directory, **kwargs)

    def reply(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_request(self, code="-", size="-"):
        pass

    def list_directory(self, path):
        self.send_error(404)
        return None

    def send_head(self):
        root = Path(self.directory).resolve()
        path = Path(self.translate_path(self.path))
        if path.is_dir():
            path = path / "index.html"
        try:
            relative = path.resolve().relative_to(root)
        except ValueError:
            self.send_error(404)
            return None
        if any(piece.startswith(".") for piece in relative.parts):
            self.send_error(404)
            return None
        return super().send_head()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/parts":
            with closing(connect(self.database)) as db, db:
                rows = db.execute("""
                    SELECT p.part, p.revision, p.snapshot FROM part_revision p JOIN
                    (SELECT MAX(revision) AS revision FROM part_revision GROUP BY part) h
                    ON p.revision=h.revision
                """)
                self.reply(200, {"parts": {row["part"]: head(row) for row in rows}})
            return
        match = PART_PATH.fullmatch(path)
        if match and match[2]:
            with closing(connect(self.database)) as db, db:
                rows = db.execute("""
                    SELECT revision, parent, changed_at, field, previous, value
                    FROM part_revision WHERE part=? ORDER BY revision DESC
                """, (match[1],))
                self.reply(200, {"history": [dict(row) for row in rows]})
            return
        super().do_GET()

    def do_POST(self):
        match = PART_PATH.fullmatch(urlsplit(self.path).path)
        if not match or match[2]:
            self.reply(404, {"error": "找不到零件接口。"})
            return
        if self.headers.get("Sec-Fetch-Site") == "cross-site" or self.headers.get_content_type() != "application/json":
            self.reply(403, {"error": "请从预览页面提交。"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 32768:
                raise ValueError("编辑内容大小超出范围。")
            body = json.loads(self.rfile.read(length))
            field = body["field"]
            if field not in FIELDS:
                raise ValueError("此字段不可编辑。")
            value = clean_value(field, body["value"])
            previous_default = body.get("original", "")
            if not isinstance(previous_default, str) or len(previous_default) > 4000:
                raise ValueError("原有字段值超出范围。")
            expected = body["baseRevision"]
            if type(expected) is not int or expected < 0:
                raise ValueError("缺少有效的版本号。")
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            self.reply(400, {"error": str(error)})
            return
        part = match[1]
        with closing(connect(self.database)) as db, db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT revision, snapshot FROM part_revision WHERE part=? ORDER BY revision DESC LIMIT 1",
                (part,),
            ).fetchone()
            current = head(row)
            if expected != current["revision"]:
                db.rollback()
                self.reply(409, {"error": "此零件已有新的修改。请复核最新值再保存。", "part": current})
                return
            values = current["values"]
            previous = values.get(field, previous_default)
            if previous != value:
                values[field] = value
                now = datetime.now(timezone.utc).isoformat(timespec="seconds")
                result = db.execute("""
                    INSERT INTO part_revision (part,parent,changed_at,field,previous,value,snapshot)
                    VALUES (?,?,?,?,?,?,?)
                """, (part, expected or None, now, field, previous, value, json.dumps(values, ensure_ascii=False)))
                current["revision"] = result.lastrowid
            db.commit()
        self.reply(200, {"part": current})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--database", type=Path, required=True)
    parser.add_argument("--port", type=int, default=4175)
    args = parser.parse_args()
    directory = args.directory.resolve(strict=True)
    database = args.database.resolve()
    if database.is_relative_to(directory):
        parser.error("database must be outside the static preview directory")
    initialize(database)
    handler = partial(Preview, directory=directory, database=database)
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        server.serve_forever()


if __name__ == "__main__":
    main()
