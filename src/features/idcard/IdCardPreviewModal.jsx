import React, { useState, useCallback } from "react";
import { X, RotateCcw, Download, Loader, RotateCw } from "lucide-react";
import { EmployeeCard } from "./EmployeeCard";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/rbac";

const DEFAULT_PHOTO_POS = { x: 50, y: 50, scale: 1 };

export const IdCardPreviewModal = ({ employee, onClose }) => {
  const { role } = useAuth();
  const canDownloadPdf = hasPermission(role, "employees:write");
  const [generating, setGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const { generateIdCardPdf } = await import("./generateIdCardPdf.jsx");
      await generateIdCardPdf(employee);
    } catch (err) {
      console.error("[IdCard] PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [employee, generating]);

  if (!employee) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black shadow-brutal-lg max-w-[1050px] w-full max-h-[95vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-lg uppercase tracking-wide">
              ID Card Preview
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {employee.name} — {employee.employeeId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canDownloadPdf && (
              <button
                onClick={handleDownload}
                disabled={generating}
                className={`flex items-center gap-2 px-4 py-2 font-black text-xs uppercase tracking-wide border-2 border-black shadow-brutal-sm transition-all ${
                  generating
                    ? "bg-gray-200 text-gray-500 cursor-wait"
                    : "bg-green-500 text-white hover:translate-y-0.5 hover:shadow-none"
                }`}
              >
                {generating ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Download PDF
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
          <div className="text-center">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">
              Front
            </div>
            <div>
              <EmployeeCard
                employee={employee}
                side="front"
              />

            </div>

          </div>
          <div className="hidden lg:flex items-center text-gray-300">
            <RotateCcw size={20} />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">
              Back
            </div>
            <div>
              <EmployeeCard employee={employee} side="back" />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-4 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
            CR80 · 54 × 85.6 mm · Portrait · 300 DPI · Print Ready
          </p>
        </div>
      </div>
    </div>
  );
};
