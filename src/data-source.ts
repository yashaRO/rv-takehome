import "reflect-metadata";
import { DataSource } from "typeorm";
import { Deal } from "./lib/entities/deals/Deal"; // Adjust the path as necessary
import { AuditLog } from "./lib/entities/audit-logs/AuditLog";
import { DealSubscriber } from "./lib/entities/deals/subscriber";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./database.sqlite",
  synchronize: true, // Automatically create database schema based on entities
  logging: false,
  entities: [Deal, AuditLog],
  migrations: [],
  subscribers: [DealSubscriber],
});

// Function to initialize the data source if not already initialized
export async function initializeDataSource() {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    } catch (err) {
      console.error("Error during Data Source initialization:", err);
      throw err;
    }
  }
  return AppDataSource;
}
