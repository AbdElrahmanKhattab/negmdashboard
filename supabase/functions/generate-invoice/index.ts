import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { PDFDocument, rgb } from "npm:pdf-lib@1"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Missing Authorization header', { status: 401 })
    }

    const { milestone_id, office_id } = await req.json()
    if (!milestone_id || !office_id) {
      return new Response('Missing required parameters', { status: 400 })
    }

    // 1. Fetch milestone + project + client + office data
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select(`
        *,
        projects (
          *,
          clients (*),
          offices (*)
        )
      `)
      .eq('id', milestone_id)
      .eq('projects.office_id', office_id)
      .single()

    if (milestoneError || !milestone) {
      return new Response('Milestone not found', { status: 404 })
    }

    // 2. Fetch all payments for this milestone
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('milestone_id', milestone_id)

    if (paymentsError) {
      return new Response('Error fetching payments', { status: 500 })
    }

    const project = milestone.projects
    const client = project.clients
    const office = project.offices

    // Calculate totals
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount_paid), 0)
    const remaining = Math.max(0, Number(milestone.amount) - totalPaid)
    
    // Check if there's any late fee added in payments
    // (A simplified check - if total paid > milestone amount, assume the rest is late fee/extra)
    const extraPaid = Math.max(0, totalPaid - Number(milestone.amount))
    const totalDue = Number(milestone.amount) + (milestone.status === 'late' && extraPaid === 0 ? Number(milestone.amount) * (Number(milestone.late_fee_rate) / 100) : 0)

    // 3. Build PDF using pdf-lib
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const { width, height } = page.getSize()

    // Setup typography and layout
    const fontSize = 12
    const margin = 50
    let currentY = height - margin

    // Office Info
    page.drawText(office.name, { x: margin, y: currentY, size: 24 })
    currentY -= 40
    
    // Invoice Header
    page.drawText('INVOICE', { x: margin, y: currentY, size: 18 })
    currentY -= 20
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
    page.drawText(`Invoice #: ${invoiceNum}`, { x: margin, y: currentY, size: fontSize })
    currentY -= 20
    page.drawText(`Date: ${new Date().toLocaleDateString('en-US')}`, { x: margin, y: currentY, size: fontSize })
    
    currentY -= 40

    // Billed To
    page.drawText('Billed To:', { x: margin, y: currentY, size: 14 })
    currentY -= 20
    page.drawText(client.name, { x: margin, y: currentY, size: fontSize })
    if (client.email) {
      currentY -= 20
      page.drawText(client.email, { x: margin, y: currentY, size: fontSize })
    }
    if (client.phone) {
      currentY -= 20
      page.drawText(client.phone, { x: margin, y: currentY, size: fontSize })
    }

    currentY -= 40

    // Project Details
    page.drawText(`Project: ${project.name}`, { x: margin, y: currentY, size: fontSize })
    currentY -= 20
    page.drawText(`Milestone: ${milestone.name}`, { x: margin, y: currentY, size: fontSize })

    currentY -= 40

    // Line Items Header
    page.drawText('Description', { x: margin, y: currentY, size: fontSize })
    page.drawText('Amount (EGP)', { x: width - margin - 100, y: currentY, size: fontSize })
    currentY -= 10
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
    })
    currentY -= 20

    // Line Items
    page.drawText(milestone.name, { x: margin, y: currentY, size: fontSize })
    page.drawText(Number(milestone.amount).toFixed(2), { x: width - margin - 100, y: currentY, size: fontSize })
    currentY -= 20

    if (milestone.status === 'late' || extraPaid > 0) {
      const lateFee = extraPaid > 0 ? extraPaid : Number(milestone.amount) * (Number(milestone.late_fee_rate) / 100)
      if (lateFee > 0) {
        page.drawText('Late Fee', { x: margin, y: currentY, size: fontSize })
        page.drawText(lateFee.toFixed(2), { x: width - margin - 100, y: currentY, size: fontSize })
        currentY -= 20
      }
    }

    currentY -= 10
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
    })
    currentY -= 20

    // Total
    page.drawText('TOTAL', { x: width - margin - 200, y: currentY, size: 14 })
    page.drawText((extraPaid > 0 ? Number(milestone.amount) + extraPaid : totalDue).toFixed(2), { x: width - margin - 100, y: currentY, size: 14 })
    
    currentY -= 40

    // Payment Status
    const statusText = milestone.status === 'paid' ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'
    page.drawText(`Payment Status: ${statusText}`, { x: margin, y: currentY, size: 14 })
    currentY -= 20
    page.drawText(`Amount Paid: EGP ${totalPaid.toFixed(2)}`, { x: margin, y: currentY, size: fontSize })
    currentY -= 20
    page.drawText(`Remaining: EGP ${remaining.toFixed(2)}`, { x: margin, y: currentY, size: fontSize })

    if (payments.length > 0) {
      currentY -= 40
      page.drawText('Payment History:', { x: margin, y: currentY, size: 14 })
      currentY -= 20
      
      for (const p of payments) {
        const dateStr = new Date(p.paid_at).toLocaleDateString('en-US')
        page.drawText(`${dateStr}`, { x: margin, y: currentY, size: fontSize })
        page.drawText(`EGP ${Number(p.amount_paid).toFixed(2)}`, { x: margin + 100, y: currentY, size: fontSize })
        if (p.notes) {
          page.drawText(`${p.notes}`, { x: margin + 250, y: currentY, size: fontSize })
        }
        currentY -= 20
      }
    }

    const pdfBytes = await pdfDoc.save()
    
    // 4. Upload to Storage
    const fileName = `invoice_${Date.now()}.pdf`
    const filePath = `${office_id}/${milestone_id}/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response('Error saving invoice to storage', { status: 500 })
    }

    // 5. Create signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 60 * 60 * 24) // 24 hours

    if (signedUrlError) {
       console.error('Signed URL error:', signedUrlError)
       // Even if signed URL fails, we saved the invoice. Return the path.
       return new Response(JSON.stringify({ 
         message: 'Invoice generated', 
         path: filePath
       }), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ 
      url: signedUrlData.signedUrl,
      path: filePath
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
