/**
 * Small visual preview of the completion certificate — a scaled-down mock of
 * the real PDF, shown in the course completion tile (Coursera-style).
 */
export function CertificatePreview({
  courseTitle,
  studentName,
  grade
}: {
  courseTitle: string;
  studentName: string;
  grade: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-[#C9A84C] bg-white">
      <div className="h-1.5 bg-gradient-to-r from-[#0057FF] via-[#3379FF] to-[#0057FF]" />
      <div className="px-5 py-5 text-center">
        <p className="text-[7px] font-[800] uppercase tracking-[2px] text-[#0057FF]">
          KabulLearn · Learn Without Limits
        </p>
        <p className="mt-2.5 text-[7px] font-[700] uppercase tracking-[2px] text-[#9896B8]">
          Certificate of Completion
        </p>
        <div className="mx-auto mt-2 h-px w-16 bg-[#E4E3F2]" />

        <p className="mt-3 text-[7px] font-[500] text-[#6B6987]">This certifies that</p>
        <p className="mt-1 truncate text-[15px] font-[800] tracking-[-0.3px] text-[#0A0914]">
          {studentName}
        </p>
        <p className="mt-2 text-[7px] font-[500] text-[#6B6987]">has successfully completed</p>
        <p className="mt-1 line-clamp-2 text-[10px] font-[800] leading-snug tracking-[-0.2px] text-[#0A0914]">
          {courseTitle}
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C] bg-[#FFFBF0] px-3 py-1">
          <span className="text-[6.5px] font-[800] uppercase tracking-[1px] text-[#966000]">Grade</span>
          <span className="text-[11px] font-[800] leading-none text-[#966000]">{grade}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-gradient-to-r from-[#0057FF] via-[#3379FF] to-[#0057FF]" />
    </div>
  );
}
