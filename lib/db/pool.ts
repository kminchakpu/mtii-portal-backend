import mysql from "mysql2/promise";
import { getDatabaseConfig } from "./config";

const config = getDatabaseConfig();

export const db = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});