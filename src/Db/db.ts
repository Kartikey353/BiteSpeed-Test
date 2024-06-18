import { PrismaClient } from "@prisma/client";

const prismaquery = new PrismaClient({
  log: ["query"],
  datasources: {
    db: {
      url:
        process.env.STAGE === "prd"
          ? process.env.DATABASE_URL
          : process.env.STAGE === "tst"
            ? process.env.DATABASE_URL
            : process.env.DATABASE_URL,
    },
  },
});

export default prismaquery;