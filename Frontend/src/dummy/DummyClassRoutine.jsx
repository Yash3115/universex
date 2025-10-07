import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { toast } from "react-toastify";
import "react-calendar/dist/Calendar.css";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const dummyRoutine = [
  { day: "Monday", subjects: ["Math", "Physics"] },
  { day: "Tuesday", subjects: ["Chemistry", "English"] },
  { day: "Wednesday", subjects: ["Biology", "Computer Science"] },
  { day: "Thursday", subjects: ["History", "Math"] },
  { day: "Friday", subjects: ["Geography", "Physics"] },
  { day: "Saturday", subjects: ["Economics"] },
  { day: "Sunday", subjects: [] },
];

const attendanceOptions = ["Attended", "Left", "Canceled"];
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ClassRoutine = () => {
  const [date, setDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [submittedAttendance, setSubmittedAttendance] = useState({});
  const [subjectAttendance, setSubjectAttendance] = useState({});
  const navigate = useNavigate();

  const selectedDay = daysOfWeek[date.getDay() - 1] || "Monday";
  const subjectsForSelectedDay = dummyRoutine.find((d) => d.day === selectedDay)?.subjects || [];

  const handleAttendance = (subject, status) => {
    setAttendance((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [subject]: status },
    }));
  };

  const handleSubmitAttendance = () => {
    setSubmittedAttendance((prev) => ({
      ...prev,
      ...attendance,
    }));

    let subjectStats = {};
    Object.values(attendance).forEach((day) => {
      Object.entries(day).forEach(([subject, status]) => {
        if (!subjectStats[subject]) {
          subjectStats[subject] = { attended: 0, total: 0 };
        }
        if (status !== "Canceled") {
          subjectStats[subject].total++;
          if (status === "Attended") subjectStats[subject].attended++;
        }
      });
    });

    let newAttendanceData = {};
    Object.keys(subjectStats).forEach((subject) => {
      let { attended, total } = subjectStats[subject];
      newAttendanceData[subject] = total > 0 ? ((attended / total) * 100).toFixed(2) + "%" : "0%";
    });

    setSubjectAttendance(newAttendanceData);
    toast.success("✅ Attendance Submitted!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">📆 Class Routine & Attendance Tracker</h1>
      <div className="mt-4 md:flex md:space-x-4 space-y-4 md:space-y-0">
        <Calendar className="border rounded-lg p-2" onChange={setDate} value={date} />
        <div className="p-4 border rounded-lg shadow-md w-full">
          <h2 className="text-xl font-semibold">{selectedDay}'s Classes</h2>
          {subjectsForSelectedDay.length > 0 ? (
            subjectsForSelectedDay.map((subject, index) => (
              <div key={index} className="mt-2 p-2 bg-gray-200 rounded flex justify-between items-center">
                <span>{subject}</span>
                <select
                  className="border p-1 rounded"
                  value={attendance[selectedDay]?.[subject] || ""}
                  onChange={(e) => handleAttendance(subject, e.target.value)}
                >
                  <option value="">Mark Attendance</option>
                  {attendanceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))
          ) : (
            <p>No classes for today.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <button onClick={handleSubmitAttendance} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2">
          Submit Attendance
        </button>
        <button onClick={() => navigate("/routineinput")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Update Routine
        </button>
      </div>
      <div className="mt-6 p-4 border rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">📊 Subject-wise Attendance</h2>
        {Object.keys(subjectAttendance).length > 0 ? (
          <ul className="mt-2">
            {Object.entries(subjectAttendance).map(([subject, percentage]) => (
              <li key={subject} className="p-2 border-b">{subject}: <span className="font-bold">{percentage}</span></li>
            ))}
          </ul>
        ) : (
          <p>No attendance data yet.</p>
        )}
      </div>
    </div>
  );
};

export default ClassRoutine;
