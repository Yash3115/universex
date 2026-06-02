import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import InteractionFormModal from "../components/InteractionFormModal";
import {
  clearSelectedStudentProfile,
  fetchStudentProfile,
  requestConnection,
  respondToConnection,
} from "../features/discovery/discoverySlice";
import { getImageUrl } from "../utils/imageUtils";

const InfoPill = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tones[tone] || tones.blue}`}>{children}</span>;
};

const StudentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [interactionType, setInteractionType] = useState(null);
  const { selectedStudentProfile, selectedStudentProfileError, selectedStudentProfileStatus, actionLoadingByStudentId } = useSelector((state) => state.discovery);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (id) dispatch(fetchStudentProfile(id));
    return () => dispatch(clearSelectedStudentProfile());
  }, [dispatch, id]);

  const student = selectedStudentProfile?.student;
  const details = student?.additionalDetails || {};
  const access = selectedStudentProfile?.viewerAccess || {};
  const connectionState = selectedStudentProfile?.connectionState || { status: "none", direction: "none" };
  const mutual = selectedStudentProfile?.mutualContext || {};
  const isLoadingAction = Boolean(actionLoadingByStudentId[id]);

  const connect = async () => {
    try {
      await dispatch(requestConnection(id)).unwrap();
      toast.success("Connection updated");
      dispatch(fetchStudentProfile(id));
    } catch (error) {
      toast.error(error || "Unable to send request");
    }
  };

  const respond = async (status) => {
    if (!connectionState.id) return;
    try {
      const result = await dispatch(respondToConnection({ connectionId: connectionState.id, status, studentId: id })).unwrap();
      toast.success(result.message || "Connection updated");
      dispatch(fetchStudentProfile(id));
    } catch (error) {
      toast.error(error || "Unable to update request");
    }
  };

  const renderConnectionAction = () => {
    if (access.isSelf) return <button className="btn rounded-2xl" onClick={() => navigate("/profile")}>Open my profile</button>;
    if (currentUser && currentUser.role !== "Student") return <button className="btn rounded-2xl" disabled>Student connections only</button>;
    if (connectionState.direction === "connected") return <button className="btn rounded-2xl bg-emerald-50 text-emerald-700" onClick={() => navigate("/connections")}>Connected · Manage</button>;
    if (connectionState.direction === "incoming" && connectionState.status === "pending") {
      return (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-primary rounded-2xl" disabled={isLoadingAction} onClick={() => respond("accepted")}>{isLoadingAction ? "Accepting..." : "Accept"}</button>
          <button className="btn rounded-2xl" disabled={isLoadingAction} onClick={() => respond("rejected")}>Ignore</button>
        </div>
      );
    }
    if (connectionState.direction === "outgoing") return <button className="btn rounded-2xl" disabled>Request sent</button>;
    return <button className="btn btn-primary rounded-2xl" disabled={isLoadingAction} onClick={connect}>{isLoadingAction ? "Sending..." : "Connect"}</button>;
  };

  if (selectedStudentProfileStatus === "loading") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8"><p className="rounded-3xl bg-white p-8 text-center font-semibold text-gray-500 shadow">Loading student profile...</p></div>;
  }

  if (selectedStudentProfileStatus === "failed") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8"><p className="rounded-3xl bg-red-50 p-8 text-center font-semibold text-red-600 shadow">{selectedStudentProfileError}</p></div>;
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-200/70">
          <button className="mb-5 text-sm font-bold text-blue-600 hover:underline" onClick={() => navigate(-1)}>← Back</button>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <img src={getImageUrl(student.image, "https://cdn-icons-png.flaticon.com/512/6596/6596121.png")} alt="Student profile" className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover shadow-lg" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Student profile</p>
                <h1 className="mt-1 text-3xl font-black text-gray-900 sm:text-4xl">{student.firstName} {student.lastName}</h1>
                <p className="mt-2 text-gray-500">{student.college}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {details.department && <InfoPill>{details.department}</InfoPill>}
                  {details.graduationYear && <InfoPill tone="purple">Batch {details.graduationYear}</InfoPill>}
                  {connectionState.direction === "connected" && <InfoPill tone="emerald">Connected</InfoPill>}
                </div>
              </div>
            </div>
            <div className="w-full md:w-64">{renderConnectionAction()}</div>
          </div>
        </section>

        {!access.canViewExtendedProfile && access.limitationReason && (
          <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-amber-800 shadow">
            <h2 className="font-black">Limited profile</h2>
            <p className="mt-2 text-sm">{access.limitationReason}</p>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <main className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">About</h2>
              <p className="mt-3 leading-7 text-gray-600">{details.about || "No public bio added yet."}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">Skills</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(details.skills || []).length > 0 ? details.skills.map((skill) => <InfoPill key={skill} tone="slate">{skill}</InfoPill>) : <p className="text-sm text-gray-500">Skills are hidden or not added.</p>}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">Interests</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(details.interests || []).length > 0 ? details.interests.map((interest) => <InfoPill key={interest} tone="purple">{interest}</InfoPill>) : <p className="text-sm text-gray-500">Interests are hidden or not added.</p>}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Contact access</h2>
              {access.canViewContact ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {student.email && <a className="rounded-2xl bg-blue-50 p-4 font-semibold text-blue-700" href={`mailto:${student.email}`}>{student.email}</a>}
                  {details.contactNumber && <p className="rounded-2xl bg-slate-50 p-4 font-semibold text-gray-700">{details.contactNumber}</p>}
                  {details.linkedin && <a className="rounded-2xl bg-blue-50 p-4 font-semibold text-blue-700" href={details.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                  {details.insta && <a className="rounded-2xl bg-pink-50 p-4 font-semibold text-pink-700" href={details.insta} target="_blank" rel="noreferrer">Instagram</a>}
                </div>
              ) : (
                <p className="mt-3 text-gray-500">Connect with this student to unlock contact and social links.</p>
              )}
            </div>
          </main>

          <aside className="space-y-6">
            {access.isConnected && (
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
                <h2 className="text-xl font-black text-gray-900">Start interaction</h2>
                <p className="mt-2 text-sm text-gray-500">Use your connection to study, collaborate, or ask for guidance.</p>
                <div className="mt-4 grid gap-2">
                  <button className="btn btn-primary rounded-2xl" onClick={() => setInteractionType("StudyInvite")}>Invite to study</button>
                  <button className="btn rounded-2xl" onClick={() => setInteractionType("ProjectInvite")}>Invite to project</button>
                  <button className="btn rounded-2xl" onClick={() => setInteractionType("HelpRequest")}>Ask for help</button>
                </div>
              </div>
            )}
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Mutual context</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className={`rounded-2xl p-3 font-semibold ${mutual.sameCollege ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>{mutual.sameCollege ? "Same college" : "Different college"}</p>
                <p className={`rounded-2xl p-3 font-semibold ${mutual.sameDepartment ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>{mutual.sameDepartment ? "Same department" : "Different department"}</p>
                <p className={`rounded-2xl p-3 font-semibold ${mutual.sameGraduationYear ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>{mutual.sameGraduationYear ? "Same batch" : "Different batch"}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-black text-gray-900">Shared interests</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...(mutual.sharedSkills || []), ...(mutual.sharedInterests || [])].length > 0
                  ? [...(mutual.sharedSkills || []), ...(mutual.sharedInterests || [])].map((item) => <InfoPill key={item} tone="emerald">{item}</InfoPill>)
                  : <p className="text-sm text-gray-500">No shared skills or interests found yet.</p>}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {interactionType && (
        <InteractionFormModal defaultType={interactionType} recipient={student} onClose={() => setInteractionType(null)} />
      )}
    </div>
  );
};

export default StudentProfilePage;
