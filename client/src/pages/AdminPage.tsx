import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Search,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardNavbar } from "@/components/admin/DashboardNavbar";
import { VerificationTable } from "@/components/admin/VerificationTable";
import { UserSearchBar } from "@/components/admin/UserSearchBar";
import { UserTable } from "@/components/admin/UserTable";
import { PaymentReceiptModal } from "@/components/admin/PaymentReceiptModal";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { useAdminDashboardStore } from "@/store/adminDashboardStore";
import type { AccountStatus, AdminManagedUser, PaymentVerification } from "@/types/api";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, status, logout, setUser } = useAuthStore();
  const {
    activeSection,
    pendingVerifications,
    pendingLoading,
    pendingError,
    users,
    usersLoading,
    usersError,
    userFilters,
    adminLookupResult,
    adminLookupLoading,
    adminLookupError,
    profileSaving,
    setActiveSection,
    setUserFilters,
    resetUserFilters,
    loadPendingVerifications,
    approveVerification,
    rejectVerification,
    loadUsers,
    saveUser,
    deleteUser,
    findAdminByEmail,
    clearAdminLookup,
    updateOwnAdminProfile,
  } = useAdminDashboardStore();

  const [receiptPreview, setReceiptPreview] = useState<PaymentVerification | null>(null);
  const [editingUser, setEditingUser] = useState<AdminManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminManagedUser | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<"approve" | "reject" | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [approveAmounts, setApproveAmounts] = useState<Record<string, string>>({});
  const [userSaveLoading, setUserSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    contact: user?.contact ?? "",
    institution: user?.institution ?? "",
  });

  useEffect(() => {
    if (status === "idle") {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (user && user.role !== "ADMIN") {
      navigate("/profile", { replace: true });
    }
  }, [navigate, status, user]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    void loadPendingVerifications();
    void loadUsers();
  }, [loadPendingVerifications, loadUsers, user]);

  useEffect(() => {
    if (activeSection !== "overview" && activeSection !== "verifications") return;

    const intervalId = window.setInterval(() => {
      void loadPendingVerifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [activeSection, loadPendingVerifications]);

  useEffect(() => {
    setProfileForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      contact: user?.contact ?? "",
      institution: user?.institution ?? "",
    });
  }, [user]);

  const stats = useMemo(() => {
    const verifiedUsers = users.filter((entry) => entry.status === "VERIFIED").length;
    const pendingUsers = users.filter((entry) => entry.status === "PENDING").length;
    const rejectedUsers = users.filter((entry) => entry.status === "REJECTED").length;

    return {
      totalUsers: users.length,
      pendingVerifications: pendingVerifications.length,
      verifiedUsers,
      pendingUsers,
      rejectedUsers,
    };
  }, [pendingVerifications.length, users]);

  async function handleApprove(item: PaymentVerification) {
    try {
      setActionLoadingId(item.id);
      setActionMode("approve");
      const rawValue = approveAmounts[item.id]?.trim();
      await approveVerification(item.id, rawValue ? Number(rawValue) : undefined);
    } finally {
      setActionLoadingId(null);
      setActionMode(null);
    }
  }

  async function handleReject(item: PaymentVerification) {
    try {
      setActionLoadingId(item.id);
      setActionMode("reject");
      await rejectVerification(item.id, rejectReasons[item.id]?.trim() || undefined);
    } finally {
      setActionLoadingId(null);
      setActionMode(null);
    }
  }

  async function handleSaveUser(
    payload: Pick<AdminManagedUser, "name" | "email" | "contact" | "institution" | "status">,
  ) {
    if (!editingUser) return;

    try {
      setUserSaveLoading(true);
      await saveUser(editingUser.id, payload);
      setEditingUser(null);
    } finally {
      setUserSaveLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;

    try {
      setDeleteLoading(true);
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleAdminLookup() {
    if (!lookupEmail.trim()) return;
    await findAdminByEmail(lookupEmail.trim().toLowerCase());
  }

  async function openUsersByStatus(nextStatus: AccountStatus | "") {
    setActiveSection("users");
    setUserFilters({ status: nextStatus });
    window.setTimeout(() => {
      void loadUsers();
    }, 0);
  }

  async function handleSaveOwnProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsMessage(null);
    setSettingsError(null);

    try {
      const updated = await updateOwnAdminProfile(profileForm);
      setUser(updated);
      setSettingsMessage("Admin profile updated successfully.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Failed to update profile.");
    }
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#07060c] text-white">
      <InteractiveBackground />

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 py-5 lg:px-6">
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <AdminSidebar activeSection={activeSection} onChange={setActiveSection} />

          <div className="space-y-5">
            <DashboardNavbar admin={user} onLogout={logout} />

            <motion.section
              key={activeSection}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {activeSection === "overview" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      title="Pending Verifications"
                      value={stats.pendingVerifications}
                      icon={<Shield className="h-5 w-5" />}
                      tint="cyan"
                      onClick={() => setActiveSection("verifications")}
                    />
                    <StatCard
                      title="Total Users"
                      value={stats.totalUsers}
                      icon={<Users className="h-5 w-5" />}
                      tint="slate"
                      onClick={() => void openUsersByStatus("")}
                    />
                    <StatCard
                      title="Verified Users"
                      value={stats.verifiedUsers}
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      tint="green"
                      onClick={() => void openUsersByStatus("VERIFIED")}
                    />
                    <StatCard
                      title="Rejected Users"
                      value={stats.rejectedUsers}
                      icon={<XCircle className="h-5 w-5" />}
                      tint="red"
                      onClick={() => void openUsersByStatus("REJECTED")}
                    />
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                      <CardHeader>
                        <CardTitle>Recent verification queue</CardTitle>
                        <CardDescription>
                          The latest payment submissions waiting for review.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pendingVerifications.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="font-medium text-white">{item.user?.name}</p>
                              <p className="mt-1 text-sm text-slate-400">{item.user?.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                                onClick={() => setReceiptPreview(item)}
                              >
                                Preview
                              </Button>
                              <Button
                                className="bg-secondary text-slate-950 hover:bg-secondary/90"
                                onClick={() => setActiveSection("verifications")}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        ))}
                        {pendingVerifications.length === 0 ? (
                          <EmptyPanel
                            title="Verification queue is clear"
                            description="No payment receipts are waiting right now."
                          />
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                      <CardHeader>
                        <CardTitle>Quick actions</CardTitle>
                        <CardDescription>
                          Jump straight to the admin workflows you use most.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <QuickAction
                          title="Review payment receipts"
                          description="Approve or reject pending verification requests."
                          onClick={() => setActiveSection("verifications")}
                        />
                        <QuickAction
                          title="Search and edit users"
                          description="Find users by UUID, email, contact, name, or institution."
                          onClick={() => setActiveSection("users")}
                        />
                        <QuickAction
                          title="Open admin settings"
                          description="Update your own admin profile details."
                          onClick={() => setActiveSection("settings")}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : null}

              {activeSection === "verifications" ? (
                <div className="space-y-4">
                  <SectionHeader
                    title="Pending Verifications"
                    description="Review uploaded payment receipts and update user verification status."
                    action={
                      <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => void loadPendingVerifications()}
                      >
                        Refresh
                      </Button>
                    }
                  />

                  {pendingError ? (
                    <InlineError message={pendingError} />
                  ) : null}

                  <VerificationTable
                    items={pendingVerifications}
                    loading={pendingLoading}
                    actionLoadingId={actionLoadingId}
                    actionMode={actionMode}
                    rejectReasons={rejectReasons}
                    approveAmounts={approveAmounts}
                    onPreview={setReceiptPreview}
                    onRejectReasonChange={(id, value) =>
                      setRejectReasons((current) => ({ ...current, [id]: value }))
                    }
                    onApproveAmountChange={(id, value) =>
                      setApproveAmounts((current) => ({ ...current, [id]: value }))
                    }
                    onApprove={(item) => void handleApprove(item)}
                    onReject={(item) => void handleReject(item)}
                  />
                </div>
              ) : null}

              {activeSection === "users" ? (
                <div className="space-y-4">
                  <SectionHeader
                    title="User Management"
                    description="Search, review, edit, and delete user accounts."
                  />

                  <UserSearchBar
                    filters={userFilters}
                    loading={usersLoading}
                    onChange={setUserFilters}
                    onSearch={() => void loadUsers()}
                    onReset={() => {
                      resetUserFilters();
                      window.setTimeout(() => {
                        void loadUsers();
                      }, 0);
                    }}
                  />

                  <div className="flex flex-wrap gap-2">
                    <QuickFilterButton
                      active={!userFilters.status}
                      label="All users"
                      onClick={() => void openUsersByStatus("")}
                    />
                    <QuickFilterButton
                      active={userFilters.status === "PENDING"}
                      label="Pending users"
                      onClick={() => void openUsersByStatus("PENDING")}
                    />
                    <QuickFilterButton
                      active={userFilters.status === "VERIFIED"}
                      label="Verified users"
                      onClick={() => void openUsersByStatus("VERIFIED")}
                    />
                    <QuickFilterButton
                      active={userFilters.status === "REJECTED"}
                      label="Rejected users"
                      onClick={() => void openUsersByStatus("REJECTED")}
                    />
                  </div>

                  {usersError ? <InlineError message={usersError} /> : null}

                  <UserTable
                    users={users}
                    loading={usersLoading}
                    onEdit={setEditingUser}
                    onDelete={setDeletingUser}
                  />
                </div>
              ) : null}

              {activeSection === "admin" ? (
                <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                  <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                    <CardHeader>
                      <CardTitle>Admin account lookup</CardTitle>
                      <CardDescription>
                        Fetch admin information by allowlisted email.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <Input
                          value={lookupEmail}
                          onChange={(event) => setLookupEmail(event.target.value)}
                          placeholder="admin@example.com"
                          className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                        />
                        <Button
                          className="h-11 bg-secondary text-slate-950 hover:bg-secondary/90"
                          onClick={() => void handleAdminLookup()}
                          disabled={adminLookupLoading}
                        >
                          <Search className="h-4 w-4" />
                          Search
                        </Button>
                      </div>

                      {adminLookupError ? <InlineError message={adminLookupError} /> : null}

                      {adminLookupResult ? (
                        <div className="rounded-md border border-white/10 bg-white/5 p-4">
                          <p className="text-lg font-semibold text-white">
                            {adminLookupResult.name}
                          </p>
                          <div className="mt-3 grid gap-2 text-sm text-slate-300">
                            <p><span className="text-slate-500">Email:</span> {adminLookupResult.email}</p>
                            <p><span className="text-slate-500">Institution:</span> {adminLookupResult.institution}</p>
                            <p><span className="text-slate-500">Contact:</span> {adminLookupResult.contact || "--"}</p>
                            <p><span className="text-slate-500">Role:</span> {adminLookupResult.role}</p>
                          </div>
                          <Button
                            variant="outline"
                            className="mt-4 border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={clearAdminLookup}
                          >
                            Clear result
                          </Button>
                        </div>
                      ) : (
                        <EmptyPanel
                          title="Lookup an admin by email"
                          description="Only admin accounts are shown here. Other admins remain non-editable from this dashboard."
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                    <CardHeader>
                      <CardTitle>Admin permissions</CardTitle>
                      <CardDescription>
                        Guardrails enforced by the API and reflected in the UI.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-300">
                      <PermissionRow text="Admins authenticate through dedicated /admin routes." />
                      <PermissionRow text="Admins can review and act on pending payment verifications." />
                      <PermissionRow text="Admins can search and edit normal user accounts only." />
                      <PermissionRow text="Admins cannot edit or delete other admin accounts." />
                      <PermissionRow text="Admins can update only their own profile from settings." />
                      <PermissionRow text="User deletions archive the deleted email in deletedUsers." />
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {activeSection === "settings" ? (
                <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                  <CardHeader>
                    <CardTitle>Settings / Profile</CardTitle>
                    <CardDescription>
                      Update your own admin account. Other admins remain read-only.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveOwnProfile}>
                      <SettingsField
                        label="Name"
                        value={profileForm.name}
                        onChange={(value) =>
                          setProfileForm((current) => ({ ...current, name: value }))
                        }
                      />
                      <SettingsField
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={(value) =>
                          setProfileForm((current) => ({ ...current, email: value }))
                        }
                      />
                      <SettingsField
                        label="Contact"
                        value={profileForm.contact}
                        onChange={(value) =>
                          setProfileForm((current) => ({ ...current, contact: value }))
                        }
                      />
                      <SettingsField
                        label="Institution"
                        value={profileForm.institution}
                        onChange={(value) =>
                          setProfileForm((current) => ({ ...current, institution: value }))
                        }
                      />

                      {settingsMessage ? (
                        <div className="md:col-span-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                          {settingsMessage}
                        </div>
                      ) : null}
                      {settingsError ? (
                        <div className="md:col-span-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                          {settingsError}
                        </div>
                      ) : null}

                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          type="submit"
                          className="bg-secondary text-slate-950 hover:bg-secondary/90"
                          disabled={profileSaving}
                        >
                          {profileSaving ? "Saving..." : "Save profile"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : null}
            </motion.section>
          </div>
        </div>
      </main>

      <PaymentReceiptModal
        open={Boolean(receiptPreview)}
        receiptUrl={receiptPreview?.paymentSlipUrl}
        userName={receiptPreview?.user?.name}
        onClose={() => setReceiptPreview(null)}
      />

      <UserDetailsModal
        open={Boolean(editingUser)}
        user={editingUser}
        loading={userSaveLoading}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />

      <DeleteConfirmationModal
        open={Boolean(deletingUser)}
        title="Delete user account"
        description={
          deletingUser
            ? `Delete ${deletingUser.name} permanently? Their email will be archived in deletedUsers on the current admin record.`
            : ""
        }
        loading={deleteLoading}
        onCancel={() => setDeletingUser(null)}
        onConfirm={() => void handleDeleteUser()}
      />
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tint,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tint: "cyan" | "slate" | "green" | "red";
  onClick?: () => void;
}) {
  const tintClass =
    tint === "cyan"
      ? "border-secondary/25 bg-secondary/10 text-secondary"
      : tint === "green"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
        : tint === "red"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
          : "border-white/10 bg-white/5 text-slate-300";

  return (
    <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
      <CardContent className="p-5">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center justify-between text-left"
          disabled={!onClick}
        >
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
          </div>
          <span className={`flex h-12 w-12 items-center justify-center rounded-md border ${tintClass}`}>
            {icon}
          </span>
        </button>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
    >
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
    </button>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-md border border-dashed border-white/10 bg-white/5 p-4 text-center">
      <div>
        <p className="text-base font-medium text-white">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {message}
    </div>
  );
}

function PermissionRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3">
      <Clock3 className="mt-0.5 h-4 w-4 text-secondary" />
      <p>{text}</p>
    </div>
  );
}

function SettingsField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
      />
    </div>
  );
}

function QuickFilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={
        active
          ? "border-secondary/40 bg-secondary/10 text-secondary hover:bg-secondary/15"
          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
      }
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
