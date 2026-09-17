import { useRef, useState, type DragEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { Apartment } from '../types.ts';
import { downloadExcelTemplate, parseExcelFile } from '../utils/excel.ts';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newApartments: Apartment[], replaceExisting: boolean) => void;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Apartment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setErrors([]);

    const result = await parseExcelFile(selectedFile);
    setLoading(false);

    if (result.success && result.data.length > 0) {
      setParsedData(result.data);
      setErrors(result.errors);
    } else {
      setParsedData([]);
      setErrors(
        result.errors.length > 0
          ? result.errors
          : ['Excel cədvəlindən məlumat tapılmadı və ya format uyğun deyil.']
      );
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    onImportComplete(parsedData, replaceExisting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Excel Cədvəlindən Məlumatların Yüklənməsi</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Instructions banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                Məlumatları düzgün yükləmək üçün şablondan istifadə edin:
              </p>
              <p className="text-slate-500 mt-0.5">
                Dəstəklənən sütunlar: Blok (A, B, C, C2), Mərtəbə (2-9), Otaq sayı (1-4), Sahə (m²),
                Nəğd 1 m² və 12-60 aylıq kredit qiymətləri.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition shrink-0 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Nümunə Şablon (.xlsx)</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {file ? file.name : 'Excel və ya CSV faylını buraya sürükləyin'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              və ya kompyuterdən seçmək üçün bura klikləyin (.xlsx, .xls, .csv)
            </p>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-4 text-center text-xs text-slate-500 font-medium">
              Excel faylı oxunur və yoxlanılır, zəhmət olmasa gözləyin...
            </div>
          )}

          {/* Errors list */}
          {errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Xəbərdarlıq / Xətalar:</span>
              </div>
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-rose-700 pl-5">
                  • {err}
                </p>
              ))}
            </div>
          )}

          {/* Preview of Parsed Apartments */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parsedData.length} mənzil uğurla oxundu</span>
                </div>
              </div>

              {/* Table preview (first 4 rows) */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">№</th>
                      <th className="p-2">Blok</th>
                      <th className="p-2">Mərtəbə</th>
                      <th className="p-2">Otaq</th>
                      <th className="p-2">Sahə</th>
                      <th className="p-2">Nəğd 1 m²</th>
                      <th className="p-2">12 Ay</th>
                      <th className="p-2">60 Ay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {parsedData.slice(0, 5).map((apt, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-900">{apt.apartmentNumber}</td>
                        <td className="p-2 font-bold">{apt.block}</td>
                        <td className="p-2">{apt.floor}</td>
                        <td className="p-2">{apt.rooms} otaq</td>
                        <td className="p-2">{apt.area} m²</td>
                        <td className="p-2">{apt.cashPricePerM2} ₼</td>
                        <td className="p-2">{apt.credit12PricePerM2} ₼</td>
                        <td className="p-2">{apt.credit60PricePerM2} ₼</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-3xs text-slate-400 text-right">
                  + daha {parsedData.length - 5} mənzil...
                </p>
              )}

              {/* Import Mode Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">Yükləmə rejimi:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="accent-emerald-600"
                  />
                  <span className="text-slate-700">
                    <strong>Mövcud bazaya əlavə et</strong> (Yeni mənzillər mövcud siyahıya əlavə olunacaq)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="accent-emerald-600"
                  />
                  <span className="text-slate-700">
                    <strong>Mövcud bazanı yenisi ilə əvəzlə</strong> (Köhnə siyahı silinəcək və yalnız bu cədvəl qalacaq)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Ləğv Et
            </button>
            <button
              id="btn-confirm-excel-import"
              type="button"
              disabled={parsedData.length === 0}
              onClick={handleConfirmImport}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer ${
                parsedData.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {replaceExisting
                  ? `Avtomatik Yadda Saxla və Bazanı Əvəzlə (${parsedData.length} Mənzil)`
                  : `Avtomatik Yadda Saxla və Bazaya Əlavə Et (${parsedData.length} Mənzil)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
