"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  Users,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface EmployeeItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New employee form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Success credentials popup
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/admin/employees");
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch employees");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in name, email, and password");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await api.post("/admin/employees", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || undefined
      });

      if (data.success) {
        toast.success(data.message || "Employee account created and credentials emailed!");
        setCreatedCredentials({
          name: name.trim(),
          email: email.trim(),
          password: password.trim()
        });
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setIsModalOpen(false);
        fetchEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create employee account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string, empName: string) => {
    if (!window.confirm(`Are you sure you want to delete staff account for "${empName}"? They will lose access immediately.`)) {
      return;
    }
    try {
      const { data } = await api.delete(`/admin/employees/${id}`);
      if (data.success) {
        toast.success(data.message || "Employee account deleted");
        fetchEmployees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete employee");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
            Team &amp; Personnel
          </span>
          <h1 className="text-3xl md:text-4xl font-headline italic text-white">Employee Accounts</h1>
          <p className="text-xs text-white/60">
            Create employee accounts with email &amp; password. Credentials are automatically emailed and grant access to verify promoter requests.
          </p>
        </div>

        <button
          onClick={() => {
            generateRandomPassword();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] hover:brightness-110 text-black px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-black" />
          <span>+ Create Employee Account</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Total Staff Members</span>
          <div className="text-2xl font-bold text-white">{employees.length}</div>
          <p className="text-[11px] text-white/40">Active concierge &amp; operations team</p>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Access Permissions</span>
          <div className="text-lg font-bold text-[#E8CB8A]">Promoter Verification &amp; Check-In</div>
          <p className="text-[11px] text-white/40">Authorized to review partner applications</p>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Automated Notification</span>
          <div className="text-lg font-bold text-emerald-400">Email Delivery Ready</div>
          <p className="text-[11px] text-white/40">Credentials dispatched instantly on creation</p>
        </div>
      </div>

      {/* Created Credentials Banner Modal */}
      {createdCredentials && (
        <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-3 animate-fade-in relative">
          <button
            onClick={() => setCreatedCredentials(null)}
            className="absolute top-4 right-4 text-white/40 hover:text-white text-sm"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Account Created &amp; Email Sent Successfully</span>
          </div>
          <p className="text-xs text-white/70">
            Login details have been dispatched to <strong>{createdCredentials.email}</strong>. You can also copy them directly:
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="bg-black/50 border border-white/10 px-3.5 py-1.5 rounded-lg text-xs font-mono text-[#E8CB8A]">
              Email: <strong>{createdCredentials.email}</strong> &bull; Password: <strong>{createdCredentials.password}</strong>
            </div>
            <button
              onClick={() =>
                copyToClipboard(
                  `Tropica Staff Login\nPortal: ${window.location.origin}/employee-login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C8A96A] text-black rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#d8b97a] transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Details"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-white/50 text-xs">Loading employee team...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-white/30 mx-auto" />
            <h3 className="font-bold text-white text-sm">No Employee Accounts Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Create employee accounts to grant staff access to verify promoter applications and perform door check-ins.
            </p>
            <button
              onClick={() => {
                generateRandomPassword();
                setIsModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#C8A96A] text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#d8b97a] transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add First Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Staff Member</th>
                  <th className="p-4">Login Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role &amp; Permissions</th>
                  <th className="p-4">Created On</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6 font-bold text-white text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#C8A96A]/20 text-[#C8A96A] flex items-center justify-center text-xs font-bold uppercase">
                          {emp.name.charAt(0)}
                        </div>
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white/80 font-mono text-xs">{emp.email}</td>
                    <td className="p-4 text-white/60">{emp.phone || "—"}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <ShieldCheck className="w-3 h-3" /> Staff / Verifier
                      </span>
                    </td>
                    <td className="p-4 text-white/40">{new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-xs transition-all inline-flex items-center justify-center cursor-pointer"
                        title="Delete Employee Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0e1612] border border-[#C8A96A]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C8A96A] block">
                  New Staff Onboarding
                </span>
                <h3 className="font-headline text-2xl text-white font-bold">Create Employee Account</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8A96A] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                  Email Address (Login Username) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@tropica.nyc"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8A96A] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-[#C8A96A] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-3 bg-black/40 border border-white/15 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-[#C8A96A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8A96A] transition-all"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Upon account creation, an email containing their username, password, and login link will be automatically sent to the employee.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#C8A96A] to-[#E8CB8A] text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-[#C8A96A]/20 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Account & Email Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

