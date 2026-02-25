import { jsPDF } from 'jspdf';
import { PopDatabase, PopStepDatabase } from '../types';
import { popService } from './pops';
import { settingsService } from './settings';
import { supabase } from '../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────

async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        console.warn('Failed to load image:', url);
        return null;
    }
}

function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 1, height: 1 });
        img.src = base64;
    });
}

function wrapText(doc: jsPDF, text: string, x: number, maxWidth: number, lineHeight: number): string[] {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    return lines;
}

// ── Constants ────────────────────────────────────────────────────────

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 18;
const FOOTER_H = 12;

const COLORS = {
    primary: [37, 99, 235] as [number, number, number],     // blue-600
    dark: [15, 23, 42] as [number, number, number],         // slate-900
    muted: [100, 116, 139] as [number, number, number],     // slate-500
    light: [241, 245, 249] as [number, number, number],     // slate-100
    white: [255, 255, 255] as [number, number, number],
    accent: [79, 70, 229] as [number, number, number],      // indigo-600
};

// ── Page Header / Footer ─────────────────────────────────────────────

interface BrandingData {
    companyName: string | null;
    logoBase64: string | null;
}

async function loadBranding(): Promise<BrandingData> {
    const [companyName, logoUrl] = await Promise.all([
        settingsService.getCompanySetting('company_name'),
        settingsService.getCompanySetting('company_logo_url'),
    ]);
    let logoBase64: string | null = null;
    if (logoUrl) {
        logoBase64 = await loadImageAsBase64(logoUrl);
    }
    return { companyName, logoBase64 };
}

async function drawHeader(doc: jsPDF, branding: BrandingData) {
    const y = 8;
    const maxH = 12;
    let logoW = maxH;

    // Logo
    if (branding.logoBase64) {
        try {
            const dims = await getImageDimensions(branding.logoBase64);
            const ratio = dims.width / dims.height;
            logoW = maxH * ratio;
            doc.addImage(branding.logoBase64, 'PNG', MARGIN, y - 2, logoW, maxH);
        } catch { /* ignore invalid images */ }
    }

    // Company name
    const nameX = branding.logoBase64 ? MARGIN + logoW + 3 : MARGIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text(branding.companyName || 'POP Manager', nameX, y + 5);

    // Divider
    doc.setDrawColor(...COLORS.light);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, HEADER_H, PAGE_W - MARGIN, HEADER_H);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
    const y = PAGE_H - 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Página ${pageNum} de ${totalPages}`, PAGE_W - MARGIN, y, { align: 'right' });
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, MARGIN, y);
}

async function ensureSpace(doc: jsPDF, currentY: number, needed: number, branding: BrandingData): Promise<number> {
    if (currentY + needed > PAGE_H - FOOTER_H - MARGIN) {
        doc.addPage();
        await drawHeader(doc, branding);
        return HEADER_H + 8;
    }
    return currentY;
}

// ── Render a single POP into the doc ─────────────────────────────────

async function renderPop(
    doc: jsPDF,
    pop: PopDatabase,
    steps: PopStepDatabase[],
    branding: BrandingData,
    startY: number,
    isFirst: boolean
): Promise<number> {
    if (!isFirst) {
        doc.addPage();
        await drawHeader(doc, branding);
        startY = HEADER_H + 8;
    }

    let y = startY;

    // ─── POP Title bar ───
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.white);
    doc.text(pop.title, MARGIN + 5, y + 9.5);
    y += 18;

    // ─── Meta info ───
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    const deptName = (pop as any).department?.name || 'Geral';
    const authorName = (pop as any).author?.full_name || 'Usuário';
    const updatedAt = new Date(pop.updated_at).toLocaleDateString('pt-BR');
    doc.text(`Departamento: ${deptName}  |  Autor: ${authorName}  |  Atualizado: ${updatedAt}`, MARGIN, y + 3);
    y += 8;

    // ─── Objective ───
    if (pop.description) {
        y = await ensureSpace(doc, y, 20, branding);
        doc.setFillColor(...COLORS.light);
        const descLines = wrapText(doc, pop.description, MARGIN + 5, CONTENT_W - 10, 4);
        const boxH = Math.max(14, descLines.length * 4 + 10);
        doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text('OBJETIVO', MARGIN + 5, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        doc.text(descLines, MARGIN + 5, y + 10);
        y += boxH + 4;
    }

    // ─── Steps ───
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        y = await ensureSpace(doc, y, 30, branding);

        // Step number badge
        doc.setFillColor(...COLORS.primary);
        doc.circle(MARGIN + 4, y + 4, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.white);
        doc.text(String(i + 1), MARGIN + 4, y + 5.5, { align: 'center' });

        // Step title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...COLORS.dark);
        doc.text(step.title, MARGIN + 12, y + 5.5);
        y += 10;

        // Step content
        if (step.content) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.muted);
            const contentLines = wrapText(doc, step.content, MARGIN + 12, CONTENT_W - 12, 4);
            // Check if we need more space for long content
            for (let lineIdx = 0; lineIdx < contentLines.length; lineIdx++) {
                y = await ensureSpace(doc, y, 5, branding);
                doc.text(contentLines[lineIdx], MARGIN + 12, y + 3);
                y += 4;
            }
            y += 2;
        }

        // Step image
        if (step.image_url) {
            const imgBase64 = await loadImageAsBase64(step.image_url);
            if (imgBase64) {
                const imgW = CONTENT_W - 24;
                const imgH = imgW * 0.5625; // 16:9 ratio
                y = await ensureSpace(doc, y, imgH + 6, branding);
                try {
                    doc.addImage(imgBase64, 'JPEG', MARGIN + 12, y, imgW, imgH);
                    y += imgH + 4;
                } catch {
                    // skip if image fails
                }
            }
        }

        // Separator between steps
        if (i < steps.length - 1) {
            y = await ensureSpace(doc, y, 6, branding);
            doc.setDrawColor(...COLORS.light);
            doc.setLineWidth(0.2);
            doc.line(MARGIN + 12, y, PAGE_W - MARGIN, y);
            y += 6;
        }
    }

    return y;
}

// ── Add page numbers after full render ───────────────────────────────

function addPageNumbers(doc: jsPDF) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages);
    }
}

// ── Cover page for multi-POP exports ─────────────────────────────────

async function renderCover(
    doc: jsPDF,
    branding: BrandingData,
    title: string,
    popTitles: string[]
) {
    let y = 60;

    // Logo grande
    if (branding.logoBase64) {
        try {
            const dims = await getImageDimensions(branding.logoBase64);
            const ratio = dims.width / dims.height;
            const coverH = 30;
            const coverW = coverH * ratio;
            doc.addImage(branding.logoBase64, 'PNG', PAGE_W / 2 - coverW / 2, y, coverW, coverH);
            y += coverH + 8;
        } catch { /* skip */ }
    }

    // Company name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COLORS.dark);
    doc.text(branding.companyName || 'POP Manager', PAGE_W / 2, y, { align: 'center' });
    y += 12;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.primary);
    doc.text(title, PAGE_W / 2, y, { align: 'center' });
    y += 16;

    // Divider
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(60, y, PAGE_W - 60, y);
    y += 12;

    // Table of contents
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text('SUMÁRIO', PAGE_W / 2, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    popTitles.forEach((t, i) => {
        if (y > PAGE_H - 30) {
            doc.addPage();
            y = MARGIN + 10;
        }
        doc.text(`${i + 1}. ${t}`, MARGIN + 20, y);
        y += 6;
    });

    // Date
    y = PAGE_H - 30;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_W / 2, y, { align: 'center' });
}

// ── Public API ───────────────────────────────────────────────────────

export const pdfExportService = {
    /**
     * Generate PDF for a single POP
     */
    async generateSinglePopPdf(pop: PopDatabase, steps: PopStepDatabase[]) {
        const branding = await loadBranding();
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        await drawHeader(doc, branding);
        await renderPop(doc, pop, steps, branding, HEADER_H + 8, true);
        addPageNumbers(doc);

        const safeName = pop.title.replace(/[^a-zA-Z0-9À-ú ]/g, '').replace(/\s+/g, '_');
        doc.save(`POP_${safeName}.pdf`);
    },

    /**
     * Generate PDF for all POPs of a specific department
     */
    async generateDepartmentPdf(departmentId: string, departmentName: string) {
        const branding = await loadBranding();
        const allPops = await popService.getPops();
        const deptPops = allPops.filter(p => p.department_id === departmentId);

        if (deptPops.length === 0) {
            alert('Nenhum POP encontrado neste departamento.');
            return;
        }

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        // Cover
        await renderCover(doc, branding, `POPs — ${departmentName}`, deptPops.map(p => p.title));

        // Render each POP
        for (let i = 0; i < deptPops.length; i++) {
            const result = await popService.getPopById(deptPops[i].id);
            if (!result) continue;
            doc.addPage();
            await drawHeader(doc, branding);
            await renderPop(doc, result.pop, result.steps, branding, HEADER_H + 8, true);
        }

        addPageNumbers(doc);
        const safeName = departmentName.replace(/[^a-zA-Z0-9À-ú ]/g, '').replace(/\s+/g, '_');
        doc.save(`POPs_${safeName}.pdf`);
    },

    /**
     * Generate PDF for ALL POPs, grouped by department
     */
    async generateAllPopsPdf() {
        const branding = await loadBranding();
        const allPops = await popService.getPops();

        if (allPops.length === 0) {
            alert('Nenhum POP encontrado.');
            return;
        }

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        // Cover
        await renderCover(doc, branding, 'Todos os POPs', allPops.map(p => p.title));

        // Group by department
        const grouped = new Map<string, PopDatabase[]>();
        allPops.forEach(pop => {
            const deptName = (pop as any).department?.name || 'Geral';
            if (!grouped.has(deptName)) grouped.set(deptName, []);
            grouped.get(deptName)!.push(pop);
        });

        for (const [deptName, pops] of grouped) {
            // Department divider page
            doc.addPage();
            await drawHeader(doc, branding);
            let y = 80;
            doc.setFillColor(...COLORS.primary);
            doc.roundedRect(MARGIN, y, CONTENT_W, 20, 3, 3, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...COLORS.white);
            doc.text(deptName, PAGE_W / 2, y + 13, { align: 'center' });
            doc.setFontSize(9);
            doc.text(`${pops.length} procedimento(s)`, PAGE_W / 2, y + 28, { align: 'center' });

            for (const pop of pops) {
                const result = await popService.getPopById(pop.id);
                if (!result) continue;
                doc.addPage();
                await drawHeader(doc, branding);
                await renderPop(doc, result.pop, result.steps, branding, HEADER_H + 8, true);
            }
        }

        addPageNumbers(doc);
        doc.save(`POPs_Completo.pdf`);
    },
};
