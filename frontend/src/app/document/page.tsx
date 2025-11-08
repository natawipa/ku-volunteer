"use client";

import { useState, useMemo, useRef } from "react";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import HeroImage from "../components/HeroImage";

import { Download } from "lucide-react";

interface Document {
  id: number;
  title: string;
  description: string;
  fileUrl?: string;
}

export default function DocumentPage() {
  // 🗂 Example static data
  const documents: Document[] = [
    { id: 1, title: "Volunteer Guidelines", description: "Rules and requirements for all KU volunteer activities.", fileUrl: "/docs/volunteer-guidelines.pdf" },
    { id: 2, title: "Application Form", description: "Form for students to apply for volunteer events.", fileUrl: "/docs/application-form.pdf" },
    { id: 3, title: "Project Report Template", description: "Standard report format for volunteer projects.", fileUrl: "/docs/project-report-template.docx" },
    { id: 4, title: "Event Schedule", description: "Upcoming volunteer events and timelines.", fileUrl: "/docs/event-schedule.pdf" },
  ];

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="relative pt-6 px-4">
      <HeroImage />
      <Navbar />
      <div className="relative">
        <Header
          showBigLogo={true}
        />
      </div>

      <h1 className="text-3xl font-bold mt-13">Documents</h1>

      {/* Filtered document list */}
      <div className="mt-8">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div
            key={doc.id}
            className="mb-6 p-4 py-6 border border-green-800 shadow-md rounded-xl hover:shadow-lg transition"
            >
                <div className="flex justify-between items-start ml-4">
                    <div>
                        <h2 className="text-lg font-semibold">{doc.title}</h2>
                        <p className="text-gray-600 text-sm mt-1">{doc.description}</p>
                    </div>

                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        download
                        className="mt-4 mr-8 flex items-center text-green-700 text-sm hover:text-green-900 cursor-pointer font-medium transition"
                      >
                        <Download className="inline mr-2 mb-1 w-4 h-4" />
                        Download
                      </a>
                    ) : (
                      <button disabled className="mt-4 mr-8 flex items-center text-gray-400 text-sm font-medium">
                        <Download className="inline mr-2 mb-1 w-4 h-4" />
                        Download
                      </button>
                    )}
                </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No documents found.
          </p>
        )}
      </div>
    </div>
  );
}
