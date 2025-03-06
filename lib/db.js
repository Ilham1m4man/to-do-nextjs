/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var pool = new pg_1.Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'todo_db',
});
var db = {
    query: function (text, params) { return pool.query(text, params); },
};
exports.default = db;
