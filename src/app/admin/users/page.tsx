"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  Trash2,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useAlert } from "@/components/ui/AlertProvider";
import { SkeletonUserRow } from "@/components/ui/Skeleton";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  targetExam?: string;
  state?: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const { data: session } = useSession();
  const { confirm, toast } = useAlert();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : "/api/admin/users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Error fetching users list:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(user: UserItem) {
    const newRole = user.role === "admin" ? "user" : "admin";
    const ok = await confirm({
      title: "Change User Role?",
      message: `Are you sure you want to change ${user.name}'s role to "${newRole.toUpperCase()}"?`,
      confirmLabel: "Change Role",
      cancelLabel: "Cancel",
      type: newRole === "admin" ? "warning" : "danger",
    });
    if (!ok) return;

    try {
      setUpdatingId(user._id);
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
      toast("success", `Role of "${user.name}" changed to ${newRole.toUpperCase()}.`, "Role Updated");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error updating role", "Failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteUser(user: UserItem) {
    const ok = await confirm({
      title: "Delete User Permanently?",
      message: `Warning: This will delete the user account "${user.name}" and ALL their practice attempts. This action is irreversible.`,
      confirmLabel: "Delete Account",
      cancelLabel: "Cancel",
      type: "danger",
    });
    if (!ok) return;

    try {
      setUpdatingId(user._id);
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast("success", `User "${user.name}" has been deleted.`, "User Deleted");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Error deleting user", "Failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-[#1A56DB]" /> User Management
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Search, assign administrative privileges, or delete student profiles and attempt histories.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["User Details", "Role", "Target Exam", "Region", "Joined", "Actions"].map((h) => (
                    <th key={h} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonUserRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-800">No Users Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or check back later.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    User Details
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Role Privilege
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Target Exam
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Region/State
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Joined Date
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isSelf = session?.user?.email === user.email;
                  const isUpdating = updatingId === user._id;

                  return (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isUpdating ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-4 truncate max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                            <User className="h-4.5 w-4.5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {user.role === "admin" ? (
                          <button
                            disabled={isSelf || isUpdating}
                            onClick={() => handleToggleRole(user)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-700 px-2.5 py-1 text-[10px] font-black uppercase transition disabled:opacity-50"
                          >
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </button>
                        ) : (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleToggleRole(user)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/50 text-blue-700 px-2.5 py-1 text-[10px] font-black uppercase transition"
                          >
                            User
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-700">
                        {user.targetExam ? (
                          <span className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-[#1A56DB]" />
                            {user.targetExam}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Not set</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-700">
                        {user.state ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {user.state}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Not set</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-300" />
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={isSelf || isUpdating}
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
                          title={isSelf ? "You cannot delete yourself" : `Delete ${user.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
