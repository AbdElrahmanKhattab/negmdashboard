import React, { useRef, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, FileSpreadsheet, Printer, Save, CheckCircle2, Loader2 } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import { useMilestone, useCreateDocument } from '@/hooks/useData';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function MilestoneInvoice() {
  const { id, projectId } = useParams();
  const { data: milestone, isLoading } = useMilestone(id);
  const createDoc = useCreateDocument();
  const invoiceRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  // Check if already saved on mount and trigger auto-save
  useEffect(() => {
    async function checkAndSave() {
      if (!id || isLoading) return;
      
      const { data } = await supabase
        .from('project_documents')
        .select('id')
        .eq('milestone_id', id)
        .limit(1);
        
      if (data && data.length > 0) {
        setAlreadySaved(true);
      } else {
        // Give the UI a moment to render before capturing
        setTimeout(() => {
          handleAutoSave();
        }, 1500);
      }
    }
    checkAndSave();
  }, [id, isLoading]);

  if (isLoading) {
    return <div className="p-12 flex justify-center font-sans">جاري تحميل بيانات الفاتورة...</div>;
  }
  if (!milestone) {
    return <div className="p-12 text-center font-sans">لم يتم العثور على بيانات هذه المرحلة.</div>;
  }

  const client = milestone.project?.client || {};
  const project = milestone.project || {};
  const payments = milestone.payments || [];
  const amount = Number(milestone.amount || 0);
  const lateFee = Number(milestone.late_fee_amount || 0);
  const total = amount + lateFee;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const remaining = total - totalPaid;
  const invoiceNumber = `INV-${id.substring(0, 8).toUpperCase()}`;
  const invoiceDate = new Date().toLocaleDateString('ar-EG');

  /* ─── AUTOMATIC SAVE LOGIC ───────────────────────────── */
  const handleAutoSave = async () => {
    if (!invoiceRef.current || alreadySaved || isSaving) return;
    
    setIsSaving(true);
    const toastId = toast.loading('جاري حفظ الفاتورة في مستندات المشروع...');

    try {
      // 1. Generate PDF Blob
      const el = invoiceRef.current;
      const originalWidth = el.style.width;
      el.style.width = '794px'; 

      const dataUrl = await htmlToImage.toPng(el, {
        quality: 0.9,
        pixelRatio: 1.5,
        width: 794,
        style: { margin: '0', padding: '48px' },
      });

      el.style.width = originalWidth;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
      
      const pdfBlob = pdf.output('blob');
      const fileName = `Invoice_${invoiceNumber}_${milestone.name.replace(/\s+/g, '_')}.pdf`;
      const filePath = `${projectId}/${Date.now()}_${fileName}`;

      // 2. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

      // 4. Create Document Record
      await createDoc.mutateAsync({
        project_id: projectId,
        milestone_id: id,
        invoice_id: invoiceNumber,
        name: `فاتورة ضريبية: ${milestone.name}`,
        file_url: publicUrl,
        file_type: 'application/pdf',
        size: pdfBlob.size
      });

      setAlreadySaved(true);
      toast.success('تم حفظ الفاتورة تلقائياً بنجاح', { id: toastId });
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('فشل الحفظ التلقائي', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  /* ─── PDF EXPORT ─────────────────────────────────────── */
  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    const toastId = toast.loading('جاري إنشاء ملف PDF...');
    try {
      const el = invoiceRef.current;
      const originalWidth = el.style.width;
      el.style.width = '794px';
      const dataUrl = await htmlToImage.toPng(el, { quality: 1.0, pixelRatio: 2, width: 794, style: { margin: '0', padding: '48px' } });
      el.style.width = originalWidth;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Invoice_${milestone.name}_${Date.now()}.pdf`);
      toast.success('تم تحميل الفاتورة بنجاح', { id: toastId });
    } catch (error) {
      toast.error('فشل في تصدير PDF', { id: toastId });
    }
  };

  /* ─── XLS EXPORT ─────────────────────────────────────── */
  const handleExportXLS = () => {
    const ACCENT = '0D47A1';
    const GREEN = '2E7D32';
    const ORANGE = 'E65100';
    const RED = 'C62828';
    const GRAY = '666666';
    const LIGHT_BG = 'F5F5F5';
    const WHITE = 'FFFFFF';
    const BORDER_COLOR = 'D0D0D0';
    const thinBorder = { style: 'thin', color: { rgb: BORDER_COLOR } };
    const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
    const titleStyle = { font: { bold: true, sz: 22, color: { rgb: ACCENT } }, alignment: { horizontal: 'center' } };
    const subtitleStyle = { font: { sz: 11, color: { rgb: GRAY } }, alignment: { horizontal: 'center' } };
    const sectionHeaderStyle = { font: { bold: true, sz: 14, color: { rgb: ACCENT } }, fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders, alignment: { horizontal: 'right' } };
    const labelStyle = { font: { bold: true, sz: 11, color: { rgb: '333333' } }, alignment: { horizontal: 'right' }, border: allBorders };
    const valueStyle = { font: { sz: 11, color: { rgb: '111111' } }, alignment: { horizontal: 'left' }, border: allBorders };
    const tableHeaderStyle = { font: { bold: true, sz: 11, color: { rgb: WHITE } }, fill: { fgColor: { rgb: ACCENT } }, border: allBorders, alignment: { horizontal: 'center' } };
    const tableCellStyle = { font: { sz: 11 }, border: allBorders, alignment: { horizontal: 'center' } };
    const tableCellAltStyle = { ...tableCellStyle, fill: { fgColor: { rgb: LIGHT_BG } } };
    const amountCellStyle = { font: { bold: true, sz: 11 }, border: allBorders, alignment: { horizontal: 'left' }, numFmt: '#,##0' };
    const amountCellAltStyle = { ...amountCellStyle, fill: { fgColor: { rgb: LIGHT_BG } } };
    const summaryLabelStyle = { font: { bold: true, sz: 12, color: { rgb: '333333' } }, fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders, alignment: { horizontal: 'right' } };
    const summaryValueStyle = { font: { bold: true, sz: 12, color: { rgb: '111111' } }, fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders, alignment: { horizontal: 'left' }, numFmt: '#,##0' };
    const totalLabelStyle = { font: { bold: true, sz: 14, color: { rgb: WHITE } }, fill: { fgColor: { rgb: ACCENT } }, border: allBorders, alignment: { horizontal: 'right' } };
    const totalValueStyle = { font: { bold: true, sz: 14, color: { rgb: WHITE } }, fill: { fgColor: { rgb: ACCENT } }, border: allBorders, alignment: { horizontal: 'left' }, numFmt: '#,##0' };
    const paidLabelStyle = { font: { bold: true, sz: 12, color: { rgb: GREEN } }, fill: { fgColor: { rgb: 'E8F5E9' } }, border: allBorders, alignment: { horizontal: 'right' } };
    const paidValueStyle = { font: { bold: true, sz: 12, color: { rgb: GREEN } }, fill: { fgColor: { rgb: 'E8F5E9' } }, border: allBorders, alignment: { horizontal: 'left' }, numFmt: '#,##0' };
    const remainingLabelStyle = { font: { bold: true, sz: 12, color: { rgb: ORANGE } }, fill: { fgColor: { rgb: 'FFF3E0' } }, border: allBorders, alignment: { horizontal: 'right' } };
    const remainingValueStyle = { font: { bold: true, sz: 12, color: { rgb: ORANGE } }, fill: { fgColor: { rgb: 'FFF3E0' } }, border: allBorders, alignment: { horizontal: 'left' }, numFmt: '#,##0' };
    const penaltyLabelStyle = { font: { bold: true, sz: 11, color: { rgb: RED } }, fill: { fgColor: { rgb: 'FFEBEE' } }, border: allBorders, alignment: { horizontal: 'right' } };
    const penaltyValueStyle = { font: { bold: true, sz: 11, color: { rgb: RED } }, fill: { fgColor: { rgb: 'FFEBEE' } }, border: allBorders, alignment: { horizontal: 'left' }, numFmt: '#,##0' };
    const rows = [];
    rows.push([{ v: 'فاتورة ضريبية — EngiTrack', s: titleStyle }, { v: '', s: {} }, { v: '', s: {} }]);
    rows.push([{ v: `رقم الفاتورة: ${invoiceNumber}`, s: subtitleStyle }, { v: '', s: {} }, { v: `التاريخ: ${invoiceDate}`, s: subtitleStyle }]);
    rows.push([{ v: '', s: {} }]);
    rows.push([{ v: 'معلومات العميل', s: sectionHeaderStyle }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }]);
    rows.push([{ v: 'اسم العميل:', s: labelStyle }, { v: client.name || '–', s: valueStyle }, { v: '', s: { border: allBorders } }]);
    rows.push([{ v: 'البريد الإلكتروني:', s: labelStyle }, { v: client.email || '–', s: valueStyle }, { v: '', s: { border: allBorders } }]);
    rows.push([{ v: 'الهاتف:', s: labelStyle }, { v: client.phone || '–', s: valueStyle }, { v: '', s: { border: allBorders } }]);
    rows.push([{ v: '', s: {} }]);
    rows.push([{ v: 'تفاصيل المشروع والمرحلة', s: sectionHeaderStyle }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }]);
    rows.push([{ v: 'اسم المشروع:', s: labelStyle }, { v: project.name || '–', s: valueStyle }, { v: '', s: { border: allBorders } }]);
    rows.push([{ v: 'اسم المرحلة:', s: labelStyle }, { v: milestone.name, s: valueStyle }, { v: '', s: { border: allBorders } }]);
    rows.push([{ v: 'تاريخ الاستحقاق:', s: labelStyle }, { v: milestone.deadline || '–', s: valueStyle }, { v: '', s: { border: allBorders } }]);
    rows.push([{ v: '', s: {} }]);
    rows.push([{ v: 'سجل الدفعات', s: sectionHeaderStyle }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }]);
    rows.push([{ v: 'التاريخ', s: tableHeaderStyle }, { v: 'الملاحظات', s: tableHeaderStyle }, { v: 'المبلغ المسدد (ج.م)', s: tableHeaderStyle }]);
    if (payments.length > 0) {
      payments.forEach((p, idx) => {
        const isAlt = idx % 2 === 1;
        rows.push([{ v: p.paid_at ? new Date(p.paid_at).toLocaleDateString('ar-EG') : '–', s: isAlt ? tableCellAltStyle : tableCellStyle }, { v: p.notes || 'دفعة مرحلة هندسية', s: isAlt ? tableCellAltStyle : tableCellStyle }, { v: Number(p.amount_paid), s: isAlt ? amountCellAltStyle : amountCellStyle }]);
      });
    } else {
      rows.push([{ v: 'لا توجد دفعات مسجلة', s: { ...tableCellStyle, font: { sz: 11, italic: true, color: { rgb: '999999' } } } }, { v: '', s: tableCellStyle }, { v: '', s: tableCellStyle }]);
    }
    rows.push([{ v: '', s: {} }]);
    rows.push([{ v: 'الملخص المالي', s: sectionHeaderStyle }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }]);
    rows.push([{ v: 'قيمة المرحلة الأساسية:', s: summaryLabelStyle }, { v: '', s: { fill: { fgColor: { rgb: LIGHT_BG } }, border: allBorders } }, { v: amount, s: summaryValueStyle }]);
    if (lateFee > 0) {
      rows.push([{ v: 'غرامات التأخير:', s: penaltyLabelStyle }, { v: '', s: { fill: { fgColor: { rgb: 'FFEBEE' } }, border: allBorders } }, { v: lateFee, s: penaltyValueStyle }]);
    }
    rows.push([{ v: 'الإجمالي المستحق:', s: totalLabelStyle }, { v: '', s: { fill: { fgColor: { rgb: ACCENT } }, border: allBorders } }, { v: total, s: totalValueStyle }]);
    rows.push([{ v: 'إجمالي المسدد:', s: paidLabelStyle }, { v: '', s: { fill: { fgColor: { rgb: 'E8F5E9' } }, border: allBorders } }, { v: totalPaid, s: paidValueStyle }]);
    if (remaining > 0) {
      rows.push([{ v: 'المبلغ المتبقي:', s: remainingLabelStyle }, { v: '', s: { fill: { fgColor: { rgb: 'FFF3E0' } }, border: allBorders } }, { v: remaining, s: remainingValueStyle }]);
    }
    rows.push([{ v: '', s: {} }]);
    rows.push([{ v: 'تم إنشاء هذه الفاتورة بواسطة نظام EngiTrack لإدارة المشاريع الهندسية', s: { font: { sz: 9, italic: true, color: { rgb: '999999' } }, alignment: { horizontal: 'center' } } }, { v: '', s: {} }, { v: '', s: {} }]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'فاتورة');
    if (!wb.Workbook) wb.Workbook = {};
    if (!wb.Workbook.Views) wb.Workbook.Views = [{}];
    wb.Workbook.Views[0].RTL = true;
    XLSX.writeFile(wb, `Invoice_${milestone.name}.xlsx`);
    toast.success('تم تحميل ملف Excel بنجاح');
  };

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <PageTransition className="space-y-6 flex flex-col h-full bg-bg-base p-4 md:p-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full no-print">
        <Link to={`/projects/${projectId}/milestones/${id}`} className="text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors font-sans text-sm">
          <ArrowRight className="w-4 h-4" /> العودة للتفاصيل
        </Link>
        <div className="flex gap-2">
          {alreadySaved ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-status-good/10 text-status-good text-sm font-sans border border-status-good/20">
              <CheckCircle2 className="w-4 h-4" /> تم الحفظ في المستندات
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleAutoSave} disabled={isSaving} className="font-sans border-accent text-accent hover:bg-accent/10">
              {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ في مستندات المشروع
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-sans">
            <Printer className="w-4 h-4 ml-2" /> طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXLS} className="font-sans border-status-good text-status-good hover:bg-status-good/10">
            <FileSpreadsheet className="w-4 h-4 ml-2" /> تصدير Excel
          </Button>
          <Button size="sm" onClick={handleExportPDF} className="font-sans bg-accent hover:bg-accent-hover text-white">
            <Download className="w-4 h-4 ml-2" /> تحميل PDF
          </Button>
        </div>
      </div>

      {/* Invoice Body */}
      <div
        ref={invoiceRef}
        className="bg-white text-gray-900 p-12 shadow-xl max-w-4xl mx-auto w-full font-sans border border-gray-200 print:shadow-none print:border-0"
        dir="rtl"
        style={{ boxSizing: 'border-box' }}
      >
        {/* ── Header ── */}
        <div className="flex justify-between items-start border-b-2 pb-8 mb-8" style={{ borderColor: '#0d47a1' }}>
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#0d47a1' }}>EngiTrack</h1>
            <p className="text-gray-500 font-medium">لوحة تحكم المشاريع الهندسية</p>
          </div>
          <div className="text-left" dir="ltr">
            <h2 className="text-3xl font-bold text-gray-800">TAX INVOICE</h2>
            <p className="text-gray-500 mt-1">Invoice #: {invoiceNumber}</p>
            <p className="text-gray-500">Date: {invoiceDate}</p>
          </div>
        </div>

        {/* ── Client & Project Info ── */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-100 pb-2" style={{ color: '#0d47a1' }}>مُقدمة إلى:</h3>
            <div className="space-y-1">
              <p className="text-xl font-bold text-gray-800">{client.name || '–'}</p>
              {client.email && <p className="text-gray-600">{client.email}</p>}
              {client.phone && <p className="text-gray-600">{client.phone}</p>}
              {client.address && <p className="text-gray-600">{client.address}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-100 pb-2" style={{ color: '#0d47a1' }}>تفاصيل المشروع:</h3>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800">{project.name || '–'}</p>
              <p className="text-gray-600">المرحلة: <span className="font-bold text-gray-800">{milestone.name}</span></p>
              <p className="text-gray-600">تاريخ الاستحقاق: <span dir="ltr" className="font-mono">{milestone.deadline || '–'}</span></p>
            </div>
          </div>
        </div>

        {/* ── Payment History Table ── */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-gray-800 mb-4 pr-3" style={{ borderRight: '4px solid #0d47a1' }}>سجل الدفعات لهذه المرحلة</h3>
          <table className="w-full text-right border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th className="py-3 px-4 border-b border-gray-200 font-bold text-gray-600" style={{ width: '25%' }}>التاريخ</th>
                <th className="py-3 px-4 border-b border-gray-200 font-bold text-gray-600" style={{ width: '45%' }}>الوصف (ملاحظات)</th>
                <th className="py-3 px-4 border-b border-gray-200 font-bold text-gray-600 text-left" style={{ width: '30%' }}>المبلغ المسدد</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {payments.length > 0 ? payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-4 px-4 font-mono" dir="ltr">{new Date(p.paid_at).toLocaleDateString('ar-EG')}</td>
                  <td className="py-4 px-4">{p.notes || 'دفعة مرحلة هندسية'}</td>
                  <td className="py-4 px-4 text-left font-bold" dir="ltr">{Number(p.amount_paid).toLocaleString()} ج.م</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400">لا توجد دفعات مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Financial Summary ── */}
        <div className="flex justify-start">
          <div className="w-80 space-y-3 p-6 rounded-xl border border-gray-100" style={{ backgroundColor: '#f9f9f9' }}>
            <div className="flex justify-between text-gray-600">
              <span>قيمة المرحلة:</span>
              <span className="font-bold" dir="ltr">{amount.toLocaleString()} ج.م</span>
            </div>
            {lateFee > 0 && (
              <div className="flex justify-between" style={{ color: '#c62828' }}>
                <span>غرامات التأخير:</span>
                <span className="font-bold" dir="ltr">{lateFee.toLocaleString()} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3 mt-3">
              <span>الإجمالي:</span>
              <span dir="ltr">{total.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between font-medium pt-1" style={{ color: '#2e7d32' }}>
              <span>إجمالي المسدد:</span>
              <span dir="ltr">{totalPaid.toLocaleString()} ج.م</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between font-bold pt-1 border-t border-dashed border-gray-200 mt-2" style={{ color: '#e65100' }}>
                <span>المتبقي:</span>
                <span dir="ltr">{remaining.toLocaleString()} ج.م</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </PageTransition>
  );
}
