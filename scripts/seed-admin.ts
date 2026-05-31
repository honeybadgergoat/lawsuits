import { getAdminAuth, getAdminDb } from "../lib/firebase-admin";

interface SeedOptions {
  email: string;
  password: string;
  name: string;
  dailyLimit: number;
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const getArg = (key: string): string | undefined => {
    const index = args.findIndex((item) => item === `--${key}`);
    if (index === -1) return undefined;
    return args[index + 1];
  };

  const email = getArg("email") ?? process.env.SEED_ADMIN_EMAIL;
  const password = getArg("password") ?? process.env.SEED_ADMIN_PASSWORD;
  const name = getArg("name") ?? process.env.SEED_ADMIN_NAME ?? "System Admin";
  const dailyLimitRaw = getArg("dailyLimit") ?? process.env.SEED_ADMIN_DAILY_LIMIT ?? "200";
  const dailyLimit = Number(dailyLimitRaw);

  if (!email || !password) {
    throw new Error(
      "Missing required args. Use --email and --password (or SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD)."
    );
  }
  if (!Number.isFinite(dailyLimit) || dailyLimit < 1) {
    throw new Error("dailyLimit must be a positive number.");
  }

  return {
    email,
    password,
    name,
    dailyLimit
  };
}

async function getOrCreateUser(email: string, password: string, name: string): Promise<string> {
  const auth = getAdminAuth();
  try {
    const created = await auth.createUser({
      email,
      password,
      displayName: name
    });
    return created.uid;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("email-already-exists")) {
      throw error;
    }
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      displayName: name,
      disabled: false
    });
    return existing.uid;
  }
}

async function upsertUserProfile(
  uid: string,
  input: Omit<SeedOptions, "password">
): Promise<void> {
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        email: input.email,
        name: input.name,
        role: "ADMIN",
        isActive: true,
        dailyLimit: input.dailyLimit,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { merge: true }
    );
}

async function main() {
  const options = parseArgs();
  const uid = await getOrCreateUser(options.email, options.password, options.name);
  await upsertUserProfile(uid, {
    email: options.email,
    name: options.name,
    dailyLimit: options.dailyLimit
  });

  console.log("Admin user is ready.");
  console.log(`uid: ${uid}`);
  console.log(`email: ${options.email}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Seed admin failed:", message);
  process.exit(1);
});
