import { Sequelize } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: "mssql",
    timezone: "+05:30",
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
    logging: false,
  }
);

export const connectDB = async () => {
  await sequelize.authenticate();
  console.log("✅ DB Connected");
  await sequelize.sync(); 
  console.log("✅ Tables Synced");
};