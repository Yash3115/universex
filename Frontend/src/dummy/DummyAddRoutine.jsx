import { useState } from "react";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ClassRoutineInput = () => {
  const [routine, setRoutine] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  const [newSubject, setNewSubject] = useState({ day: "Monday", subject: "" });

  // 📝 Handle input change
  const handleInputChange = (e) => {
    setNewSubject({ ...newSubject, subject: e.target.value });
  };

  // ➕ Add subject to the selected day
  const addSubject = () => {
    if (newSubject.subject.trim() === "") return;
    setRoutine((prev) => ({
      ...prev,
      [newSubject.day]: [...prev[newSubject.day], newSubject.subject],
    }));
    setNewSubject({ ...newSubject, subject: "" });
  };

  // ❌ Remove a subject from a day
  const removeSubject = (day, index) => {
    setRoutine((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  // 📤 Submit routine (send to backend later)
  const submitRoutine = () => {
    console.log("Routine to store in DB:", routine);
    alert("Routine saved successfully!");
    // Here you can make an API call to save the routine in your database
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center">📅 Set Your Class Routine</h1>

      {/* 🎯 Input Form */}
      <div className="mt-4 flex flex-col md:flex-row gap-4 items-center">
        <select
          className="border p-2 rounded w-full md:w-auto"
          value={newSubject.day}
          onChange={(e) => setNewSubject({ ...newSubject, day: e.target.value })}
        >
          {daysOfWeek.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="border p-2 rounded w-full md:w-auto"
          placeholder="Enter Subject Name"
          value={newSubject.subject}
          onChange={handleInputChange}
        />
        <button
          onClick={addSubject}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full md:w-auto"
        >
          ➕ Add
        </button>
      </div>

      {/* 📌 Routine Display */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-4 border rounded-lg shadow-md bg-gray-100">
            <h2 className="text-xl font-semibold text-center">{day}</h2>
            {routine[day].length > 0 ? (
              <ul className="mt-2 max-h-40 overflow-y-auto">
                {routine[day].map((subject, index) => (
                  <li key={index} className="p-2 border-b flex justify-between items-center">
                    {subject}
                    <button
                      onClick={() => removeSubject(day, index)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      ❌ Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No classes added.</p>
            )}
          </div>
        ))}
      </div>

      {/* ✅ Submit Button */}
      <div className="mt-6 text-center">
        <button
          onClick={submitRoutine}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 text-lg"
        >
          ✅ Save Routine
        </button>
      </div>
    </div>
  );
};

export default ClassRoutineInput;
