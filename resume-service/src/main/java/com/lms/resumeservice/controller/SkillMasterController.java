package com.lms.resumeservice.controller;

import com.lms.resumeservice.model.SkillMaster;
import com.lms.resumeservice.repository.SkillMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = "*")
public class SkillMasterController {

    @Autowired
    private SkillMasterRepository skillMasterRepository;

    @GetMapping("/search")
    public ResponseEntity<List<SkillMaster>> searchSkills(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "category", required = false) String category) {

        List<SkillMaster> rawList;

        boolean hasQuery = query != null && !query.trim().isEmpty();
        boolean hasCategory = category != null && !category.trim().isEmpty();

        if (hasQuery && hasCategory) {
            rawList = skillMasterRepository.findByNameContainingIgnoreCaseAndCategory(query.trim(), category.trim());
        } else if (hasQuery) {
            rawList = skillMasterRepository.findByNameContainingIgnoreCase(query.trim());
        } else if (hasCategory) {
            rawList = skillMasterRepository.findByCategoryIgnoreCase(category.trim());
        } else {
            rawList = skillMasterRepository.findAll();
        }

        // Apply relevance sorting if query is present
        if (hasQuery) {
            final String qLower = query.trim().toLowerCase();
            rawList.sort((s1, s2) -> {
                String n1 = s1.getName().toLowerCase();
                String n2 = s2.getName().toLowerCase();

                int score1 = 0;
                int score2 = 0;

                // 1. Exact match gets highest priority
                if (n1.equals(qLower)) score1 = 100;
                if (n2.equals(qLower)) score2 = 100;

                // 2. Starts-with gets secondary priority
                if (score1 == 0 && n1.startsWith(qLower)) score1 = 50;
                if (score2 == 0 && n2.startsWith(qLower)) score2 = 50;

                // 3. Contains gets tertiary
                if (score1 == 0 && n1.contains(qLower)) score1 = 10;
                if (score2 == 0 && n2.contains(qLower)) score2 = 10;

                // Compare relevance scores descending
                if (score1 != score2) {
                    return Integer.compare(score2, score1);
                }

                // 4. Tie-breaker: Trending first
                boolean t1 = s1.getIsTrending() != null && s1.getIsTrending();
                boolean t2 = s2.getIsTrending() != null && s2.getIsTrending();
                if (t1 != t2) {
                    return t1 ? -1 : 1;
                }

                // 5. Secondary tie-breaker: alphabetical order
                return s1.getName().compareToIgnoreCase(s2.getName());
            });
        } else {
            // Sort by trending first, then alphabetically
            rawList.sort((s1, s2) -> {
                boolean t1 = s1.getIsTrending() != null && s1.getIsTrending();
                boolean t2 = s2.getIsTrending() != null && s2.getIsTrending();
                if (t1 != t2) {
                    return t1 ? -1 : 1;
                }
                return s1.getName().compareToIgnoreCase(s2.getName());
            });
        }

        // Limit results to top 20
        List<SkillMaster> result = rawList.stream()
                .limit(20)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
