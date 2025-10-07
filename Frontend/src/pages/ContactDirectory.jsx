import React from "react";
import "tailwindcss/tailwind.css";
import { FaPhoneAlt, FaEnvelope, FaUser } from "react-icons/fa";

const contacts = [
  {
    category: "Administration",
    contacts: [
      { role: "Dean of Students", name: "Dr. Arvind Sharma", phone: "+91 9876543210", email: "dean@college.edu" },
      { role: "Registrar", name: "Ms. Meera Kapoor", phone: "+91 8765432109" },
      { role: "Finance Office", name: "Mr. Rajesh Verma", phone: "+91 7654321011", email: "finance@college.edu" },
    ],
  },
  {
    category: "Academics",
    contacts: [
      { role: "HOD Computer Science", name: "Dr. Ramesh Patil", phone: "+91 7654321098", email: "cs@college.edu" },
      { role: "HOD Mechanical", name: "Dr. Anil Gupta", phone: "+91 6543210987" },
      { role: "HOD Electronics", name: "Dr. Pooja Mehta", phone: "+91 6543210123", email: "ece@college.edu" },
      { role: "Academic Coordinator", name: "Mr. Suresh Kumar", phone: "+91 6543210456" },
    ],
  },
  {
    category: "Student Affairs",
    contacts: [
      { role: "Student Council President", name: "Rahul Yadav", phone: "+91 5432109876", email: "president@college.edu" },
      { role: "Placement Officer", name: "Ms. Swati Singh", phone: "+91 4321098765", email: "placements@college.edu" },
      { role: "Sports Coordinator", name: "Mr. Vikram Choudhary", phone: "+91 3210987654" },
    ],
  },
  {
    category: "Health & Wellness",
    contacts: [
      { role: "Campus Doctor", name: "Dr. Praveen Kumar", phone: "+91 3210987654", email: "health@college.edu" },
      { role: "Counseling Center", name: "Ms. Neha Bansal", phone: "+91 2109876543" },
      { role: "Emergency Helpline", name: "24/7 Support", phone: "+91 1098765432", email: "helpline@college.edu" },
    ],
  }
];

const ContactDirectory = () => {
  return (
    <div className="min-h-screen  p-6 sm:p-8">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-900 mb-4 sm:mb-6">College Contacts</h1>
        <p className="text-lg sm:text-xl text-gray-700">Find your essential college contacts below.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        {contacts.map((category, index) => (
          <div key={index} className="bg-white shadow-md border-l-4 sm:border-l-8 border-indigo-500 rounded-xl p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-4 sm:mb-6">{category.category}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {category.contacts.map((contact, idx) => (
                <div 
                  key={idx} 
                  className="bg-indigo-50 p-5 sm:p-6 rounded-lg shadow-sm transition-all duration-300
                             hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-indigo-400
                             active:scale-95"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-indigo-900 transition-all duration-300">
                      {contact.role}
                    </h3>
                    <div className="text-indigo-500 text-sm sm:text-lg bg-indigo-200 p-2 rounded-full">
                      <FaUser />
                    </div>
                  </div>
                  <p className="text-md font-medium text-gray-800 mb-2">{contact.name}</p>

                  <p className="text-sm sm:text-md text-gray-700 mb-2 flex items-center">
                    <FaPhoneAlt className="mr-2 text-indigo-600 transition-all duration-300" /> 
                    <a href={`tel:${contact.phone}`} className="hover:underline text-indigo-600">{contact.phone}</a>
                  </p>

                  {contact.email && (
                    <p className="text-sm sm:text-md text-gray-700 flex items-center">
                      <FaEnvelope className="mr-2 text-indigo-600 transition-all duration-300" />
                      <a href={`mailto:${contact.email}`} className="hover:underline text-indigo-600">{contact.email}</a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactDirectory;