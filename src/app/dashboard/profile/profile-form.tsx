"use client";

import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Camera, KeyRound, Loader2, UserRound } from "lucide-react";
import { updatePassword, updateProfile } from "@/profile/actions";

type ActionState = { ok: boolean; error?: string } | null;

export function ProfileForm({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string;
}) {
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const [profileState, profileAction, profilePending] = useActionState(
    async (_previous: ActionState, formData: FormData) => updateProfile(formData),
    null,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    async (_previous: ActionState, formData: FormData) => updatePassword(formData),
    null,
  );

  useEffect(() => {
    if (profileState?.ok) toast.success("Profile updated");
    if (profileState?.ok === false && profileState.error) toast.error(profileState.error);
  }, [profileState]);

  useEffect(() => {
    if (passwordState?.ok) {
      toast.success("Password updated");
      passwordFormRef.current?.reset();
    }
    if (passwordState?.ok === false && passwordState.error) toast.error(passwordState.error);
  }, [passwordState]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <form action={profileAction} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile details</h2>
            <p className="text-sm text-muted-foreground">Update your display name and dashboard avatar.</p>
          </div>
        </div>

        {profileState?.ok === false && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {profileState.error}
          </div>
        )}

        <div className="mt-6 grid gap-5">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-semibold">
              Name
            </label>
            <input
              id="profile-name"
              name="name"
              type="text"
              required
              minLength={2}
              defaultValue={name}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-primary/10"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-1.5 block text-sm font-semibold">
              Login email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="h-11 w-full rounded-xl border border-border bg-surface-muted px-3 text-sm text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Your email stays unchanged so your login credentials remain stable.</p>
          </div>

          <div>
            <label htmlFor="avatar" className="mb-1.5 block text-sm font-semibold">
              Profile picture
            </label>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:h-10 file:rounded-xl file:border file:border-border file:bg-surface file:px-4 file:text-sm file:font-semibold file:text-foreground hover:file:bg-surface-muted"
                />
                <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="removeAvatar" className="h-4 w-4 rounded border-border accent-primary" />
                  Remove current picture
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={profilePending}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {profilePending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
          {profilePending ? "Saving..." : "Save profile"}
        </button>
      </form>

      <form ref={passwordFormRef} action={passwordAction} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Password</h2>
            <p className="text-sm text-muted-foreground">Change your password after confirming the current one.</p>
          </div>
        </div>

        {passwordState?.ok === false && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {passwordState.error}
          </div>
        )}

        <div className="mt-6 grid gap-4">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-semibold">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" required className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-primary/10" />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold">New password</label>
            <input id="newPassword" name="newPassword" type="password" required minLength={8} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-primary/10" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold">Confirm new password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-primary/10" />
          </div>
        </div>

        <button
          type="submit"
          disabled={passwordPending}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {passwordPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
          {passwordPending ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
