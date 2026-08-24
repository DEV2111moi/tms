-- ============================================================
--  Nadar TMHNU, Theni — Transport Management System (v3)
--  MySQL schema + seed data    Run:  mysql -u root -p < db/schema.sql
-- ============================================================
DROP DATABASE IF EXISTS nadar_tms;
CREATE DATABASE nadar_tms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nadar_tms;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','executive','institution','incharge','driver','parent') NOT NULL DEFAULT 'incharge',
  institution_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  short_name VARCHAR(60)
);

CREATE TABLE routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_code VARCHAR(20) NOT NULL UNIQUE,
  route_name VARCHAR(120) NOT NULL,
  origin VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  total_distance DECIMAL(5,2) NOT NULL DEFAULT 0,
  institution_id INT,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

CREATE TABLE stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  stop_name VARCHAR(120) NOT NULL,
  sequence INT NOT NULL,
  scheduled_time TIME,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(30) NOT NULL UNIQUE,
  bus_code VARCHAR(20),
  bus_name VARCHAR(100),
  vehicle_type ENUM('bus','mini_bus','van') DEFAULT 'bus',
  manufacturer VARCHAR(50),
  manufacturing_year YEAR,
  purchase_date DATE,
  fuel_type ENUM('diesel','petrol','cng','electric') DEFAULT 'diesel',
  chassis_no VARCHAR(50),
  engine_no VARCHAR(50),
  bus_photo VARCHAR(255),
  rc_book_file VARCHAR(255),
  insurance_no VARCHAR(50),
  insurance_company VARCHAR(100),
  permit_no VARCHAR(50),
  permit_type VARCHAR(50),
  pollution_certificate_no VARCHAR(50),
  gps_device_id VARCHAR(50),
  gps_enabled BOOLEAN DEFAULT 0,
  current_odometer_km DECIMAL(10,2),
  ownership_type ENUM('owned','leased','contract') DEFAULT 'owned',
  bus_model VARCHAR(60),
  capacity INT NOT NULL DEFAULT 60,
  status ENUM('active','inactive','repair') DEFAULT 'active',
  route_id INT,
  fc_number VARCHAR(40),
  fc_expiry DATE,
  insurance_expiry DATE,
  permit_expiry DATE,
  puc_expiry DATE,
  institution_id INT,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_number VARCHAR(40) NOT NULL UNIQUE,
  license_expiry DATE,
  phone VARCHAR(15),
  route_id INT,
  employee_code VARCHAR(20),
  father_name VARCHAR(100),
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  blood_group VARCHAR(5),
  alternate_mobile VARCHAR(15),
  email VARCHAR(100),
  current_address TEXT,
  permanent_address TEXT,
  native_place VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  aadhaar_no VARCHAR(12),
  photo VARCHAR(255),
  joining_date DATE,
  employment_type ENUM('permanent','contract','temporary'),
  designation VARCHAR(50),
  experience_years DECIMAL(4,1),
  previous_employer VARCHAR(150),
  epf_applicable BOOLEAN DEFAULT 0,
  epf_uan_no VARCHAR(20),
  esi_applicable BOOLEAN DEFAULT 0,
  esi_no VARCHAR(30),
  license_type VARCHAR(30),
  license_issue_date DATE,
  badge_no VARCHAR(50),
  badge_expiry_date DATE,
  emergency_contact_name VARCHAR(100),
  emergency_contact_relation VARCHAR(50),
  emergency_contact_no VARCHAR(15),
  daily_trips TINYINT DEFAULT 2,
  user_id INT,                                     -- linked driver login (users.id)
  status ENUM('active','inactive') DEFAULT 'active',
  institution_id INT,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  class_grade VARCHAR(30),
  admission_no VARCHAR(30),
  register_no VARCHAR(30),
  date_of_birth DATE,
  gender VARCHAR(10),
  department VARCHAR(100),
  course VARCHAR(100),
  year_of_study INT,
  section VARCHAR(10),
  student_mobile VARCHAR(15),
  email VARCHAR(100),
  parent_name VARCHAR(100),
  parent_mobile VARCHAR(15),
  alternate_mobile VARCHAR(15),
  address TEXT,
  photo VARCHAR(255),
  blood_group VARCHAR(5),
  status ENUM('active','inactive','completed') DEFAULT 'active',
  rfid_card VARCHAR(50) UNIQUE,
  guardian_phone VARCHAR(15),
  parent_user_id INT,
  route_id INT,
  stop_id INT,
  institution_id INT,
  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE SET NULL,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  bus_id INT,
  driver_id INT,
  incharge_id INT,
  trip_date DATE NOT NULL,
  shift ENUM('morning','evening') DEFAULT 'morning',
  status ENUM('scheduled','running','completed') DEFAULT 'scheduled',
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (incharge_id) REFERENCES users(id)
);

CREATE TABLE bus_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  stop_id INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id)
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  student_id INT NOT NULL,
  stop_id INT,
  status ENUM('present','absent') NOT NULL DEFAULT 'absent',
  boarding_time TIMESTAMP NULL,
  marked_by INT,
  attendance_date DATE NOT NULL,
  UNIQUE KEY uniq_trip_student (trip_id, student_id),
  INDEX idx_date (attendance_date),
  INDEX idx_student (student_id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id),
  FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- Standing (semester-long) assignment: bus + driver + incharge per route per shift
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  shift ENUM('morning','evening') NOT NULL,
  bus_id INT,
  driver_id INT,                                   -- drivers.id
  incharge_id INT,                                 -- users.id (role incharge)
  UNIQUE KEY uniq_route_shift (route_id, shift),
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (incharge_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Driver trip log: start/end odometer + destination stop reached
CREATE TABLE trip_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT,
  driver_id INT,                                   -- the driver's user id
  log_date DATE NOT NULL,
  shift VARCHAR(10) DEFAULT 'trip1',
  start_time DATETIME,
  start_km INT,
  end_time DATETIME,
  end_km INT,
  end_stop VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Diesel fill entries (litres + cost + odometer + date)
CREATE TABLE fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT,
  driver_id INT,
  liters DECIMAL(6,2) NOT NULL,
  cost DECIMAL(8,2),
  odometer INT,
  fuel_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT,
  service_date DATE NOT NULL,
  service_type VARCHAR(80),
  cost DECIMAL(10,2),
  odometer INT,
  next_due_date DATE,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

CREATE TABLE tyres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT,
  tyre_position VARCHAR(30),
  tyre_brand VARCHAR(50),
  tyre_size VARCHAR(30),
  year_of_make YEAR,
  tyre_quality ENUM('original','second') DEFAULT 'original',
  serial_no VARCHAR(50),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  fitted_date DATE,
  fitted_odometer_km DECIMAL(10,2),
  current_km_run DECIMAL(10,2),
  expected_life_km DECIMAL(10,2),
  condition_status ENUM('new','good','average','worn') DEFAULT 'new',
  tyre_status ENUM('active','replaced','retreaded','damaged') DEFAULT 'active',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  route_id INT,
  institution_id INT,
  incharge_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SEED  (password for ALL demo accounts:  password123)
-- ============================================================
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin Office','admin@nadartms.in','9000000001','$2b$10$Et5FwaEw/L9ckGT8zMzMf.wfmXcWg6bKP/WPIBpFm48.lOQqtJ43u','admin'),
('Murugan (Incharge)','incharge@nadartms.in','9000000002','$2b$10$Et5FwaEw/L9ckGT8zMzMf.wfmXcWg6bKP/WPIBpFm48.lOQqtJ43u','incharge'),
('Selvam (Driver)','driver@nadartms.in','9000000003','$2b$10$Et5FwaEw/L9ckGT8zMzMf.wfmXcWg6bKP/WPIBpFm48.lOQqtJ43u','driver'),
('Lakshmi (Parent)','parent@nadartms.in','9000000004','$2b$10$Et5FwaEw/L9ckGT8zMzMf.wfmXcWg6bKP/WPIBpFm48.lOQqtJ43u','parent'),
('Executive Office','executive@nadartms.in','9000000009','$2b$10$Et5FwaEw/L9ckGT8zMzMf.wfmXcWg6bKP/WPIBpFm48.lOQqtJ43u','executive'),
('Institution Incharge','institution@nadartms.in','9000000010','$2b$10$Et5FwaEw/L9ckGT8zMzMf.wfmXcWg6bKP/WPIBpFm48.lOQqtJ43u','institution');

INSERT INTO institutions (code, name, short_name) VALUES
('INST-ENGG','Nadar Engineering College','Engineering'),
('INST-ARTS','Nadar Arts & Science College','Arts & Science'),
('INST-SCH','Nadar Higher Secondary School','School'),
('INST-POLY','Nadar Polytechnic College','Polytechnic');

INSERT INTO routes (route_code, route_name, origin, destination, total_distance) VALUES
('ROUTE-001','College to Aundipatti','College','Aundipatti',25.00),
('ROUTE-002','College to Kanavilaku','College','Kanavilaku',15.00);

INSERT INTO stops (route_id, stop_name, sequence, scheduled_time, latitude, longitude) VALUES
(1,'College',1,'07:00:00',11.34210000,77.72340000),
(1,'New Bus Stand',2,'07:20:00',11.34560000,77.74520000),
(1,'Kanavilaku',3,'07:40:00',11.35780000,77.76810000),
(1,'Aundipatti',4,'08:30:00',11.36820000,77.78450000),
(2,'College',1,'07:10:00',11.34210000,77.72340000),
(2,'Market Road',2,'07:30:00',11.34900000,77.75100000),
(2,'Kanavilaku',3,'07:55:00',11.35780000,77.76810000);

INSERT INTO buses (registration_number, bus_model, capacity, status, route_id, fc_number, fc_expiry, insurance_expiry, permit_expiry, puc_expiry) VALUES
('TN-59-AB-1234','Ashok Leyland',60,'active',1,'FC-2024-1234',DATE_ADD(CURDATE(),INTERVAL 12 DAY),DATE_ADD(CURDATE(),INTERVAL 95 DAY),DATE_ADD(CURDATE(),INTERVAL 200 DAY),DATE_ADD(CURDATE(),INTERVAL 5 DAY)),
('TN-59-AB-5678','Tata Starbus',55,'active',2,'FC-2024-5678',DATE_ADD(CURDATE(),INTERVAL 140 DAY),DATE_SUB(CURDATE(),INTERVAL 3 DAY),DATE_ADD(CURDATE(),INTERVAL 60 DAY),DATE_ADD(CURDATE(),INTERVAL 90 DAY));

INSERT INTO drivers (name, license_number, license_expiry, phone, route_id, user_id, status) VALUES
('Selvam','TN5920230001',DATE_ADD(CURDATE(),INTERVAL 400 DAY),'9000000003',1,3,'active'),
('Raja','TN5920230002',DATE_ADD(CURDATE(),INTERVAL 20 DAY),'9000000005',2,NULL,'active');

INSERT INTO students (student_id, name, class_grade, rfid_card, guardian_phone, parent_user_id, route_id, stop_id) VALUES
('STU-001','Arjun Sharma','10-A','RF0001','9812300001',4,1,1),
('STU-002','Priya Kumari','10-A','RF0002','9812300002',NULL,1,1),
('STU-003','Arun Verma','9-B','RF0003','9812300003',NULL,1,1),
('STU-004','Sneha Singh','9-B','RF0004','9812300004',NULL,1,2),
('STU-005','Vikram Patel','8-C','RF0005','9812300005',NULL,1,2),
('STU-006','Anjali Das','8-C','RF0006','9812300006',NULL,1,2),
('STU-007','Kavya Reddy','11-A','RF0007','9812300007',NULL,1,3),
('STU-008','Rahul Nair','11-A','RF0008','9812300008',NULL,1,3),
('STU-009','Deepa Menon','7-A','RF0009','9812300009',NULL,1,3),
('STU-010','Karthik Raja','12-B','RF0010','9812300010',NULL,1,4);

INSERT INTO trips (route_id, bus_id, driver_id, incharge_id, trip_date, shift, status) VALUES
(1,1,1,2,CURDATE(),'morning','running'),
(1,1,1,2,CURDATE(),'evening','scheduled');

-- Standing assignments (apply every day until changed)
INSERT INTO assignments (route_id, shift, bus_id, driver_id, incharge_id) VALUES
(1,'morning',1,1,2),
(1,'evening',1,1,2),
(2,'morning',2,2,2),
(2,'evening',2,2,2);

INSERT INTO bus_locations (trip_id, latitude, longitude, stop_id) VALUES
(1,11.34560000,77.74520000,2);

INSERT INTO trip_logs (bus_id, driver_id, log_date, shift, start_time, start_km, end_time, end_km, end_stop) VALUES
(1, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'trip1', DATE_SUB(NOW(), INTERVAL 1 DAY), 45200, DATE_SUB(NOW(), INTERVAL 22 HOUR), 45250, 'Aundipatti'),
(1, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'trip2', DATE_SUB(NOW(), INTERVAL 8 HOUR), 45250, DATE_SUB(NOW(), INTERVAL 6 HOUR), 45276, 'College'),
(2, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'trip1', DATE_SUB(NOW(), INTERVAL 1 DAY), 38010, DATE_SUB(NOW(), INTERVAL 22 HOUR), 38040, 'Kanavilaku');

INSERT INTO fuel_logs (bus_id, driver_id, liters, cost, odometer, fuel_date) VALUES
(1, 3, 40.00, 3800.00, 45250, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(1, 3, 35.50, 3400.00, 45100, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(2, 3, 38.00, 3610.00, 38040, DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Assign demo records to institutions
UPDATE buses   SET institution_id=1 WHERE id=1;
UPDATE buses   SET institution_id=2 WHERE id=2;
UPDATE drivers SET institution_id=1 WHERE id=1;
UPDATE drivers SET institution_id=2 WHERE id=2;
UPDATE students SET institution_id=1 WHERE id IN (1,2,3,4,5);
UPDATE students SET institution_id=3 WHERE id IN (6,7,8,9,10);
UPDATE routes SET institution_id=1 WHERE id=1;
UPDATE routes SET institution_id=2 WHERE id=2;
UPDATE users SET institution_id=1 WHERE id=2;   -- Murugan (incharge) -> Engineering
UPDATE users SET institution_id=1 WHERE id=3;   -- Selvam (driver login)
INSERT INTO maintenance_logs (bus_id, service_date, service_type, cost, odometer, next_due_date, notes) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 40 DAY), 'General service + oil change', 6500.00, 45000, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'Replaced air filter'),
(2, DATE_SUB(CURDATE(), INTERVAL 80 DAY), 'Brake pads + tyre rotation', 9200.00, 31800, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Front brakes');
INSERT INTO tyres (bus_id, tyre_position, tyre_brand, tyre_size, year_of_make, tyre_quality, purchase_date, purchase_price, fitted_date, fitted_odometer_km, current_km_run, expected_life_km, condition_status, tyre_status) VALUES
(1, 'Front Left', 'MRF', '10.00 R20', 2024, 'original', DATE_SUB(CURDATE(), INTERVAL 200 DAY), 18500.00, DATE_SUB(CURDATE(), INTERVAL 195 DAY), 42000, 40000, 60000, 'good', 'active'),
(1, 'Front Right', 'Apollo', '10.00 R20', 2024, 'original', DATE_SUB(CURDATE(), INTERVAL 200 DAY), 18200.00, DATE_SUB(CURDATE(), INTERVAL 195 DAY), 42000, 40000, 60000, 'good', 'active'),
(2, 'Rear Left Outer', 'CEAT', '10.00 R20', 2023, 'second', DATE_SUB(CURDATE(), INTERVAL 400 DAY), 9500.00, DATE_SUB(CURDATE(), INTERVAL 395 DAY), 30000, 55000, 55000, 'worn', 'replaced');
UPDATE users SET institution_id=1 WHERE id=6;
