"use client";

import Navbar from "../components/Navbar";
import Header from "../components/Header";
import HeroImage from "../components/HeroImage";
import documents from "./data";

import { Download, FileTerminal } from "lucide-react";

export default function DocumentPage() {
  const getPreviewUrl = (fileUrl?: string) => {
    if (!fileUrl) 
      return undefined;

    const parts = fileUrl.split(".");
    const ext = parts[parts.length - 1]?.toLowerCase();

    if (ext === "pdf") 
      return fileUrl;

    const officeExts = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];

    if (officeExts.includes(ext)) {
      const absolute = typeof window !== "undefined" ? window.location.origin + fileUrl : fileUrl;
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absolute)}`;
    }
    return fileUrl;
  };

  const renderActions = (fileUrl?: string) =>
    fileUrl ? (
      <div className="flex flex-col sm:flex-col items-end gap-2">
        <a
        href={fileUrl}
        download
        className="p-2 flex items-center text-green-700 text-md hover:text-green-900 cursor-pointer font-medium transition"
      >
        <Download className="inline mr-2 mb-1 w-4 h-4" />
        Download
      </a>

      </div>
    ) : (
      <button
        disabled
        className="p-2 flex items-center text-gray-400 text-sm font-medium"
      >
        <Download className="inline mr-2 mb-1 w-4 h-4" />
        Download
      </button>
    );

  return (
    <div className="relative pt-6 px-4 sm:px-6 md:px-12">
      <HeroImage />
      <Navbar />
      <div className="relative">
        <Header showBigLogo={true} />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mt-10 sm:mt-12">
        Documents for External Activities
      </h1>

      <div className="mt-8">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="mb-6 p-4 sm:p-6 border border-green-800 shadow-md rounded-xl hover:shadow-lg transition group"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 sm:gap-6">
                <div className="flex-1">
                  {doc.fileUrl ? (
                    <a
                      href={getPreviewUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg sm:text-xl text-green-700 font-semibold flex items-center hover:underline"
                    >
                      <FileTerminal className="inline mr-3 w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                      {doc.title}
                    </a>
                  ) : (
                    <h2 className="text-lg sm:text-xl text-green-700 font-semibold flex items-center">
                      <FileTerminal className="inline mr-3 w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                      {doc.title}
                    </h2>
                  )}

                  <div className="overflow-hidden max-h-0 opacity-0 transform translate-y-2 transition-all duration-500 group-hover:max-h-96 group-hover:opacity-100 group-hover:translate-y-0">
                    <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-y-2 ml-3 text-sm mt-3 sm:mt-4">
                      <span className="font-medium text-gray-700">
                        Description:
                      </span>
                      <span className="text-gray-600 break-words">
                        {doc.description || "-"}
                      </span>

                      <span className="font-medium text-gray-700">
                        Instruction:
                      </span>
                      <span className="text-gray-700 break-words">
                        {doc.instructions || "-"}
                      </span>

                      <span className="font-medium text-gray-700">
                        Location:
                      </span>
                      <span className="text-gray-600 break-words">
                        {doc.location || "-"}
                      </span>

                      <span className="font-medium text-gray-700">
                        Deadline:
                      </span>
                      <span className="text-red-600 break-words">
                        {doc.deadline || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 self-end sm:self-auto">
                  {renderActions(doc.fileUrl)}
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
