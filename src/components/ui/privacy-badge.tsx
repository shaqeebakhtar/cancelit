export default function PrivacyBadge() {
  return (
    <div className="flex flex-col gap-3 mt-8">
      <div className="flex items-start gap-3">
        <span className="w-2 h-2 bg-[#0A0A0A] mt-1.5 shrink-0" />
        <p className="text-sm text-[#525252]">
          Your file is processed locally and never uploaded to any server
        </p>
      </div>
      <div className="flex items-start gap-3">
        <span className="w-2 h-2 bg-[#0A0A0A] mt-1.5 shrink-0" />
        <p className="text-sm text-[#525252]">
          Nothing is stored. Ever. Your data is deleted after analysis.
        </p>
      </div>
    </div>
  );
}
