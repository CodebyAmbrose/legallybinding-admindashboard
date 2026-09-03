"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function AdminProfileSync() {
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!user) return;
    const name = user.fullName || user.primaryEmailAddress?.emailAddress || "Admin";
    const role = user.publicMetadata?.role ? String(user.publicMetadata.role) : "Administrator";
    const update = () => {
      document.querySelectorAll<HTMLElement>(".admin-profile").forEach(profile => {
        if (!profile.textContent?.includes("Admin User")) return;
        profile.innerHTML = `<span class="admin-avatar">${user.imageUrl ? `<img src="${user.imageUrl}" alt="" />` : name.slice(0, 2).toUpperCase()}</span><div><b>${name}</b><small>${role}</small></div><span aria-hidden="true">⌄</span>`;
        profile.style.cursor = "pointer";
        profile.setAttribute("role", "button");
        profile.onclick = () => signOut({ redirectUrl: "/" });
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [signOut, user]);

  return null;
}
