"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronDown, LogOut } from "lucide-react";

export function AdminUserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      window.location.replace("/");
    } catch {
      setSigningOut(false);
    }
  };
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Admin";
  const role = user?.publicMetadata?.role ? String(user.publicMetadata.role) : "Administrator";

  return (
    <div className="admin-profile-wrap">
      <button className="admin-profile" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="Open account menu">
        <span className="admin-avatar">{user?.imageUrl ? <img src={user.imageUrl} alt=""/> : name.slice(0, 2).toUpperCase()}</span>
        <div><b title={name}>{name}</b><small>{role}</small></div>
        <ChevronDown size={14}/>
      </button>
      {open && <div className="admin-account-menu"><button onClick={logout} disabled={signingOut}><LogOut size={14}/>{signingOut ? "Signing out..." : "Sign out"}</button></div>}
    </div>
  );
}
