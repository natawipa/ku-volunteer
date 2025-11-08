"use client";

import Navbar from "../components/Navbar";
import Header from "../components/Header";
import HeroImage from "../components/HeroImage";
import documents from "./data"

import { Download } from "lucide-react";
import { FileTerminal } from "lucide-react";

export default function DocumentPage() {
  
  const renderDownload = (fileUrl?: string) =>
  fileUrl ? (
    <a
      href={fileUrl}
      download
      className="p-2 flex items-center text-green-700 text-md hover:text-green-900 cursor-pointer font-medium transition"
    >
      <Download className="inline mr-2 mb-1 w-4 h-4" />
      Download
    </a>
  ) : (
      <button disabled className="p-2 flex items-center text-gray-400 text-sm font-medium">
        <Download className="inline mr-2 mb-1 w-4 h-4" />
        Download
      </button>
    );

  return (
    <div className="relative pt-6 px-4">
      <HeroImage />
      <Navbar />
      <div className="relative">
        <Header
          showBigLogo={true}
        />
      </div>

      <h1 className="text-3xl font-bold mt-12">Documents for External Activities</h1>

      {/* Filtered document list */}
      <div className="mt-8">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="mb-6 p-4 py-6 border border-green-800 shadow-md rounded-xl hover:shadow-lg transition group"
            >
              <div className="flex justify-between items-start p-4">
                <div className="flex-1">
                  {/* Title: clicking opens preview */}
                    <h2 className="text-lg text-green-700 font-semibold flex items-center">
                      <FileTerminal className="inline mr-4 mb-1 w-10 h-10 text-gray-300" />
                      {doc.title}
                    </h2>

                  {/* details container: hidden initially, revealed on hover with smooth transition */}
                  <div className="overflow-hidden max-h-0 w-300 opacity-0 transform translate-y-2 transition-all duration-500 group-hover:max-h-96 group-hover:opacity-100 group-hover:translate-y-0">
                    <div className="grid grid-cols-[120px_1fr] gap-y-2 ml-3 text-sm">
                      <span className="font-medium text-gray-700">Description:</span>
                      <span className="text-gray-600">{doc.description || "-"}</span>

                      <span className="font-medium text-gray-700">Instruction:</span>
                      <span className="text-gray-700">{doc.instructions || "-"}</span>

                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="text-gray-600">{doc.location || "-"}</span>

                      <span className="font-medium text-gray-700">Deadline:</span>
                      <span className="text-red-600">{doc.deadline || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                  {renderDownload(doc.fileUrl)}
                </div>
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
