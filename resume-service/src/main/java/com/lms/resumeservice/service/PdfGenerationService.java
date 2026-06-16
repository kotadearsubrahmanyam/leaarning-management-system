package com.lms.resumeservice.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class PdfGenerationService {

    public byte[] compileLatex(String latexContent) {
        // Create temp folder inside workspace
        String userDir = System.getProperty("user.dir");
        Path tempDir = Paths.get(userDir, "temp");
        
        try {
            if (!Files.exists(tempDir)) {
                Files.createDirectories(tempDir);
            }
        } catch (IOException e) {
            System.err.println("Could not create temp directory: " + e.getMessage());
            return generateFallbackPdf();
        }

        String fileId = UUID.randomUUID().toString();
        Path texFile = tempDir.resolve(fileId + ".tex");
        Path pdfFile = tempDir.resolve(fileId + ".pdf");

        try {
            // Write LaTeX content to file
            Files.writeString(texFile, latexContent);

            // Execute pdflatex
            ProcessBuilder pb = new ProcessBuilder(
                "pdflatex",
                "-interaction=nonstopmode",
                "-output-directory=" + tempDir.toString(),
                texFile.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read output to log in case of errors
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // System.out.println(line); // Keep commented or route to logger
                }
            }

            boolean completed = process.waitFor(15, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new RuntimeException("pdflatex execution timed out");
            }

            if (process.exitValue() != 0) {
                System.err.println("pdflatex exited with code " + process.exitValue());
                // In case of error in LaTeX compilation, fallback or read PDF if it still compiled
            }

            if (Files.exists(pdfFile)) {
                byte[] pdfBytes = Files.readAllBytes(pdfFile);
                return pdfBytes;
            } else {
                throw new FileNotFoundException("PDF was not created by pdflatex");
            }

        } catch (Exception e) {
            System.err.println("pdflatex compilation failed: " + e.getMessage() + ". Using fallback PDF.");
            return generateFallbackPdf();
        } finally {
            // Cleanup auxiliary files
            cleanupAuxiliaryFiles(tempDir, fileId);
        }
    }

    private void cleanupAuxiliaryFiles(Path tempDir, String fileId) {
        String[] extensions = {".tex", ".pdf", ".aux", ".log", ".out"};
        for (String ext : extensions) {
            try {
                Path file = tempDir.resolve(fileId + ext);
                Files.deleteIfExists(file);
            } catch (IOException e) {
                // Ignore cleanup errors
            }
        }
    }

    private byte[] generateFallbackPdf() {
        // Minimal valid PDF 1.4 structure with a single text page
        String pdf = "%PDF-1.4\n" +
                "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n" +
                "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n" +
                "3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595.27 841.89] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R>> endobj\n" +
                "4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>> endobj\n" +
                "5 0 obj <</Length 280>> stream\n" +
                "BT\n" +
                "/F1 18 Tf\n" +
                "50 750 Td\n" +
                "(LaTeX PDF Generation Fallback) Tj\n" +
                "0 -30 Td\n" +
                "/F1 12 Tf\n" +
                "(pdflatex was not found in the host system PATH.) Tj\n" +
                "0 -20 Td\n" +
                "(The system has successfully generated your resume data and LaTeX source.) Tj\n" +
                "0 -20 Td\n" +
                "(To compile this into a professional PDF format:) Tj\n" +
                "0 -20 Td\n" +
                "(1. Download the raw LaTeX source (.tex file) from this application.) Tj\n" +
                "0 -15 Td\n" +
                "(2. Upload it to Overleaf.com or install a local distribution like TeX Live / MiKTeX.) Tj\n" +
                "0 -15 Td\n" +
                "(3. Ensure 'pdflatex' is installed and in the environment PATH to enable direct PDF downloads.) Tj\n" +
                "ET\n" +
                "endstream\n" +
                "endobj\n" +
                "xref\n" +
                "0 6\n" +
                "0000000000 65535 f \n" +
                "0000000009 00000 n \n" +
                "0000000056 00000 n \n" +
                "0000000111 00000 n \n" +
                "0000000255 00000 n \n" +
                "0000000329 00000 n \n" +
                "trailer\n" +
                "<</Size 6 /Root 1 0 R>>\n" +
                "startxref\n" +
                "661\n" +
                "%%EOF\n";
        try {
            return pdf.getBytes("UTF-8");
        } catch (UnsupportedEncodingException e) {
            return pdf.getBytes();
        }
    }
}
