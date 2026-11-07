export type SupabasePublicEnvironment = {
  url: string;
  publishableKey: string;
};

export function getSupabasePublicEnvironment(): SupabasePublicEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `Supabase is not configured. Set ${missing.join(" and ")} in .env.local.`,
    );
  }

  try {
    const parsedUrl = new URL(url!);
    if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
      throw new Error("Supabase URL must use HTTPS outside localhost.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase URL")) {
      throw error;
    }
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  if (!/^(sb_publishable_|eyJ)/.test(publishableKey!)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key or legacy anon key.",
    );
  }

  return { url: url!, publishableKey: publishableKey! };
}

export function isSupabaseConfigured() {
  try {
    getSupabasePublicEnvironment();
    return true;
  } catch {
    return false;
  }
}
