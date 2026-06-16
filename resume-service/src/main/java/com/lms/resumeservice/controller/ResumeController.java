package com.lms.resumeservice.controller;

import com.lms.resumeservice.model.Resume;
import com.lms.resumeservice.repository.ResumeRepository;
import com.lms.resumeservice.service.LatexGeneratorService;
import com.lms.resumeservice.service.PdfGenerationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*") // Allows API Gateway calls directly if needed
public class ResumeController {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private LatexGeneratorService latexGeneratorService;

    @Autowired
    private PdfGenerationService pdfGenerationService;

    // 1. Get all resumes for user
    @GetMapping
    public ResponseEntity<List<Resume>> getAllResumes(@RequestHeader(value = "X-User-Id", required = true) String userId) {
        List<Resume> resumes = resumeRepository.findByUserId(userId);
        return ResponseEntity.ok(resumes);
    }

    // 2. Get specific resume
    @GetMapping("/{id}")
    public ResponseEntity<Resume> getResumeById(@PathVariable("id") UUID id) {
        Optional<Resume> resume = resumeRepository.findById(id);
        return resume.map(ResponseEntity::ok)
                     .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // 3. Create Resume
    @PostMapping
    public ResponseEntity<Resume> createResume(
            @RequestHeader(value = "X-User-Id", required = true) String userId,
            @Validated @RequestBody Resume resume) {
        resume.setUserId(userId);
        Resume savedResume = resumeRepository.save(resume);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResume);
    }

    // 4. Update Resume
    @PutMapping("/{id}")
    public ResponseEntity<Resume> updateResume(
            @PathVariable("id") UUID id,
            @RequestHeader(value = "X-User-Id", required = true) String userId,
            @Validated @RequestBody Resume resumeDetails) {
        
        Optional<Resume> optionalResume = resumeRepository.findById(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resume resume = optionalResume.get();
        // Check ownership
        if (!resume.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        resume.setFullName(resumeDetails.getFullName());
        resume.setEmail(resumeDetails.getEmail());
        resume.setPhone(resumeDetails.getPhone());
        resume.setAddress(resumeDetails.getAddress());
        resume.setLinkedinUrl(resumeDetails.getLinkedinUrl());
        resume.setGithubUrl(resumeDetails.getGithubUrl());
        resume.setPortfolioUrl(resumeDetails.getPortfolioUrl());
        resume.setProfessionalSummary(resumeDetails.getProfessionalSummary());
        resume.setSkills(resumeDetails.getSkills());
        resume.setEducation(resumeDetails.getEducation());
        resume.setExperience(resumeDetails.getExperience());
        resume.setProjects(resumeDetails.getProjects());
        resume.setCertifications(resumeDetails.getCertifications());
        resume.setAchievements(resumeDetails.getAchievements());
        resume.setLanguages(resumeDetails.getLanguages());
        resume.setInterests(resumeDetails.getInterests());
        resume.setTemplateId(resumeDetails.getTemplateId());
        resume.setStatus(resumeDetails.getStatus());

        Resume updatedResume = resumeRepository.save(resume);
        return ResponseEntity.ok(updatedResume);
    }

    // 5. Delete Resume
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(
            @PathVariable("id") UUID id,
            @RequestHeader(value = "X-User-Id", required = true) String userId) {
        
        Optional<Resume> optionalResume = resumeRepository.findById(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resume resume = optionalResume.get();
        // Check ownership
        if (!resume.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        resumeRepository.delete(resume);
        return ResponseEntity.ok().build();
    }

    // 6. Download LaTeX Source
    @GetMapping("/{id}/tex")
    public ResponseEntity<byte[]> getResumeTex(@PathVariable("id") UUID id) {
        Optional<Resume> optionalResume = resumeRepository.findById(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resume resume = optionalResume.get();
        String texContent = latexGeneratorService.generateLatex(resume);
        byte[] texBytes = texContent.getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        // Normalize name for filename
        String safeName = resume.getFullName().replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(safeName + "_resume.tex")
                .build());

        return new ResponseEntity<>(texBytes, headers, HttpStatus.OK);
    }

    // 7. Download Compiled PDF
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getResumePdf(@PathVariable("id") UUID id) {
        Optional<Resume> optionalResume = resumeRepository.findById(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resume resume = optionalResume.get();
        String texContent = latexGeneratorService.generateLatex(resume);
        byte[] pdfBytes = pdfGenerationService.compileLatex(texContent);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String safeName = resume.getFullName().replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(safeName + "_resume.pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
