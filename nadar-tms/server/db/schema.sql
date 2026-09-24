-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 07:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nadar_tms`
--

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `shift` varchar(20) NOT NULL,
  `bus_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `incharge_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `stop_id` int(11) DEFAULT NULL,
  `status` enum('present','absent') NOT NULL DEFAULT 'absent',
  `boarding_time` timestamp NULL DEFAULT NULL,
  `marked_by` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `buses`
--

CREATE TABLE `buses` (
  `id` int(11) NOT NULL,
  `registration_number` varchar(30) NOT NULL,
  `bus_code` varchar(20) DEFAULT NULL,
  `bus_name` varchar(100) DEFAULT NULL,
  `vehicle_type` enum('bus','mini_bus','van') DEFAULT 'bus',
  `manufacturer` varchar(50) DEFAULT NULL,
  `manufacturing_year` year(4) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `fuel_type` enum('diesel','petrol','cng','electric') DEFAULT 'diesel',
  `chassis_no` varchar(50) DEFAULT NULL,
  `engine_no` varchar(50) DEFAULT NULL,
  `bus_photo` varchar(255) DEFAULT NULL,
  `rc_book_file` varchar(255) DEFAULT NULL,
  `insurance_no` varchar(50) DEFAULT NULL,
  `insurance_company` varchar(100) DEFAULT NULL,
  `permit_no` varchar(50) DEFAULT NULL,
  `permit_type` varchar(50) DEFAULT NULL,
  `pollution_certificate_no` varchar(50) DEFAULT NULL,
  `gps_device_id` varchar(50) DEFAULT NULL,
  `gps_enabled` tinyint(1) DEFAULT 0,
  `current_odometer_km` decimal(10,2) DEFAULT NULL,
  `ownership_type` enum('owned','leased','contract') DEFAULT 'owned',
  `bus_model` varchar(60) DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 60,
  `status` enum('active','inactive','repair') DEFAULT 'active',
  `route_id` int(11) DEFAULT NULL,
  `fc_number` varchar(40) DEFAULT NULL,
  `fc_expiry` date DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `permit_expiry` date DEFAULT NULL,
  `puc_expiry` date DEFAULT NULL,
  `institution_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bus_locations`
--

CREATE TABLE `bus_locations` (
  `id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `stop_id` int(11) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `license_number` varchar(40) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `route_id` int(11) DEFAULT NULL,
  `employee_code` varchar(20) DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `permanent_address` text DEFAULT NULL,
  `native_place` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `aadhaar_no` varchar(12) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `employment_type` enum('permanent','contract','temporary') DEFAULT NULL,
  `designation` varchar(50) DEFAULT NULL,
  `experience_years` decimal(4,1) DEFAULT NULL,
  `previous_employer` varchar(150) DEFAULT NULL,
  `epf_applicable` tinyint(1) DEFAULT 0,
  `epf_uan_no` varchar(20) DEFAULT NULL,
  `esi_applicable` tinyint(1) DEFAULT 0,
  `esi_no` varchar(30) DEFAULT NULL,
  `license_type` varchar(30) DEFAULT NULL,
  `license_issue_date` date DEFAULT NULL,
  `badge_no` varchar(50) DEFAULT NULL,
  `badge_expiry_date` date DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `emergency_contact_no` varchar(15) DEFAULT NULL,
  `daily_trips` tinyint(4) DEFAULT 2,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('active','leave','suspended','inactive') DEFAULT 'active',
  `institution_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fuel_logs`
--

CREATE TABLE `fuel_logs` (
  `id` int(11) NOT NULL,
  `bus_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `liters` decimal(6,2) NOT NULL,
  `cost` decimal(8,2) DEFAULT NULL,
  `odometer` int(11) DEFAULT NULL,
  `fuel_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institutions`
--

CREATE TABLE `institutions` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `short_name` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_logs`
--

CREATE TABLE `maintenance_logs` (
  `id` int(11) NOT NULL,
  `bus_id` int(11) DEFAULT NULL,
  `service_date` date NOT NULL,
  `service_type` varchar(80) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `odometer` int(11) DEFAULT NULL,
  `next_due_date` date DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `type` varchar(20) DEFAULT 'info',
  `route_id` int(11) DEFAULT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `incharge_id` int(11) DEFAULT NULL,
  `trip_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

CREATE TABLE `routes` (
  `id` int(11) NOT NULL,
  `route_code` varchar(20) NOT NULL,
  `route_name` varchar(120) NOT NULL,
  `initial_point` varchar(120) DEFAULT NULL,
  `initial_time` varchar(20) DEFAULT NULL,
  `origin` varchar(120) NOT NULL,
  `destination` varchar(120) NOT NULL,
  `total_distance` decimal(5,2) NOT NULL DEFAULT 0.00,
  `institution_id` int(11) DEFAULT NULL,
  `shift` varchar(20) DEFAULT 'morning1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stops`
--

CREATE TABLE `stops` (
  `id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `stop_name` varchar(120) NOT NULL,
  `sequence` int(11) NOT NULL,
  `scheduled_time` time DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `student_id` varchar(40) NOT NULL,
  `name` varchar(100) NOT NULL,
  `class_grade` varchar(30) DEFAULT NULL,
  `admission_no` varchar(30) DEFAULT NULL,
  `register_no` varchar(30) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `year_of_study` int(11) DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `student_mobile` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `parent_name` varchar(100) DEFAULT NULL,
  `parent_mobile` varchar(15) DEFAULT NULL,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `status` enum('active','inactive','completed') DEFAULT 'active',
  `rfid_card` varchar(50) DEFAULT NULL,
  `guardian_phone` varchar(15) DEFAULT NULL,
  `parent_user_id` int(11) DEFAULT NULL,
  `route_id` int(11) DEFAULT NULL,
  `stop_id` int(11) DEFAULT NULL,
  `institution_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `bus_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `incharge_id` int(11) DEFAULT NULL,
  `trip_date` date NOT NULL,
  `shift` varchar(20) NOT NULL DEFAULT 'morning',
  `status` enum('scheduled','running','completed') DEFAULT 'scheduled',
  `idle_alert_sent` tinyint(1) DEFAULT 0,
  `last_eta_stop_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_logs`
--

CREATE TABLE `trip_logs` (
  `id` int(11) NOT NULL,
  `bus_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `log_date` date NOT NULL,
  `shift` varchar(10) DEFAULT 'trip1',
  `start_time` datetime DEFAULT NULL,
  `start_km` int(11) DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `end_km` int(11) DEFAULT NULL,
  `end_stop` varchar(120) DEFAULT NULL,
  `start_stop` varchar(120) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `route_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tyres`
--

CREATE TABLE `tyres` (
  `id` int(11) NOT NULL,
  `bus_id` int(11) DEFAULT NULL,
  `tyre_position` varchar(30) DEFAULT NULL,
  `tyre_brand` varchar(50) DEFAULT NULL,
  `tyre_size` varchar(30) DEFAULT NULL,
  `year_of_make` year(4) DEFAULT NULL,
  `tyre_quality` enum('original','second') DEFAULT 'original',
  `serial_no` varchar(50) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `fitted_date` date DEFAULT NULL,
  `fitted_odometer_km` decimal(10,2) DEFAULT NULL,
  `current_km_run` decimal(10,2) DEFAULT NULL,
  `expected_life_km` decimal(10,2) DEFAULT NULL,
  `condition_status` enum('new','good','average','worn') DEFAULT 'new',
  `tyre_status` enum('active','replaced','retreaded','damaged') DEFAULT 'active',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','executive','institution','incharge','driver','parent') NOT NULL DEFAULT 'incharge',
  `institution_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_route_shift` (`route_id`,`shift`),
  ADD KEY `bus_id` (`bus_id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `incharge_id` (`incharge_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_trip_student` (`trip_id`,`student_id`),
  ADD KEY `idx_date` (`attendance_date`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `stop_id` (`stop_id`),
  ADD KEY `marked_by` (`marked_by`);

--
-- Indexes for table `buses`
--
ALTER TABLE `buses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_number` (`registration_number`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `bus_locations`
--
ALTER TABLE `bus_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trip_id` (`trip_id`),
  ADD KEY `stop_id` (`stop_id`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_number` (`license_number`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bus_id` (`bus_id`),
  ADD KEY `driver_id` (`driver_id`);

--
-- Indexes for table `institutions`
--
ALTER TABLE `institutions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bus_id` (`bus_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `route_code` (`route_code`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `stops`
--
ALTER TABLE `stops`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `rfid_card` (`rfid_card`),
  ADD KEY `parent_user_id` (`parent_user_id`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `stop_id` (`stop_id`),
  ADD KEY `institution_id` (`institution_id`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `bus_id` (`bus_id`),
  ADD KEY `driver_id` (`driver_id`),
  ADD KEY `incharge_id` (`incharge_id`);

--
-- Indexes for table `trip_logs`
--
ALTER TABLE `trip_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bus_id` (`bus_id`),
  ADD KEY `driver_id` (`driver_id`);

--
-- Indexes for table `tyres`
--
ALTER TABLE `tyres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bus_id` (`bus_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `buses`
--
ALTER TABLE `buses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bus_locations`
--
ALTER TABLE `bus_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `institutions`
--
ALTER TABLE `institutions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stops`
--
ALTER TABLE `stops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_logs`
--
ALTER TABLE `trip_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tyres`
--
ALTER TABLE `tyres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `assignments_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `assignments_ibfk_4` FOREIGN KEY (`incharge_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`),
  ADD CONSTRAINT `attendance_ibfk_4` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `buses`
--
ALTER TABLE `buses`
  ADD CONSTRAINT `buses_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `buses_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bus_locations`
--
ALTER TABLE `bus_locations`
  ADD CONSTRAINT `bus_locations_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bus_locations_ibfk_2` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`);

--
-- Constraints for table `drivers`
--
ALTER TABLE `drivers`
  ADD CONSTRAINT `drivers_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `drivers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `drivers_ibfk_3` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD CONSTRAINT `fuel_logs_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fuel_logs_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  ADD CONSTRAINT `maintenance_logs_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `routes`
--
ALTER TABLE `routes`
  ADD CONSTRAINT `routes_ibfk_1` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stops`
--
ALTER TABLE `stops`
  ADD CONSTRAINT `stops_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`parent_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `students_ibfk_3` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `students_ibfk_4` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`),
  ADD CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`),
  ADD CONSTRAINT `trips_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  ADD CONSTRAINT `trips_ibfk_4` FOREIGN KEY (`incharge_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `trip_logs`
--
ALTER TABLE `trip_logs`
  ADD CONSTRAINT `trip_logs_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `trip_logs_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tyres`
--
ALTER TABLE `tyres`
  ADD CONSTRAINT `tyres_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL;
--
-- Table structure for table `driver_salaries`
--
CREATE TABLE IF NOT EXISTS `driver_salaries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driver_id` int(11) NOT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `salary_month` varchar(7) NOT NULL,
  `working_days` int(11) NOT NULL DEFAULT 26,
  `present_days` decimal(4,1) NOT NULL DEFAULT 26.0,
  `total_trips` int(11) NOT NULL DEFAULT 0,
  `basic_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `daily_bata_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `bata_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `special_bata` decimal(10,2) NOT NULL DEFAULT 0.00,
  `overtime_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_allowances` decimal(10,2) NOT NULL DEFAULT 0.00,
  `gross_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `advance_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `epf_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `esi_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_deductions` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('pending','paid','partially_paid') NOT NULL DEFAULT 'pending',
  `payment_date` date DEFAULT NULL,
  `payment_mode` enum('cash','bank_transfer','cheque','upi') NOT NULL DEFAULT 'bank_transfer',
  `transaction_ref` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_driver_month` (`driver_id`,`salary_month`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_salary_month` (`salary_month`),
  CONSTRAINT `fk_driver_salaries_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
