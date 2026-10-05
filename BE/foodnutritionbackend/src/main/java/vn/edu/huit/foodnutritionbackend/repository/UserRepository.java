package vn.edu.huit.foodnutritionbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.huit.foodnutritionbackend.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA sẽ tự động hiểu hàm này: Tìm user theo email
    User findByEmail(String email);
    User findByEmailIgnoreCase(String email);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from User u where u.id = :id")
    java.util.Optional<User> lockById(@org.springframework.data.repository.query.Param("id") Long id);
}