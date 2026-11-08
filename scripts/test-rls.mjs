/**
 * Row level security test.
 *
 * Creates two temporary users in your Supabase project, tries to read and change one
 * user's data as the other, and checks that every attempt is refused. Both users are
 * deleted at the end, even if a check fails.
 *
 * Run with: npm run test:rls
 * Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
 * in .env.local, and the migration in supabase/migrations applied.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(2);
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, clientOptions);

let failures = 0;
function check(name, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

const stamp = Date.now();
const password = `${crypto.randomUUID()}Aa1!`;
const createdUserIds = [];

async function makeUser(tag) {
  const email = `apex-rls-${tag}-${stamp}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Could not create test user ${tag}: ${error.message}`);
  createdUserIds.push(data.user.id);

  const client = createClient(url, anonKey, clientOptions);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`Could not sign in test user ${tag}: ${signIn.error.message}`);
  return { id: data.user.id, client };
}

async function run() {
  const a = await makeUser("a");
  const b = await makeUser("b");

  // The sign-up trigger should have created a profile for each user.
  const profilesAdmin = await admin.from("profiles").select("id").in("id", [a.id, b.id]);
  if (profilesAdmin.error) {
    throw new Error(
      `Could not read profiles. Run both files in supabase/migrations (init, then grants) in the Supabase SQL Editor. ${profilesAdmin.error.message}`,
    );
  }
  check("sign-up trigger creates a profile for each user", profilesAdmin.data.length === 2);

  // Profiles: each user sees only their own row.
  const aProfiles = await a.client.from("profiles").select("id");
  check(
    "user A sees only their own profile",
    !aProfiles.error && aProfiles.data.length === 1 && aProfiles.data[0].id === a.id,
  );
  const bSeesAProfile = await b.client.from("profiles").select("id").eq("id", a.id);
  check(
    "user B cannot read user A's profile",
    !bSeesAProfile.error && bSeesAProfile.data.length === 0,
  );

  const bEditsAProfile = await b.client
    .from("profiles")
    .update({ display_name: "hacked" })
    .eq("id", a.id)
    .select();
  check(
    "user B cannot edit user A's profile",
    !bEditsAProfile.error && bEditsAProfile.data.length === 0,
  );

  // Food logs: A writes a row.
  const insertA = await a.client
    .from("food_logs")
    .insert({ user_id: a.id, meal_type: "lunch", name: "Dal and rice", calories: 395 })
    .select()
    .single();
  check(
    "user A can add their own food log",
    !insertA.error && Boolean(insertA.data),
    insertA.error?.message,
  );
  const rowId = insertA.data?.id;

  const aReads = await a.client.from("food_logs").select("id");
  check("user A can read their own food log", !aReads.error && aReads.data.length === 1);

  const bReads = await b.client.from("food_logs").select("id");
  check("user B sees no food logs", !bReads.error && bReads.data.length === 0);

  const bReadsById = await b.client.from("food_logs").select("id").eq("id", rowId);
  check("user B cannot read A's food log by id", !bReadsById.error && bReadsById.data.length === 0);

  const bInsertsAsA = await b.client
    .from("food_logs")
    .insert({ user_id: a.id, meal_type: "snack", name: "Planted row", calories: 1 });
  check(
    "user B cannot add a food log for user A",
    Boolean(bInsertsAsA.error),
    bInsertsAsA.error?.code,
  );

  const bUpdates = await b.client
    .from("food_logs")
    .update({ name: "hacked" })
    .eq("id", rowId)
    .select();
  check("user B cannot update A's food log", !bUpdates.error && bUpdates.data.length === 0);

  const bDeletes = await b.client.from("food_logs").delete().eq("id", rowId).select();
  check("user B cannot delete A's food log", !bDeletes.error && bDeletes.data.length === 0);

  const stillThere = await admin.from("food_logs").select("name").eq("id", rowId).single();
  check(
    "A's food log is unchanged after B's attempts",
    !stillThere.error && stillThere.data.name === "Dal and rice",
  );

  const badValue = await a.client
    .from("food_logs")
    .insert({ user_id: a.id, meal_type: "lunch", name: "Negative", calories: -5 });
  check("negative calories are rejected", Boolean(badValue.error), badValue.error?.code);

  // Other tables follow the same rule.
  const aGoal = await a.client
    .from("goals")
    .insert({ user_id: a.id, goal_type: "maintain", daily_calories: 2400 })
    .select()
    .single();
  check("user A can set a goal", !aGoal.error, aGoal.error?.message);
  const bGoals = await b.client.from("goals").select("id");
  check("user B sees no goals", !bGoals.error && bGoals.data.length === 0);

  const aActivity = await a.client
    .from("activity_logs")
    .insert({ user_id: a.id, name: "Swimming", duration_min: 30, calories_burned: 250 })
    .select()
    .single();
  check("user A can log an activity", !aActivity.error, aActivity.error?.message);
  const bActivity = await b.client.from("activity_logs").select("id");
  check("user B sees no activities", !bActivity.error && bActivity.data.length === 0);

  // AI usage: readable by its owner, writable only by the server.
  const usageInsert = await admin
    .from("ai_usage")
    .insert({ user_id: a.id, task: "test", provider: "mistral", model: "test-model" });
  check("the server can record AI usage", !usageInsert.error, usageInsert.error?.message);
  const aUsage = await a.client.from("ai_usage").select("id");
  check("user A can read their own AI usage", !aUsage.error && aUsage.data.length === 1);
  const bUsage = await b.client.from("ai_usage").select("id");
  check("user B cannot read A's AI usage", !bUsage.error && bUsage.data.length === 0);
  const aWritesUsage = await a.client
    .from("ai_usage")
    .insert({ user_id: a.id, task: "forged", provider: "gemini", model: "x" });
  check("a user cannot write AI usage rows", Boolean(aWritesUsage.error), aWritesUsage.error?.code);

  // Logged-out visitors get nothing.
  const anon = createClient(url, anonKey, clientOptions);
  const anonFood = await anon.from("food_logs").select("id");
  check(
    "logged-out visitors cannot read food logs",
    Boolean(anonFood.error) || anonFood.data.length === 0,
  );
  const anonProfiles = await anon.from("profiles").select("id");
  check(
    "logged-out visitors cannot read profiles",
    Boolean(anonProfiles.error) || anonProfiles.data.length === 0,
  );
}

try {
  await run();
} catch (error) {
  failures += 1;
  console.error(`ERROR  ${error.message}`);
} finally {
  for (const id of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`Could not delete test user ${id}: ${error.message}`);
  }
  console.log(`Cleaned up ${createdUserIds.length} temporary test users.`);
}

console.log(failures === 0 ? "\nAll security checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
