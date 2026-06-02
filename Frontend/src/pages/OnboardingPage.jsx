import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { completeOnboarding } from "../features/auth/authSlice";

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const OnboardingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const details = user?.additionalDetails || {};
  const faculty = user?.facultyProfile || {};
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    about: "",
    contactNumber: "",
    department: "",
    graduationYear: "",
    skills: "",
    interests: "",
    insta: "",
    linkedin: "",
    employeeId: "",
    designation: "",
    officeLocation: "",
    bio: "",
    researchAreas: "",
    website: "",
  });

  useEffect(() => {
    if (user && !user.mustChangePassword && !user.profileCompletionRequired) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!user) return;
    setFormData((current) => ({
      ...current,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      about: details.about || "",
      contactNumber: details.contactNumber || "",
      department: details.department || faculty.department || "",
      graduationYear: details.graduationYear || "",
      skills: (details.skills || []).join(", "),
      interests: (details.interests || []).join(", "),
      insta: details.insta || "",
      linkedin: details.linkedin || "",
      employeeId: faculty.employeeId || "",
      designation: faculty.designation || "",
      officeLocation: faculty.officeLocation || "",
      bio: faculty.bio || "",
      researchAreas: (faculty.researchAreas || []).join(", "),
      website: faculty.website || "",
    }));
  }, [details.about, details.contactNumber, details.department, details.graduationYear, details.insta, details.interests, details.linkedin, details.skills, faculty.bio, faculty.department, faculty.designation, faculty.employeeId, faculty.officeLocation, faculty.researchAreas, faculty.website, user]);

  const passwordMismatch = useMemo(
    () => formData.confirmPassword && formData.newPassword !== formData.confirmPassword,
    [formData.confirmPassword, formData.newPassword]
  );

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (passwordMismatch || formData.newPassword.length < 8) return;

    try {
      setIsSubmitting(true);
      await dispatch(
        completeOnboarding({
          ...formData,
          skills: splitList(formData.skills),
          interests: splitList(formData.interests),
          researchAreas: splitList(formData.researchAreas),
          visibility: "public",
        })
      ).unwrap();
      navigate("/dashboard", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <p className="text-sm font-black uppercase tracking-wide text-blue-600">First login setup</p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">Secure your account and complete your profile</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500">
            Your admin created this account. Change the temporary password and add the profile details used by courses, discovery, chat, and department groups.
          </p>
        </section>

        <form className="grid gap-5 lg:grid-cols-[1fr_22rem]" onSubmit={handleSubmit}>
          <main className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Password</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Temporary password</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" type="password" value={formData.currentPassword} onChange={(event) => updateField("currentPassword", event.target.value)} required />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">New password</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" type="password" value={formData.newPassword} onChange={(event) => updateField("newPassword", event.target.value)} minLength={8} required />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Confirm password</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" type="password" value={formData.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} minLength={8} required />
                  {passwordMismatch && <span className="mt-1 block text-xs font-semibold text-red-600">Passwords do not match.</span>}
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Profile</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">First name</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.firstName} onChange={(event) => updateField("firstName", event.target.value)} required />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Last name</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.lastName} onChange={(event) => updateField("lastName", event.target.value)} required />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-bold text-gray-700">Bio</span>
                  <textarea className="textarea textarea-bordered mt-1 min-h-24 w-full rounded-xl" value={formData.about} onChange={(event) => updateField("about", event.target.value)} placeholder="A short intro for classmates and professors" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Department</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.department} onChange={(event) => updateField("department", event.target.value)} required />
                </label>
                {user?.role === "Student" && (
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Graduation year</span>
                    <input className="input input-bordered mt-1 w-full rounded-xl" type="number" value={formData.graduationYear} onChange={(event) => updateField("graduationYear", event.target.value)} min="2000" max="2100" />
                  </label>
                )}
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Contact number</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.contactNumber} onChange={(event) => updateField("contactNumber", event.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Skills</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.skills} onChange={(event) => updateField("skills", event.target.value)} placeholder="React, Python, Research" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">Interests</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.interests} onChange={(event) => updateField("interests", event.target.value)} placeholder="AI, Design, Hackathons" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-700">LinkedIn</span>
                  <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.linkedin} onChange={(event) => updateField("linkedin", event.target.value)} />
                </label>
              </div>
            </section>

            {user?.role === "Professor" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">Faculty profile</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Employee ID</span>
                    <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.employeeId} onChange={(event) => updateField("employeeId", event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Designation</span>
                    <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.designation} onChange={(event) => updateField("designation", event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Office location</span>
                    <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.officeLocation} onChange={(event) => updateField("officeLocation", event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-gray-700">Website</span>
                    <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.website} onChange={(event) => updateField("website", event.target.value)} />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-bold text-gray-700">Research areas</span>
                    <input className="input input-bordered mt-1 w-full rounded-xl" value={formData.researchAreas} onChange={(event) => updateField("researchAreas", event.target.value)} placeholder="AI, Networks, HCI" />
                  </label>
                </div>
              </section>
            )}
          </main>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 lg:sticky lg:top-24">
            <h2 className="text-xl font-black text-gray-900">Setup checklist</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="rounded-xl bg-blue-50 p-3 font-semibold text-blue-700">Use the temporary password your admin gave you.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-gray-600">Department unlocks student discovery, department groups, and course filtering.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-gray-600">You can edit your profile picture after setup from Edit Profile.</p>
            </div>
            <button className="btn btn-primary mt-5 w-full rounded-xl" type="submit" disabled={isSubmitting || passwordMismatch || formData.newPassword.length < 8}>
              {isSubmitting ? "Saving..." : "Complete setup"}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
