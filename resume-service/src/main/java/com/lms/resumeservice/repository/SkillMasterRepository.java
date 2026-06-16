package com.lms.resumeservice.repository;

import com.lms.resumeservice.model.SkillMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillMasterRepository extends JpaRepository<SkillMaster, Long> {
    List<SkillMaster> findByNameContainingIgnoreCase(String query);
    List<SkillMaster> findByNameContainingIgnoreCaseAndCategory(String query, String category);
    List<SkillMaster> findByCategoryIgnoreCase(String category);
    List<SkillMaster> findByIsTrendingTrue();
}
