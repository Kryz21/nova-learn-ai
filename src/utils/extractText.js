import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function extractFromPdf(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => it.str).join(' ') + '\n'
  }
  return text.trim()
}

export async function extractFromDocx(file) {
  const buf = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
  return value.trim()
}

export async function extractFromFile(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractFromPdf(file)
  if (name.endsWith('.docx')) return extractFromDocx(file)
  if (name.endsWith('.txt') || name.endsWith('.md')) return file.text()
  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
}

export function extractYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}
