import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

// This route creates a new user with email + password using the Supabase Admin API.
// Only sa_admin and me_admin can call this.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, role, shakha_id } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check caller's role
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json(
        { error: "No admin profile found" },
        { status: 403 }
      );
    }

    // Create the auth user (no email confirmation)
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip email verification
        user_metadata: { full_name: full_name || "" },
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // The trigger auto-creates the profile, but update role & shakha
    if (newUser.user) {
      await supabaseAdmin
        .from("profiles")
        .update({
          full_name: full_name || "",
          role: role || "admin",
          shakha_id: shakha_id || null,
        })
        .eq("id", newUser.user.id);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user?.id,
        email: newUser.user?.email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
