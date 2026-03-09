import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { value: "Restaurant", label: "Restaurant" },
  { value: "Activity", label: "Activity" },
  { value: "Service", label: "Services" },
  { value: "Hotel", label: "Hotel" },
  { value: "Transport", label: "Transport" },
];

const verificationMethods = [
  { id: "document", label: "Official document", icon: FileText },
  { id: "social", label: "Social media", icon: LinkIcon },
  { id: "email", label: "Business email", icon: Mail },
];

const partnershipPoints = [
  {
    title: "Fast onboarding",
    text: "Choose a clean path for a new listing or an ownership claim.",
    icon: Sparkles,
  },
  {
    title: "Smart verification",
    text: "Blend AI review and proof-based checks to reduce friction and errors.",
    icon: ShieldCheck,
  },
  {
    title: "Ready to activate",
    text: "Once approved, your business is ready to appear and operate inside Kosmoi.",
    icon: Building2,
  },
];

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const sectionTitleClass =
  "text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase";

function ModeButton({ active, icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${
        active
          ? "bg-white text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </button>
  );
}

export default function VendorSignup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("create");
  const [formData, setFormData] = useState({
    business_name: "",
    category: "Restaurant",
    description: "",
    location: "",
    contact_info: "",
    owner_name: "",
    email: "",
  });
  const [claimSearch, setClaimSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState("document");
  const [claimerName, setClaimerName] = useState("");
  const [claimerContact, setClaimerContact] = useState("");
  const [verificationProof, setVerificationProof] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] =
    useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/complete-signup`,
          data: {
            business_name: formData.business_name,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            owner_name: formData.owner_name,
            contact_info: formData.contact_info || formData.email,
            signup_step: "pending_password",
          },
        },
      });

      if (error) throw error;

      setIsWaitingForVerification(true);
      setSuccess(true);
    } catch (error) {
      console.error("Signup failed:", error);
      alert(`Failed to submit application: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = claimSearch.trim();
    setHasSearched(true);
    setSelectedBusiness(null);

    if (!query) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, business_name, location, category")
        .ilike("business_name", `%${query}%`)
        .limit(6);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Claim search failed:", error);
      alert("Business search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async () => {
    if (!selectedBusiness || !claimerName || !claimerContact) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("business_claims").insert({
        business_id: selectedBusiness.id,
        claimer_name: claimerName,
        claimer_contact: claimerContact,
        verification_method: verificationMethod,
        verification_proof: verificationProof,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      console.error("Claim request failed:", error);
      alert("Claim request failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-xl items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-[0_20px_45px_rgba(37,99,235,0.25)]">
              <BadgeCheck className="h-10 w-10" />
            </div>
            <div className={sectionTitleClass}>Kosmoi onboarding</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {isWaitingForVerification
                ? "You're in."
                : mode === "create"
                  ? "Application received."
                  : "Ownership request sent."}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-8 text-slate-600">
              {isWaitingForVerification
                ? "We sent you a verification email. Open the link to finish account setup and launch your business."
                : mode === "create"
                  ? "One of our AI agents will review your business details and prepare the listing."
                  : "We will verify ownership using the contact details and proof you provided."}
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-8 h-12 w-full rounded-2xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-800"
            >
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:px-8">
        <section className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-[0_10px_25px_rgba(37,99,235,0.08)] backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Business onboarding
          </div>

          <div className="space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-600 to-sky-500 text-3xl font-black text-white shadow-[0_24px_50px_rgba(37,99,235,0.24)]">
              K
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-none tracking-tight text-slate-950 sm:text-5xl">
              Partner with Kosmoi
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Join the operating system that connects businesses, guests, and AI
              agents. Start a new listing or claim ownership of an existing one.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {partnershipPoints.map(({ title, text, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <ScanSearch className="h-5 w-5 text-sky-300" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-sky-300 uppercase">
                  Two paths
                </div>
                <div className="mt-1 text-xl font-bold">Pick the right path</div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                `Register new business` if your listing does not exist yet.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                `Claim existing business` if the listing already exists and needs to be assigned to you.
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/92 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

          <div className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className={sectionTitleClass}>Start here</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {mode === "create"
                    ? "Register your business"
                    : "Find your listing and verify ownership"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  {mode === "create"
                    ? "Enter your business details and we will send a verification link to complete setup."
                    : "Search the directory, choose the matching listing, and continue to ownership verification."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <BadgeCheck className="h-4 w-4" />
                {mode === "create" ? "OTP onboarding" : "Ownership verification"}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] bg-slate-100/90 p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeButton
                  active={mode === "create"}
                  icon={Store}
                  title="Register new business"
                  subtitle="Launch a new business inside Kosmoi"
                  onClick={() => setMode("create")}
                />
                <ModeButton
                  active={mode === "claim"}
                  icon={BadgeCheck}
                  title="Claim existing business"
                  subtitle="Verify and attach a business already in the system"
                  onClick={() => setMode("claim")}
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {mode === "create" ? (
              <form onSubmit={handleCreateSubmit} className="space-y-7">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                      Business name
                    </span>
                    <input
                      type="text"
                      name="business_name"
                      required
                      className={fieldClass}
                      placeholder="Example: Morning Tide Cafe"
                      value={formData.business_name}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                      Category
                    </span>
                    <div className="relative">
                      <select
                        name="category"
                        className={`${fieldClass} appearance-none pr-12`}
                        value={formData.category}
                        onChange={handleChange}
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                    Business description
                  </span>
                  <textarea
                    name="description"
                    required
                    rows={5}
                    className={`${fieldClass} resize-none`}
                    placeholder="Describe what makes your business stand out and who it serves."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </label>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                      Location
                    </span>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="location"
                        required
                        className={`${fieldClass} pl-12`}
                        placeholder="Address or service area"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                      Owner name
                    </span>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="owner_name"
                        className={`${fieldClass} pl-12`}
                        placeholder="Your full name"
                        value={formData.owner_name}
                        onChange={handleChange}
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                    Email
                  </span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      className={`${fieldClass} pl-12`}
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </label>

                <div className="rounded-[28px] border border-blue-100 bg-blue-50/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        What happens after you submit?
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-slate-600">
                        We will send a verification email, review the application,
                        and then move your business into the full setup flow.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-slate-950 text-base font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] hover:bg-slate-800"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Submit application"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-7">
                <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 p-5 shadow-[0_10px_30px_rgba(59,130,246,0.08)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Fast business lookup
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-slate-600">
                        Search our directory to find your business quickly and
                        shorten the ownership verification process.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="Search for your business..."
                    value={claimSearch}
                    onChange={(e) => setClaimSearch(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-14 rounded-2xl bg-slate-950 px-8 text-base font-semibold text-white hover:bg-slate-800"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {hasSearched &&
                  !loading &&
                  searchResults.length === 0 &&
                  !selectedBusiness && (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
                      No matching business found. You can switch back to `Register new business`.
                    </div>
                  )}

                {searchResults.length > 0 && !selectedBusiness && (
                  <div className="space-y-3">
                    {searchResults.map((biz) => (
                      <button
                        key={biz.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-[0_10px_25px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_35px_rgba(37,99,235,0.08)]"
                        onClick={() => setSelectedBusiness(biz)}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-slate-900">
                            {biz.business_name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {biz.category} • {biz.location}
                          </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedBusiness && (
                  <div className="space-y-6 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-col gap-4 rounded-[24px] border border-white bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-left">
                        <div className={sectionTitleClass}>Selected business</div>
                        <div className="mt-2 text-xl font-bold text-slate-950">
                          {selectedBusiness.business_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {selectedBusiness.category} • {selectedBusiness.location}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBusiness(null)}
                        className="self-start rounded-xl text-slate-500 hover:text-red-500"
                      >
                        Clear selection
                      </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                          Contact phone
                        </span>
                        <input
                          type="text"
                          placeholder="Primary contact number"
                          className={fieldClass}
                          value={claimerContact}
                          onChange={(e) => setClaimerContact(e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2.5 block text-sm font-semibold text-slate-700">
                          Full name
                        </span>
                        <input
                          type="text"
                          placeholder="Your full name"
                          className={fieldClass}
                          value={claimerName}
                          onChange={(e) => setClaimerName(e.target.value)}
                        />
                      </label>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-semibold text-slate-700">
                        Verification method
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {verificationMethods.map((method) => {
                          const Icon = method.icon;
                          const isActive = verificationMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setVerificationMethod(method.id)}
                              className={`rounded-[24px] border p-4 text-center transition ${
                                isActive
                                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <Icon className="mx-auto h-6 w-6" />
                              <div className="mt-3 text-sm font-semibold">
                                {method.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      {verificationMethod === "document" && (
                        <div className="space-y-4 text-center">
                          <p className="text-sm leading-7 text-slate-500">
                            Upload a business license, utility bill, or another
                            document that proves ownership.
                          </p>
                          <div className="relative rounded-[24px] border-2 border-dashed border-slate-300 px-6 py-10 transition hover:border-blue-300 hover:bg-blue-50/30">
                            <Upload className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                            <div className="text-sm font-medium text-slate-600">
                              Click to upload a file
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              PDF, PNG, or JPG
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              id="file-upload"
                              onChange={(e) =>
                                setVerificationProof(e.target.files[0]?.name || "")
                              }
                            />
                            <label
                              htmlFor="file-upload"
                              className="absolute inset-0 cursor-pointer"
                            />
                          </div>
                          {verificationProof && (
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              {verificationProof}
                            </div>
                          )}
                        </div>
                      )}

                      {verificationMethod === "social" && (
                        <div className="space-y-3">
                          <p className="text-sm leading-7 text-slate-500">
                            Paste a link to a business profile where you are listed
                            as an owner or admin.
                          </p>
                          <input
                            type="url"
                            placeholder="https://facebook.com/..."
                            className={fieldClass}
                            value={verificationProof}
                            onChange={(e) => setVerificationProof(e.target.value)}
                          />
                        </div>
                      )}

                      {verificationMethod === "email" && (
                        <div className="space-y-3">
                          <p className="text-sm leading-7 text-slate-500">
                            We will send a verification code to your business email
                            address.
                          </p>
                          <input
                            type="email"
                            placeholder="your@business-domain.com"
                            className={fieldClass}
                            value={verificationProof}
                            onChange={(e) => setVerificationProof(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleClaimSubmit}
                      className="h-14 w-full rounded-2xl bg-emerald-600 text-base font-semibold text-white shadow-[0_18px_40px_rgba(5,150,105,0.2)] hover:bg-emerald-700"
                      disabled={loading || !claimerName || !claimerContact}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending request...
                        </span>
                      ) : (
                        "Submit ownership request"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
