-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 24, 2026 at 09:36 PM
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
  `shift` enum('morning','evening') NOT NULL,
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

--
-- Dumping data for table `buses`
--

INSERT INTO `buses` (`id`, `registration_number`, `bus_code`, `bus_name`, `vehicle_type`, `manufacturer`, `manufacturing_year`, `purchase_date`, `fuel_type`, `chassis_no`, `engine_no`, `bus_photo`, `rc_book_file`, `insurance_no`, `insurance_company`, `permit_no`, `permit_type`, `pollution_certificate_no`, `gps_device_id`, `gps_enabled`, `current_odometer_km`, `ownership_type`, `bus_model`, `capacity`, `status`, `route_id`, `fc_number`, `fc_expiry`, `insurance_expiry`, `permit_expiry`, `puc_expiry`, `institution_id`) VALUES
(380, 'TML6823', '', '', 'mini_bus', 'ASHOK LAYLAND', '1985', '0000-00-00', 'diesel', 'ATEH176714', 'ALEH40891', '', '', '6.30E+13', 'TATA-AIG', 'TN6021/EIV/TN60/06', '', 'TN06000310007887', '', 0, 0.00, 'owned', 'SEMI SALOON', 45, 'active', NULL, 'TN251024V1628198', '2026-12-03', '2026-08-30', '2026-05-03', '2026-01-22', NULL),
(381, 'TN60A2727', '', '', 'bus', 'ASHOK LAYLAND', '1994', '0000-00-00', 'diesel', 'JUE321162', 'JUE205039', '', '', '6.30E+13', 'TATA-AIG', 'TN6017/EIVTN60/06', '', 'TN06000070025241', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251121V2772110', '2027-01-07', '2026-10-31', '2031-05-03', '2025-11-26', NULL),
(382, 'TN39X4444', '', '', 'bus', 'ASHOK LAYLAND', '2000', '0000-00-00', 'diesel', 'KBE440004', 'BKH138991', '', '', '6.30E+13', 'TATA-AIG', 'TN6014/EIV/TN60/2005', '', 'TN06000310007866', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251013V8349283', '2026-11-12', '2026-08-30', '0000-00-00', '2026-01-21', NULL),
(383, 'TN60AB9597', '', '', 'mini_bus', 'ASHOK LAYLAND', '2017', '0000-00-00', 'diesel', 'MA1HB2TEDH3E14632', 'TEH4E78129', '', '', '6.30E+13', 'TATA-AIG', 'TN6007/TN60/EIB/2017', '', 'TN06000310010556', '', 0, 0.00, 'owned', 'SEMI SALOON', 32, 'active', NULL, 'TN250129V6850507', '2027-02-12', '2026-04-02', '0000-00-00', '2026-11-16', NULL),
(384, 'TN60K2916', '', '', 'bus', 'ASHOK LAYLAND', '2012', '0000-00-00', 'diesel', 'MB1PBEYC0CEWH9378 ', 'WEZ409553 ', '', '', '6.30E+13', 'TATA-AIG', 'TN 6071/TN60/EIB/2012 ', '', 'TN06000310007862', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260221V0183991 ', '0000-00-00', '2026-08-30', '0000-00-00', '2026-01-21', NULL),
(385, 'TN59Z0366', '', '', 'mini_bus', 'ASHOK LAYLAND', '1989', '0000-00-00', 'diesel', 'ALEN230642', 'ALEN106683', '', '', '6.30E+13', 'TATA-AIG', 'TN6013/EIB/TN60/2006', '', 'TN06000310007913', '', 0, 0.00, 'owned', 'SEMI SALOON', 43, 'active', NULL, 'TN260221V0886487', '0000-00-00', '2026-03-08', '2031-05-03', '2026-01-22', NULL),
(386, 'TN60K2336', '', '', 'bus', 'ASHOK LAYLAND', '2012', '0000-00-00', 'diesel', 'MAT412287C0C04171', '21B84044662', '', '', '6.30E+13', 'TATA-AIG', 'TN6059/TN60/EIB/2012', '', 'TN06000310007846', '', 0, 0.00, 'owned', 'SEMI SALOON', 60, 'active', NULL, 'TN260410V9504223', '0000-00-00', '2026-06-29', '2028-08-02', '2026-01-20', NULL),
(387, 'TN60E2028', '', '', 'bus', 'ASHOK LAYLAND', '2008', '0000-00-00', 'diesel', 'FNE656556', 'FNH548234', '', '', '6.30E+13', 'TATA-AIG', 'TN6059/TN60/EIB/2018', '', 'TN06000310007890', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN250906V0998733', '0000-00-00', '2027-06-29', '2028-10-05', '2026-01-22', NULL),
(388, 'TN68Q6363', '', '', 'bus', 'ASHOK LAYLAND', '2015', '0000-00-00', 'diesel', 'MB1PBEYC3FEXS7612', 'FXEZ416989', '', '', '6.30E+13', 'TATA-AIG', 'TN2020-CC-4520C', '', 'TN06000310007868', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN260602V4282168', '2027-06-09', '2026-12-27', '0000-00-00', '2026-01-21', NULL),
(389, 'TN60K1094', '', '', 'mini_bus', 'ASHOK LAYLAND', '2012', '0000-00-00', 'diesel', 'MB1PAEFC7CEWH8900', 'CWHZ109176', '', '', '6.30E+13', 'TATA-AIG', 'TN6041/TN60/EIB/2012', '', 'TN06000310007844', '', 0, 0.00, 'owned', 'SEMI SALOON', 40, 'active', NULL, 'TN260410V7492247', '2027-05-12', '2026-08-30', '0000-00-00', '2026-01-20', NULL),
(390, 'TN31Y7234', '', '', 'bus', 'ASHOK LAYLAND', '1992', '0000-00-00', 'diesel', 'DTE281266', 'CTE161720', '', '', '6.30E+13', 'TATA-AIG', 'TN6035/PEV/TN60/2003', '', 'TN06000310008075', '', 0, 0.00, 'owned', 'SEMI SALOON', 54, 'active', NULL, 'TN251121V7761371', '2026-12-10', '2026-08-30', '2028-10-08', '2026-03-02', NULL),
(391, 'TN45A9054', '', '', 'bus', 'ASHOK LAYLAND', '1992', '0000-00-00', 'diesel', 'MUE271501', 'MUE151890', '', '', '6.30E+13', 'TATA-AIG', 'TN6022/EIV/TN60/2006', '', 'TN06000310008094', '', 0, 0.00, 'owned', 'SEMI SALOON', 57, 'active', NULL, 'TN251013V6333605', '2026-11-05', '2026-08-30', '2031-05-03', '2026-04-02', NULL),
(392, 'TNZ2379', '', '', 'bus', 'ASHOK LAYLAND', '1982', '0000-00-00', 'diesel', 'ALEB143056', 'ACI127687', '', '', '6.30E+13', 'TATA-AIG', 'TN6016/EIV/TN6006', '', 'TN06000310008067', '', 0, 0.00, 'owned', 'SEMI SALOON', 54, 'active', NULL, 'TN251013V4339701', '0000-00-00', '2026-08-30', '0000-00-00', '2026-03-02', NULL),
(393, 'TN60AD2874', '', '', 'mini_bus', 'MAHENDRA ', '2018', '0000-00-00', 'diesel', 'MA1GH2KNHJ3F15219', 'KMJ4F95945', '', '', '6.30E+13', 'TATA-AIG', 'TN6069/TN60/EIB/2018', '', 'TN06000310008068', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN250106V9290052', '0000-00-00', '2027-04-02', '2028-07-10', '2026-03-02', NULL),
(394, 'TN60AD2880', '', '', 'mini_bus', 'MAHENDRA ', '2018', '0000-00-00', 'diesel', 'MA1GH2KNHJ3F15292', 'KNJ4D96026', '', '', '6.30E+13', 'TATA-AIG', 'TN6066/TN60/EIB/2018', '', 'TN06000310007909', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN250128V6677433', '0000-00-00', '2027-04-02', '2028-07-10', '2026-01-22', NULL),
(395, 'TN60AB9594', '', '', 'mini_bus', 'MAHENDRA ', '2017', '0000-00-00', 'diesel', 'MA1HB2TEDH3E14001', 'TEH4D89817', '', '', '', '', 'TN6072/5N60/EIB/2017', '', 'TN06000310007851', '', 0, 0.00, 'owned', 'SEMI SALOON', 32, 'active', NULL, 'TN251014V1517868', '0000-00-00', '0000-00-00', '0000-00-00', '2026-01-20', NULL),
(396, 'TN60K2964', '', '', 'bus', 'ASHOK LAYLAND', '2012', '0000-00-00', 'diesel', 'MB1BPEYC2CEWH9379', 'CWEZ409551', '', '', '6.30E+13', 'TATA-AIG', 'TN6072/TN60/EIB/2012', '', 'TN06000310007865', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260120V7828226', '0000-00-00', '2026-08-30', '0000-00-00', '2026-01-21', NULL),
(397, 'TN60D5376', '', '', 'mini_bus', 'EICHER MOTORS ', '2007', '0000-00-00', 'diesel', '17KF7F156068', 'E483CD7F168036', '', '', '6.30E+13', 'TATA-AIG', 'TN6033/TN60/EIB/2007', '', 'TN06000310009761', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN260120V1801082', '0000-00-00', '2026-08-31', '2027-08-08', '2026-07-21', NULL),
(398, 'TN60F5220', '', '', 'bus', 'ASHOK LAYLAND', '2010', '0000-00-00', 'diesel', 'MB1PEAFC6AETC7907', 'TAH625194', '', '', '6.30E+13', 'TATA-AIG', 'TN6024/TN60/EIB/2010', '', 'TN06000310008091', '', 0, 0.00, 'owned', 'SEMI SALOON', 50, 'active', NULL, 'TN251024V9633537', '0000-00-00', '2026-08-30', '0000-00-00', '2026-04-02', NULL),
(399, 'TN36H6363', '', '', 'bus', 'ASHOK LAYLAND', '2000', '0000-00-00', 'diesel', 'XBE452473', 'YBH153567', '', '', '', '', 'EMPTY', '', 'TN06000070022847', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251013V6347495', '2026-11-12', '0000-00-00', '0000-00-00', '2025-09-07', NULL),
(400, 'TN60F7744', '', '', 'mini_bus', 'SML ISUZZU LTD', '2010', '0000-00-00', 'diesel', 'MBUWEL4XFB0147112', 'SLT3FB140613', '', '', '6.30E+13', 'TATA-AIG', 'TN6060/TN60/EIB/2010', '', 'TN06000070025249', '', 0, 0.00, 'owned', 'SEMI SALOON', 33, 'active', NULL, 'TN251014V7510190', '2026-11-12', '2026-10-29', '0000-00-00', '2025-11-26', NULL),
(401, 'TN60E7345', '', '', 'mini_bus', 'SML ISUZZU LTD', '2009', '0000-00-00', 'diesel', 'MBUWEL4XEC0135190', 'SLTEC128598', '', '', '6.30E+13', 'TATA-AIG', 'TN6048/TN60/EIB/2009', '', 'TN06000310010553', '', 0, 0.00, 'owned', 'SEMI SALOON', 21, 'active', NULL, 'TN25100875311632', '2026-10-08', '2026-10-29', '2029-08-03', '2026-11-16', NULL),
(402, 'TN58A9949', '', '', 'bus', 'ASHOK LAYLAND', '1998', '0000-00-00', 'diesel', 'MZA026091', 'LZE786023', '', '', '6.30E+13', 'TATA-AIG', 'TN6024/EIV/TN60/06', '', 'TN06000310005178', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251011V0976016', '0000-00-00', '2026-09-30', '2031-05-03', '2025-01-26', NULL),
(403, 'TN28AS6699', '', '', 'bus', 'ASHOK LAYLAND', '2014', '0000-00-00', 'diesel', 'MB1PBEFC2EEDM2398', 'EDEZ400771', '', '', '6.30E+13', 'TATA-AIG', 'TN2020-CC-4573C', '', 'TN06000310007873', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN260224V9474766', '0000-00-00', '2026-12-27', '0000-00-00', '2026-01-21', NULL),
(404, 'TN60K2949', '', '', 'bus', 'ASHOK LAYLAND', '2012', '0000-00-00', 'diesel', 'MB1BPEYC5CEWH9375', 'CWEZ409507', '', '', '6.30E+13', 'TATA-AIG', 'TN6074/TN60/EIB/2012', '', 'TN06000310010881', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN250723V9924390', '2026-09-07', '2026-06-29', '0000-00-00', '2027-03-01', NULL),
(405, 'TN60AL6298', '', '', 'mini_bus', 'MAHENDRA ', '2023', '0000-00-00', 'diesel', 'MA1HB2TMHP3F12332', 'TMP4F77502', '', '', '6.30E+13', 'TATA-AIG', 'TN2023-CC-7298J', '', '', '', 0, 0.00, 'owned', 'HARD TOP', 32, 'active', NULL, 'TN251025V9780002', '0000-00-00', '2026-11-22', '2028-12-03', '0000-00-00', NULL),
(406, 'TN60AL6238', '', '', 'mini_bus', 'MAHENDRA ', '2023', '0000-00-00', 'diesel', 'MA1HB2TMHP3F12338', 'PMP4F77492', '', '', '6.30E+13', 'TATA-AIG', 'TN2023-CC-7297J', '', 'TN06000310005971', '', 0, 0.00, 'owned', 'HARD TOP', 32, 'active', NULL, 'TN250125V7771031', '0000-00-00', '2026-11-22', '2028-12-03', '2025-11-11', NULL),
(407, 'TN60L4682', '', '', 'bus', 'ASHOK LAYLAND', '2013', '0000-00-00', 'diesel', 'MB1PBEYC5DEAK7610', 'DAEZ404310', '', '', '6.30E+13', 'TATA-AIG', 'TN6057/TN60/EIB/2013', '', 'TN06000310007869', '', 0, 0.00, 'owned', 'OPEN', 61, 'active', NULL, 'TN250906V0399987', '2026-08-08', '2026-08-30', '2028-08-04', '2026-01-21', NULL),
(408, 'TN59D9039', '', '', 'mini_bus', 'ASHOK LAYLAND', '1994', '0000-00-00', 'diesel', 'JVE321721', 'JVE205277', '', '', '6.30E+13', 'TATA-AIG', 'TN6029/EIV/TN60/2003', '', 'TN06000070023361', '', 0, 0.00, 'owned', 'SEMI SALOON', 34, 'active', NULL, 'TN260120V9825178', '2027-02-01', '2026-06-30', '2028-08-07', '2025-06-08', NULL),
(409, 'TN27J5751', '', '', 'bus', 'ASHOK LAYLAND', '1998', '0000-00-00', 'diesel', 'ZSE403875', 'ZSE295467', '', '', '6.30E+13', 'TATA-AIG', 'TN6020/EIV/TN60/2002', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN26051112612588', '2027-05-10', '2027-06-28', '0000-00-00', '0000-00-00', NULL),
(410, 'TN60AA7034', '', '', 'van', 'TATA MOTORS', '2016', '0000-00-00', 'diesel', 'MAT460010GUF03069', '483DL56FTYJ09402', '', '', '6.30E+13', 'TATA-AIG', 'TN6080/TN60/EIB/2016', '', '', '', 0, 0.00, 'owned', 'SALOON', 14, 'active', NULL, 'TN260702V4245326', '2027-07-12', '2026-08-18', '0000-00-00', '0000-00-00', NULL),
(411, 'TN60E6772', '', '', 'bus', 'ASHOK LAYLAND', '2009', '0000-00-00', 'diesel', 'KXH138578', 'KXH574626', '', '', '6.30E+13', 'TATA-AIG', 'TN6032/TN60/EIB/2009', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN26051132613079', '2027-05-10', '2026-10-29', '2029-07-08', '0000-00-00', NULL),
(412, 'TN49AP6808', '', '', 'bus', 'ASHOK LAYLAND', '2013', '0000-00-00', 'diesel', 'MB1PBEYC1DEVK3797', 'DBEZ401239', '', '', '6.30E+13', 'TATA-AIG', 'TN/60/CC/INS/2018/28', '', 'TN06000310007920', '', 0, 0.00, 'owned', 'BUS', 61, 'active', NULL, 'TN260226V8734965', '0000-00-00', '2027-06-29', '0000-00-00', '2026-01-23', NULL),
(413, 'TN59Z3452', '', '', 'bus', 'ASHOK LAYLAND', '1992', '0000-00-00', 'diesel', 'DTE282667', 'DTE163127', '', '', '6.30E+13', 'TATA-AIG', 'TN6026/EIV/TN60/06', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251014V3520299', '0000-00-00', '2027-06-30', '2031-05-03', '0000-00-00', NULL),
(414, 'TN45AR2337', '', '', 'bus', 'ASHOK LAYLAND', '2010', '0000-00-00', 'diesel', 'MBIPBEHC2AEPD2630', 'PAE127609Z', '', '', '6.30E+13', 'TATA-AIG', 'TN6049/TN60/EIB/2014', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260120V8822587', '2027-02-08', '2027-06-29', '2029-08-06', '0000-00-00', NULL),
(415, 'TN36AY8393', '', '', 'bus', 'ASHOK LAYLAND', '2013', '0000-00-00', 'diesel', 'MB1PBEYC5DEBK4724', 'DBEZ402124', '', '', '6.30E+13', 'TATA-AIG', 'TN6087/TN60/EIB/2017', '', 'TN06000310010554', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN251121V8766551', '0000-00-00', '2026-10-29', '2027-08-10', '2026-11-16', NULL),
(416, 'TN46C2697', '', '', 'bus', 'ASHOK LAYLAND', '2003', '0000-00-00', 'diesel', 'BVE510982', 'BVH239161', '', '', '6.30E+13', 'TATA-AIG', 'TN6070/EIV/TN60/2006', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 57, 'active', NULL, 'TN260211V3476706', '2027-03-12', '2026-06-29', '2031-08-01', '0000-00-00', NULL),
(417, 'TN60E1841', '', '', 'bus', 'ASHOK LAYLAND', '2008', '0000-00-00', 'diesel', 'FNE658179', 'FNH547753', '', '', '6.30E+13', 'TATA-AIG', 'TN6056/TN60/EIB/2008', '', 'TN06000310008059', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251011V0970131', '0000-00-00', '2026-06-29', '0000-00-00', '2026-03-02', NULL),
(418, 'TN30E4488', '', '', 'bus', 'ASHOK LAYLAND', '2001', '0000-00-00', 'diesel', 'XLE467544', 'XLH172225', '', '', '6.30E+13', 'TATA-AIG', 'TN6069/EIV/TN60/2006', '', 'TN06000310007933', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260212V9646645', '0000-00-00', '2027-06-28', '2031-08-01', '2026-01-23', NULL),
(419, 'TN45BB2196', '', '', 'bus', 'ASHOK LAYLAND', '2012', '0000-00-00', 'diesel', 'MB1PBEYC5CEZH7127', 'CXE0407528', '', '', '6.30E+13', 'TATA-AIG', 'TN/60/CC/INS/2019/19', '', 'TN06000310007934', '', 0, 0.00, 'owned', 'BUS', 61, 'active', NULL, 'TN260410V7499063', '0000-00-00', '2026-06-29', '0000-00-00', '2026-01-23', NULL),
(420, 'TN36L6868', '', '', 'bus', 'ASHOK LAYLAND', '1998', '0000-00-00', 'diesel', 'TSE413604', 'TSE304147', '', '', '6.30E+13', 'TATA-AIG', 'TN6034/PEV/TN60/2003', '', 'TN06000310009791', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260120V6803289', '0000-00-00', '2027-06-28', '2028-08-08', '2026-07-26', NULL),
(421, 'TN63AW2316', '', '', 'bus', 'ASHOK LAYLAND', '2013', '0000-00-00', 'diesel', 'MB1PBEYC3DPCG5214', 'DCPZ101176', '', '', '6.30E+13', 'TATA-AIG', 'TN/60/CC/INS/2018/22', '', 'TN06000310007891', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN251010V9869598', '0000-00-00', '2027-06-29', '2028-12-03', '2026-01-22', NULL),
(422, 'TN60AD2919', '', '', 'mini_bus', 'MAHENDRA ', '2018', '0000-00-00', 'diesel', 'MA1GH2KNHJ3F15277', 'KNJ4F96123', '', '', '6.30E+13', 'TATA-AIG', 'TN6060/TN60/EIB/2018', '', 'TN06000310007889', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN241002V1881037', '2026-08-03', '2027-01-30', '2028-07-10', '2026-01-22', NULL),
(423, 'TN60F8616', '', '', 'bus', 'ASHOK LAYLAND', '2010', '0000-00-00', 'diesel', 'MB1PBEHC3AHPB2806', 'PAH634752', '', '', '6.30E+13', 'TATA-AIG', 'TN6069/TN60/EIB/2010', '', 'TN06000310008062', '', 0, 0.00, 'owned', 'BUS', 61, 'active', NULL, 'TN250830V8268617', '2026-09-11', '2027-06-29', '0000-00-00', '2026-03-02', NULL),
(424, 'TN60F9502', '', '', 'bus', 'ASHOK LAYLAND', '2010', '0000-00-00', 'diesel', 'MB1PBEHCXAEPD1810', 'PAE126877Z', '', '', '6.30E+13', 'TATA-AIG', 'TN6083/TN60/EIB/2010', '', 'TN06000310007876', '', 0, 0.00, 'owned', 'BUS', 61, 'active', NULL, 'TN250723V6920320', '0000-00-00', '2027-06-29', '0000-00-00', '2026-01-20', NULL),
(425, 'TN60H2888', '', '', 'van', 'SML MAHENDRA ', '2011', '0000-00-00', 'diesel', 'MBUZT54XEB0146035', 'SLTEB139500', '', '', '6.30E+13', 'TATA-AIG', 'TN603/TN60/EIB/2011', '', 'TN06000310009777', '', 0, 0.00, 'owned', 'SEMI SALOON', 27, 'active', NULL, 'TN251121V2768707', '0000-00-00', '2026-09-12', '2031-02-01', '2026-07-22', NULL),
(426, 'TN60AP3269', '', '', 'bus', 'ASHOK LAYLAND', '2025', '0000-00-00', 'diesel', 'MB1PEECDXRESR4110', 'RSEZ431431', '', '', '6.30E+13', 'TATA-AIG', 'TN2075-CC-8655B', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 58, 'active', NULL, 'EMPTY', '0000-00-00', '2027-01-01', '0000-00-00', '0000-00-00', NULL),
(427, 'TN55H3201', '', '', 'bus', 'ASHOK LAYLAND', '2002', '0000-00-00', 'diesel', 'LME479154', 'MLH189799', '', '', '6.30E+13', 'TATA-AIG', 'TN6071/EIV/TN60/2006', '', 'TN06000310009655', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260221V0782264', '0000-00-00', '2027-01-07', '2031-08-02', '2026-09-07', NULL),
(428, 'TN60AP2643', '', '', 'bus', 'ASHOK LAYLAND', '2025', '0000-00-00', 'diesel', 'MB1PEECD2RESR4036', 'RSEZ431277', '', '', '6.30E+13', 'TATA-AIG', 'TN2025-CC-4724B', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 58, 'active', NULL, 'EMPTY', '0000-00-00', '2027-01-01', '0000-00-00', '0000-00-00', NULL),
(429, 'TN60E1833', '', '', 'bus', 'ASHOK LAYLAND', '2008', '0000-00-00', 'diesel', 'FNE658054', 'FNH546558', '', '', '6.30E+13', 'TATA-AIG', 'TN6055/TN60/EIB/2008', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN250906V0298239', '0000-00-00', '2027-09-29', '0000-00-00', '0000-00-00', NULL),
(430, 'TN54T3399', '', '', 'bus', 'ASHOK LAYLAND', '2019', '0000-00-00', 'diesel', 'MB1PBEHD5KEXE7066', 'KXEZ424423', '', '', '6.30E+13', 'TATA-AIG', 'TN2075-CC-5006K', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN251031V5732166', '0000-00-00', '2026-07-11', '0000-00-00', '0000-00-00', NULL),
(431, 'TN28AP8367', '', '', 'bus', 'ASHOK LAYLAND', '2013', '0000-00-00', 'diesel', 'MB1PBEY69DECK1878', 'CDEZ460156', '', '', '6.30E+13', 'TATA-AIG', 'TN2072-CC-7214A', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260224V7464956', '0000-00-00', '2027-05-01', '0000-00-00', '0000-00-00', NULL),
(432, 'TN34AC8691', '', '', 'bus', 'ASHOK LAYLAND', '2019', '0000-00-00', 'diesel', 'MB1PBEHD1KECE1205', 'KDEZ417392', '', '', '6.30E+13', 'TATA-AIG', 'TN2075-CC-2658K', '', 'TN06000310008718', '', 0, 0.00, 'owned', 'SEMI SALOON', 56, 'active', NULL, 'TN25092963489508', '0000-00-00', '2026-10-25', '0000-00-00', '2026-10-15', NULL),
(433, 'TN60E6860', '', '', 'bus', 'ASHOK LAYLAND', '2009', '0000-00-00', 'diesel', 'LXH138187', 'LXH573418', '', '', '6.30E+13', 'TATA-AIG', 'TN6034/TN60/EIB/2009', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN250724V0092100', '0000-00-00', '2026-09-21', '2029-07-12', '0000-00-00', NULL),
(434, 'TN60B2288', '', '', 'van', 'TATA MOTORS', '2001', '0000-00-00', 'diesel', '357162BYZ805015', '497SPTC31BYZ862209', '', '', '6.30E+13', 'TATA-AIG', 'TN60102/MC/PKM/2006', '', '', '', 0, 0.00, 'owned', 'SALOON', 13, 'active', NULL, 'TN260224V2473584', '2027-04-09', '2026-08-20', '0000-00-00', '0000-00-00', NULL),
(435, 'TN60AA6159', '', '', 'bus', 'Ashok Leyland', '2016', '0000-00-00', 'diesel', 'MB1PAEAD1GEBV1562', 'GBEZ410256', '', '', '6.30E+13', 'TATA AIG', 'TN6047/TN60/EIB/2016', '', 'TN06000310010859', '', 0, 0.00, 'owned', 'SEMISALOON', 52, 'active', NULL, 'TN251025V7784849', '2026-10-05', '2026-10-29', '0000-00-00', '2027-01-01', NULL),
(436, 'TN515652', '', '', 'bus', 'Ashok Leyland', '1995', '0000-00-00', 'diesel', 'LYE347686', 'LYE231525', '', '', '6.30E+13', 'TATA AIG', 'TN6025/EIV/TN60/06', '', 'TN06000310008071', '', 0, 0.00, 'owned', 'SEMISALOON', 54, 'active', NULL, 'TN260224V5462422', '2027-01-10', '2026-08-30', '2031-05-03', '2026-03-02', NULL),
(437, 'TN60F6657', '', '', '', 'Ashok Leyland', '2010', '0000-00-00', 'diesel', 'MBUZT54XFB0146450', 'SLT3EB139624', '', '', '6.30E+13', 'TATA AIG', 'TN6047/TN60/EIB/2010', '', 'TN06000310010552', '', 0, 0.00, 'owned', 'SEMISALOON', 33, 'active', NULL, 'TN251010V2866475', '0000-00-00', '2025-10-29', '0000-00-00', '2026-11-16', NULL),
(438, 'TN59Z3331', '', '', 'bus', 'Ashok Leyland', '1992', '0000-00-00', 'diesel', 'CTE280878', 'CUE640684', '', '', '6.30E+13', 'TATA AIG', 'TN6018/EIV/TN60/06', '', 'TN06000310010558', '', 0, 0.00, 'owned', 'SEMISALOON', 45, 'active', NULL, 'TN251121V1759780', '2026-12-10', '2026-10-31', '2031-05-03', '2026-11-16', NULL),
(439, 'TN60F6850', '', '', 'bus', 'Ashok Leyland', '2010', '0000-00-00', 'diesel', 'MB1PBEHC5AEPD1908', 'PAE126931Z', '', '', '6.30E+13', 'TATA AIG', 'TN6049/TN60/EIB/2010', '', 'TN06000310007941', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN251013V4354917', '2026-10-12', '2027-06-29', '2030-08-03', '2026-01-24', NULL),
(440, 'TN60AA6160', '', '', 'bus', 'Ashok Leyland', '2016', '0000-00-00', 'diesel', 'MB1PAEAD6GEBV2111', 'GBEZ202901', '', '', '6.30E+13', 'TATA AIG', 'TN6043/TN60/EIB/2016', '', 'TN06000310005162', '', 0, 0.00, 'owned', 'SEMISALOON', 52, 'active', NULL, 'TN260410V3495454', '0000-00-00', '2027-01-31', '0000-00-00', '2025-01-24', NULL),
(441, 'TN60E2021', '', '', 'bus', 'Ashok Leyland', '2008', '0000-00-00', 'diesel', 'FNE656347', 'JNH544800', '', '', '6.30E+13', 'TATA AIG', 'TN6060/TN60/EIB/2008', '', 'TN06000310008057', '', 0, 0.00, 'owned', 'SEMISALOON', 59, 'active', NULL, 'TN251013V7337210', '2026-09-07', '2027-06-28', '2028-10-05', '2006-03-02', NULL),
(442, 'TCM1176', '', '', 'bus', 'Ashok Leyland', '1986', '0000-00-00', 'diesel', 'ALEK187185', 'ALEK54129', '', '', '6.30E+13', 'TATA AIG', 'TN6014/EIB/TN60/2006', '', 'TN06000310007853', '', 0, 0.00, 'owned', 'SEMISALOON', 55, 'active', NULL, 'TN251011V0175005', '2006-09-01', '2026-08-30', '2031-05-03', '2026-01-20', NULL),
(443, 'TN63Z7182', '', '', 'bus', 'Ashok Leyland', '1997', '0000-00-00', 'diesel', 'MZA026048', 'LZE286874', '', '', '6.30E+13', 'TATA AIG', 'TN6015/EIB/TN60/2002', '', 'TN06000310007957', '', 0, 0.00, 'owned', 'SEMISALOON', 57, 'active', NULL, 'TN250303V7852207', '2006-02-02', '2026-08-30', '2027-07-04', '2006-01-24', NULL),
(444, 'TN60AB9606', '', '', '', 'Ashok Leyland', '2017', '0000-00-00', 'diesel', 'MA1HB2TEDH3E14701', 'TEH4E78866', '', '', '6.30E+13', 'TATA AIG', 'TN6071/TN60/EIB/2017', '', 'TN06000310007848', '', 0, 0.00, 'owned', 'SEMISALOON', 32, 'active', NULL, 'TN251014V6514963', '0000-00-00', '2006-10-29', '0000-00-00', '2026-01-20', NULL),
(445, 'TN60F6863', '', '', 'bus', 'Ashok Leyland', '2010', '0000-00-00', 'diesel', 'MB1PBEHC7AEPD1215', 'SAE126060Z', '', '', '6.30E+13', 'TATA AIG', 'TN6048/TN60/EIB/2010', '', 'TN06000310009663', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN260224V7460703', '2027-01-03', '2027-06-29', '2030-08-03', '2006-10-07', NULL),
(446, 'TN60D5352', '', '', '', 'Ashok Leyland', '2007', '0000-00-00', 'diesel', '17KF7F156069', 'E483CD7F168037', '', '', '6.30E+13', 'TATA AIG', 'TN6032/TN60/EIB/2007', '', 'TN06000310009760', '', 0, 0.00, 'owned', 'SEMISALOON', 41, 'active', NULL, 'TN260120V2798749', '0000-00-00', '2026-08-30', '2027-08-08', '2027-07-21', NULL),
(447, 'TN60L4927', '', '', 'bus', 'Ashok Leyland', '2013', '0000-00-00', 'diesel', 'MB1PEAFC0DEXL2007', 'DXEZ107828', '', '', '6.30E+13', 'TATA AIG', 'TN6061/TN60/EIB/2013', '', 'TN06000310009656', '', 0, 0.00, 'owned', 'SEMISALOON', 50, 'active', NULL, 'TN260120V3829988', '2026-12-07', '2026-08-30', '2028-10-11', '2026-09-07', NULL),
(448, 'TN60P5186', '', '', '', 'Ashok Leyland', '2015', '0000-00-00', 'diesel', 'MB1PAE1A6FEAS2429', 'FAEZ204503', '', '', '6.30E+13', 'TATA AIG', 'TN6039/TN60/EIB/2015', '', 'TN06000310007906', '', 0, 0.00, 'owned', 'SEMISALOON', 41, 'active', NULL, 'TN260410V8490858', '0000-00-00', '2027-01-31', '0000-00-00', '2026-01-22', NULL),
(449, 'TN60L4672', '', '', 'bus', 'Ashok Leyland', '2013', '0000-00-00', 'diesel', 'MB1PBEYC6DEXL2090', 'DXEZ407300', '', '', '6.30E+13', 'TATA AIG', 'TN6056/TN60/EIB/2013', '', 'TN06000310007940', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN251024V3635784', '0000-00-00', '2026-08-30', '2028-10-04', '2026-01-24', NULL),
(450, 'TN60M4945', '', '', 'bus', 'TATA MOTORS', '2014', '0000-00-00', 'diesel', 'MAT460010EUG02835', '483DL56GVY704217', '', '', '6.30E+13', 'TATA AIG', 'TN6047/TN60/EIB/2014', '', 'TN06000310008084', '', 0, 0.00, 'owned', 'SALOON', 65, 'active', NULL, 'TN260602V4283411', '0000-00-00', '2026-08-18', '2029-10-05', '2026-04-02', NULL),
(451, 'TN60AC9451', '', '', '', 'TATA MOTORS', '2018', '0000-00-00', 'diesel', 'MAT460091JUB01511', '22LDICOR11BRY04138', '', '', '6.30E+13', 'TATA AIG', 'TN6022/TN60/EIB/2018', '', 'TN06000310005225', '', 0, 0.00, 'owned', 'SEMISALOON', 14, 'active', NULL, 'TN260602V1284525', '0000-00-00', '2027-03-31', '0000-00-00', '2025-01-29', NULL),
(452, 'TN60L4898', '', '', 'bus', 'Ashok Leyland', '2013', '0000-00-00', 'diesel', 'MB1PEAFC6DEXL0973', 'DYHZ106645', '', '', '6.30E+13', 'TATA AIG', 'TN6060/TN60/EIB/2013', '', 'TN06000070025270', '', 0, 0.00, 'owned', 'SEMISALOON', 50, 'active', NULL, 'TN251013V6341863', '2026-10-05', '2026-10-29', '2028-08-11', '2015-11-27', NULL),
(453, 'TN63AR0283', '', '', 'bus', 'Ashok Leyland', '2016', '0000-00-00', 'diesel', 'MB1PBEFD8GPYU9111', 'GYPZ129017', '', '', '6.30E+13', 'TATA AIG', 'TN/60/CC/INS/2019/13', '', 'TN06000310009562', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN251121V5770489', '2026-11-06', '2027-06-29', '0000-00-00', '2026-04-07', NULL),
(454, 'TN27Q4757', '', '', 'bus', 'Ashok Leyland', '2000', '0000-00-00', 'diesel', 'FBE445449', 'FBH145695', '', '', '6.30E+13', 'TATA AIG', 'TN6030/EIV/TN60/2003', '', 'TN06000310009155', '', 0, 0.00, 'owned', 'SEMISALOON', 59, 'active', NULL, 'TN260120V6815887', '2026-12-01', '2026-10-31', '2028-08-10', '2026-05-24', NULL),
(455, 'TN57AJ6795', '', '', 'bus', 'Ashok Leyland', '2013', '0000-00-00', 'diesel', 'MB1PBEJC9DEWL2687', 'DWEZ407612', '', '', '6.30E+13', 'TATA AIG', '42/TN60/EIB/2017', '', 'TN06000310008093', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN260410V7454241', '2027-02-09', '2027-06-29', '2027-06-08', '2026-04-02', NULL),
(456, 'TN60E7630', '', '', 'bus', 'Ashok Leyland', '2009', '0000-00-00', 'diesel', 'MBIPBEHC79HFA0683', 'KXH575719', '', '', '6.30E+13', 'TATA AIG', 'TN6051/TN60/EIV/2009', '', 'TN06000310009692', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN250723V5922086', '0000-00-00', '2027-06-29', '0000-00-00', '2026-12-07', NULL),
(457, 'TN28AT7799', '', '', 'bus', 'Ashok Leyland', '2013', '0000-00-00', 'diesel', 'MBIPBEYC9DECK2870', 'DCEZ400032', '', '', '6.30E+13', 'TATA AIG', 'TN/60/CC/INS/2019/12', '', 'TN06000310007901', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN260113V9728833', '0000-00-00', '2027-06-29', '0000-00-00', '2026-01-22', NULL),
(458, 'TN25R4599', '', '', 'bus', 'Ashok Leyland', '2010', '0000-00-00', 'diesel', 'MBIPBEHC9AESD0133', 'SAE125126Z', '', '', '6.30E+13', 'TATA AIG', 'TN6065/60/EIV/2014', '', 'TN06000310007867', '', 0, 0.00, 'owned', 'SEMISALOON', 57, 'active', NULL, 'TN251121V9774484', '0000-00-00', '2027-01-31', '0000-00-00', '2026-01-21', NULL),
(459, 'TN45AS7297', '', '', 'bus', 'Ashok Leyland', '2011', '0000-00-00', 'diesel', 'MB1PBEYC6BEYE8396', 'YBE143046Z', '', '', '6.30E+13', 'TATA AIG', 'TN/60/CC/INS/2019/18', '', 'TN06000070025634', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN251010V2868839', '0000-00-00', '2026-09-21', '0000-00-00', '2025-12-16', NULL),
(460, 'TN60F7218', '', '', 'bus', 'Ashok Leyland', '2010', '0000-00-00', 'diesel', 'MB1PBEHC6AEPD1965', 'PAE126984Z', '', '', '6.30E+13', 'TATA AIG', 'TN6053/TN60/EIV/2010', '', 'TN06000310007921', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN25072253607269', '0000-00-00', '2027-06-29', '2030-08-12', '2026-01-23', NULL),
(461, 'TN60K2958', '', '', 'bus', 'Ashok Leyland', '2012', '0000-00-00', 'diesel', 'MBIPBEYC7CEWH9748', 'CWEZ409854', '', '', '6.30E+13', 'TATA AIG', 'TN6073/TN60/EIV/2012', '', 'TN06000310007888', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN250830V8267978', '2026-06-10', '2027-06-29', '0000-00-00', '2026-01-22', NULL),
(462, 'TN11E7594', '', '', '', 'TATA MOTORS', '2013', '0000-00-00', 'diesel', 'MAT460051DUN06110', '483DLTC55NWY710512', '', '', '481000/31/2026/2654', 'ORIENTAL INSURANCE', 'NO', '', '', '', 0, 0.00, 'owned', 'SALOON', 10, 'active', NULL, 'TN190620V0663008', '0000-00-00', '2026-08-18', '0000-00-00', '0000-00-00', NULL),
(463, 'TN60A3336', '', '', 'bus', 'Ashok Leyland', '1998', '0000-00-00', 'diesel', 'ZSE404386', 'SZE294413', '', '', '6.30E+13', 'TATA AIG', 'TN6019/EIB/TN60/2002', '', 'TN06000310008073', '', 0, 0.00, 'owned', 'SEMISALOON', 59, 'active', NULL, 'TN260221V0281757', '0000-00-00', '2027-06-28', '2027-06-09', '2026-03-02', NULL),
(464, 'TN49AW9981', '', '', 'bus', 'Ashok Leyland', '2011', '0000-00-00', 'diesel', 'MBIPEYC4BHAB9473', 'JAH664545', '', '', '6.30E+13', 'TATA AIG', 'TN6052/TN60/EIB/2014', '', 'TN06000310007876', '', 0, 0.00, 'owned', 'SEMISALOON', 59, 'active', NULL, 'TN260120V4804906', '2026-12-08', '2027-06-29', '2029-08-12', '2026-01-21', NULL),
(465, 'TN34AC9735', '', '', 'bus', 'Ashok Leyland', '2019', '0000-00-00', 'diesel', 'MB1PBEHD4KECE1201', 'KDEZ417390', '', '', '6.30E+13', 'TATA AIG', 'TN2025/CC/2661K', '', 'TN06000310008719', '', 0, 0.00, 'owned', 'SEMISALOON', 56, 'active', NULL, 'TN25092512615413', '0000-00-00', '2026-10-25', '0000-00-00', '2026-10-15', NULL),
(466, 'TN27L4419', '', '', 'bus', 'Ashok Leyland', '1999', '0000-00-00', 'diesel', 'SKE418840', 'LSF305565', '', '', '6.30E+13', 'TATA AIG', 'TN6024/EIV/TN60/2003', '', 'TN06000310007935', '', 0, 0.00, 'owned', 'SEMISALOON', 56, 'active', NULL, 'TN250723V1923369', '2026-06-03', '2027-06-28', '0000-00-00', '2026-01-23', NULL),
(467, 'TN60AC9491', '', '', '', 'TATA MOTORS', '2018', '0000-00-00', 'diesel', 'MAT460091JUB01506', '22LDICOR11BRYJ04150', '', '', '6.30E+13', 'TATA AIG', 'TN6021/TN60/EIB/2018', '', 'TN06000310008153', '', 0, 0.00, 'owned', 'SALOON', 14, 'active', NULL, 'TN240618V1548884', '0000-00-00', '2026-03-31', '0000-00-00', '2026-11-02', NULL),
(468, 'TN29BE7788', '', '', 'bus', 'Ashok Leyland', '2017', '0000-00-00', 'diesel', 'MB1PBEFD3HAEG4025', 'HEEZ408103', '', '', '6.30E+12', 'TATA AIG', 'TN2025/CC/9231K', '', '', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN260410V9501333', '2027-04-02', '2026-07-11', '2030-11-10', '0000-00-00', NULL),
(469, 'TN63CX0322', '', '', 'bus', 'Ashok Leyland', '2022', '0000-00-00', 'diesel', 'MB1PBEHD1NEGH8397', 'NGEZ411984', '', '', '6.30E+13', 'TATA AIG', 'TN2025/CC/2659K', '', 'TN06300150022069', '', 0, 0.00, 'owned', 'SEMISALOON', 56, 'active', NULL, 'TN240819V1537620', '0000-00-00', '2026-10-25', '0000-00-00', '2026-05-25', NULL),
(470, 'TN60P5194', '', '', '', 'Ashok Leyland', '2015', '0000-00-00', 'diesel', 'MB1PAE1A2FEAS2430', 'FAEZ204500', '', '', '6.30E+12', 'TATA AIG', 'TN6041/TN60/EIB/2015', '', 'TN06000310011012', '', 0, 0.00, 'owned', 'SEMISALOON', 41, 'active', NULL, 'TN190530V5894747', '0000-00-00', '2027-02-19', '0000-00-00', '2027-12-01', NULL),
(471, 'TN60F5599', '', '', 'bus', 'Ashok Leyland', '2010', '0000-00-00', 'diesel', 'MB1PBEHC5AEDC5763', 'VAE121390Z', '', '', '6.30E+13', 'TATA AIG', 'TN6035/TN60/EIB/2015', '', '', '', 0, 0.00, 'owned', 'SEMISALOON', 61, 'active', NULL, 'TN250906V0199217', '2026-08-10', '2026-09-21', '2030-07-01', '0000-00-00', NULL),
(472, 'TN86A2559', '', '', 'bus', 'ASHOK LEYLAND LDT', '2015', '0000-00-00', 'diesel', 'MB1PBEYC2FEAS1900', 'FAEZ411911', '', '', '6302528790 01 00', 'TATA AIG', 'TN2020-CC-4571C', '', 'TN06000310007871', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260410V9497299', '0000-00-00', '2026-12-27', '0000-00-00', '2026-01-21', NULL),
(473, 'TN60AA6153', '', '', 'bus', 'ASHOK LEYLAND LTD', '2016', '0000-00-00', 'diesel', 'MB1PAEAD4GABF5933', 'GCEZ409612', '', '', '6.30E+13', 'TATA AIG', 'TN6045/TN60/EIB/2016', '', 'TN06000310008070', '', 0, 0.00, 'owned', 'SEMI SALOON', 52, 'active', NULL, 'TN260410V4508995', '0000-00-00', '2027-01-30', '0000-00-00', '0000-00-00', NULL),
(474, 'TN60AA6152', '', '', 'bus', 'ASHOK LEYLAND LTD', '2016', '0000-00-00', 'diesel', 'MB1PAEAD9GEBV1597', 'GBEZ202781', '', '', '6.30E+13', 'TATA AIG', 'TN6046/TN60/EIB/2016', '', 'TN06000310007875', '', 0, 0.00, 'owned', 'SEMI SALOON', 52, 'active', NULL, 'TN260410V5484994', '0000-00-00', '2027-01-30', '0000-00-00', '0000-00-00', NULL),
(475, 'TN60AD2872', '', '', '', 'MAHENDRA LTD', '2018', '0000-00-00', 'diesel', 'MA1GH2KNHJ3F15220', 'KNJ4E95352', '', '', '6.30E+13', 'TATA AIG', 'TN6068/TN60/EIB/2018', '', 'TN06000310007910', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN250128V9712507', '0000-00-00', '2027-04-02', '2028-07-10', '0000-00-00', NULL),
(476, 'TN60K2359', '', '', 'bus', 'TATA MOTORS LTD', '2012', '0000-00-00', 'diesel', 'MAT412287C0C04155', '21B63235642', '', '', '6.30E+13', 'TATA AIG', 'TN6060/TN60/EIB/2012', '', 'TN06000310007861', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260401C1334298', '0000-00-00', '0000-00-00', '2027-08-02', '0000-00-00', NULL),
(477, 'TN60P5189', '', '', '', 'ASHOK LEYLAND LTD', '2015', '0000-00-00', 'diesel', 'MB1PAE1A0FEY3385', 'FYEZ204785', '', '', '6.30E+13', 'TATA AIG', 'TN6040/TN60/EIB/2015', '', 'TN06000310007863', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN260410V5489315', '0000-00-00', '2027-01-31', '0000-00-00', '0000-00-00', NULL),
(478, 'TN60F5176', '', '', 'bus', 'ASHOK LEYLAND LTD', '2010', '0000-00-00', 'diesel', 'MB1PEAFC0AEVC7326', 'VAH617995', '', '', '6.30E+13', 'TATA AIG', 'TN6023/TN60/EIB/2010', '', 'TN06000310007919', '', 0, 0.00, 'owned', 'SEMI SALOON', 50, 'active', NULL, 'TN251121V4760260', '0000-00-00', '2026-08-30', '0000-00-00', '0000-00-00', NULL),
(479, 'TN60E7353', '', '', 'van', 'SML ISUZU LTD', '2009', '0000-00-00', 'diesel', 'MBUWEL4XEC0135180', 'SLTEC128525', '', '', '6.30E+13', 'TATA AIG', 'TN6047/TN60/EIB/2009', '', 'NO', '', 0, 0.00, 'owned', 'SEMI SALOON', 21, 'active', NULL, 'TN25100875311121', '2026-10-08', '2026-10-29', '2029-08-03', '0000-00-00', NULL),
(480, 'TN60K2369', '', '', 'bus', 'TATA MOTORS LTD', '2012', '0000-00-00', 'diesel', 'MAT412287C0C04170', '21B84044682', '', '', '6.30E+13', 'TATA AIG', 'TN6061/TN60/EIB/2012', '', 'TN06000310008087', '', 0, 0.00, 'owned', 'SEMI SALOON', 60, 'active', NULL, 'TN260410V4507346', '0000-00-00', '2026-08-30', '2027-08-02', '0000-00-00', NULL),
(481, 'TN60AA6139', '', '', 'bus', 'ASHOK LEYLAND LTD', '2016', '0000-00-00', 'diesel', 'MB1PAEAD9GABF5930', 'GCEZ202443', '', '', '6.30E+13', 'TATA AIG', 'TN6044/TN60/EIB/2016', '', 'TN06000070025254', '', 0, 0.00, 'owned', 'SEMI SALOON', 52, 'active', NULL, 'TN251104V1201653', '0000-00-00', '2026-10-29', '0000-00-00', '0000-00-00', NULL),
(482, 'TN60AD2890', '', '', '', 'MAHENDRA LTD', '2018', '0000-00-00', 'diesel', 'MA1GH2KNHJ3F15272', 'KNJ4F96044', '', '', '6.30E+13', 'TATA AIG', 'TN6065/TN60/EIB/2018', '', 'TN06000310007937', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN250129V8849980', '2027-02-12', '2027-04-02', '2028-07-10', '0000-00-00', NULL),
(483, 'TN33D4255', '', '', 'bus', 'ASHOK LEYLAND LTD', '1995', '0000-00-00', 'diesel', 'CYE336111', 'BYE221142', '', '', '6.30E+13', 'TATA AIG', 'TN6027/EIV/TN60/06', '', 'TN06000310008072', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN251121V2767832', '0000-00-00', '2027-06-30', '2031-05-03', '0000-00-00', NULL),
(484, 'TN60AL6292', '', '', '', 'MAHENDRA LTD', '2023', '0000-00-00', 'diesel', 'MA1HB2TMHP3F12397', 'TMP4F79906', '', '', '6.30E+13', 'TATA AIG', 'TN2023-CC-7424J', '', 'TN06000310008933', '', 0, 0.00, 'owned', 'SEMI SALOON', 32, 'active', NULL, 'TN251025V8769722', '0000-00-00', '2026-11-22', '2028-12-04', '2026-10-11', NULL),
(485, 'TN57AU3711', '', '', 'bus', 'ASHOK LEYLAND LTD', '2013', '0000-00-00', 'diesel', 'MB1PBEYC4DPCG4735', 'DCPZ100673', '', '', '6.30E+13', 'TATA AIG', 'TN2022-CC-2353B', '', 'TN06000310008089', '', 0, 0.00, 'owned', 'SEMI SALOON', 54, 'active', NULL, 'TN260226V2734049', '0000-00-00', '2027-06-01', '0000-00-00', '0000-00-00', NULL),
(486, 'TN25AR5859', '', '', 'bus', 'ASHOK LEYLAND LTD', '2016', '0000-00-00', 'diesel', 'MB1PREFD0GEEU5438', 'GEEZ404256', '', '', '6.30E+13', 'TATA AIG', 'TN2023-CC-9352H', '', 'NO', '', 0, 0.00, 'owned', 'SEMI SALOON', 66, 'active', NULL, 'TN2602120V1817630', '2027-02-10', '2026-10-30', '2028-11-02', '0000-00-00', NULL),
(487, 'TN57AJ5260', '', '', 'bus', 'ASHOK LEYLAND LTD', '2013', '0000-00-00', 'diesel', 'MB1PBEJCXDEAK6267', 'DAEZ403248', '', '', '6.30E+13', 'TATA AIG', '29/TN60/SCHOOL/2017', '', 'TN06000310007845', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN260410V7481705', '2027-05-10', '2027-06-29', '2027-04-05', '0000-00-00', NULL),
(488, 'TN55M7777', '', '', 'bus', 'ASHOK LEYLAND LTD', '2000', '0000-00-00', 'diesel', 'KBE440066', 'BKH139197', '', '', '6.30E+13', 'TATA AIG', 'TN6017/EIV/TN60/2005', '', 'TN06000310007939', '', 0, 0.00, 'owned', 'SEMI SALOON', 58, 'active', NULL, 'TN251121V4763387', '0000-00-00', '2027-06-30', '0000-00-00', '0000-00-00', NULL),
(489, 'TN60L4666', '', '', 'bus', 'ASHOK LEYLAND LTD', '2013', '0000-00-00', 'diesel', 'MB1PBEYC9DEXL1998', 'DXEZ407372', '', '', '6.30E+13', 'TATA AIG', 'TN6054/TN60/EIB/2013', '', 'TN06000310007860', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260410V8486524', '2027-05-03', '2027-06-29', '2028-08-04', '0000-00-00', NULL),
(490, 'TN29C5599', '', '', 'bus', 'ASHOK LEYLAND LTD', '1998', '0000-00-00', 'diesel', 'XSE407474', 'XSE299549', '', '', '6.30E+13', 'TATA AIG', 'TN2022-CC-7005B', '', 'TN06000070022802', '', 0, 0.00, 'owned', 'SEMI SALOON', 55, 'active', NULL, 'TN250906V0297840', '0000-00-00', '2026-06-28', '0000-00-00', '0000-00-00', NULL),
(491, 'TN63AU7335', '', '', 'bus', 'ASHOK LEYLAND LTD', '2015', '0000-00-00', 'diesel', 'MB1PBEYC6FEDR5071', 'FDEZ405208', '', '', '6.30E+13', 'TATA AIG', 'TN2022-CC-7788A', '', 'TN06000310007884', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260224V9472433', '2027-03-12', '2027-05-01', '0000-00-00', '0000-00-00', NULL),
(492, 'TN60C6696', '', '', '', 'TATA MOTORS LTD', '2005', '0000-00-00', 'diesel', '357164JUZ821568', '497SPTC35JU879767', '', '', '6.30E+13', 'TATA AIG', 'TN2021-CC-2409A', '', 'TN06000310010559', '', 0, 0.00, 'owned', 'SEMI SALOON', 21, 'active', NULL, 'TN251011V0472698', '0000-00-00', '2027-01-30', '2031-02-01', '2026-11-16', NULL),
(493, 'TN60F7240', '', '', 'bus', 'ASHOK LEYLAND LTD', '2010', '0000-00-00', 'diesel', 'MB1PBEHC2AHPB2845', 'PAH636069', '', '', '6.30E+13', 'TATA AIG', 'TN6054/TN60/EIB/2010', '', 'TN06000310007877', '', 0, 0.00, 'owned', 'SEMI SALOON', 61, 'active', NULL, 'TN251013V3346276', '2026-11-09', '2027-06-29', '2030-08-12', '0000-00-00', NULL),
(494, 'TN60AA7036', '', '', '', 'TATA MOTORS LTD', '2016', '0000-00-00', 'diesel', 'MAT460010GUF03059', '483DL56FTYJ09110', '', '', '6.30E+13', 'TATA AIG', 'TN6081/TN60/EIB/2016', '', 'TN06000310009575', '', 0, 0.00, 'owned', 'SALOON', 14, 'active', NULL, 'TN260702V4243908', '2027-07-05', '2026-08-18', '0000-00-00', '0000-00-00', NULL),
(495, 'TN60L4685', '', '', 'bus', 'ASHOK LEYLAND LTD', '2013', '0000-00-00', 'diesel', 'MB1PBEYC9DEAK7237', 'DAEZ404016', '', '', '6.30E+13', 'TATA AIG', 'TN6055/TN60/EIB/2013', '', 'TN06000310007936', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN260410V1483348', '0000-00-00', '2027-06-29', '2028-08-04', '0000-00-00', NULL),
(496, 'TN60L5599', '', '', 'bus', 'ASHOK LEYLAND LTD', '2013', '0000-00-00', 'diesel', 'MB1PBEHC2DEAK8150', 'DCEZ401136', '', '', '6.30E+13', 'TATA AIG', 'EXPIRY', '', 'TN06000310009620', '', 0, 0.00, 'owned', 'SEMI SALOON', 71, 'active', NULL, 'TN251121V1765354', '0000-00-00', '2027-06-29', '0000-00-00', '0000-00-00', NULL),
(497, 'TN15C5909', '', '', 'bus', 'ASHOK LEYLAND LTD', '2019', '0000-00-00', 'diesel', 'MB1PBEHD8KEED7738', 'KEEZ413153', '', '', '6.30E+13', 'TATA AIG', 'TN2025-CC-6595K', '', 'TN06600110040209', '', 0, 0.00, 'owned', 'SEMI SALOON', 56, 'active', NULL, 'TN250805V5878116', '2027-08-06', '2026-07-11', '2030-11-03', '2026-09-21', NULL),
(498, 'TN46T8199', '', '', 'bus', 'ASHOK LEYLAND LTD', '2016', '0000-00-00', 'diesel', 'MB1PBEFD6GPBU1412', 'GBPZ120791', '', '', '6.30E+13', 'TATA AIG', 'TN2022-CC-4960A', '', 'TN06000310008088', '', 0, 0.00, 'owned', 'SEMI SALOON', 59, 'active', NULL, 'TN26062249094864', '0000-00-00', '2027-05-01', '2027-02-08', '0000-00-00', NULL),
(499, 'TN60AP2611', '', '', 'bus', 'ASHOK LEYLAND LTD', '2025', '0000-00-00', 'diesel', 'MB1PEECD7RESR3996', 'RSEZ431271', '', '', '6.30E+13', 'TATA AIG', 'TN2025-CC-4726B', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 58, 'active', NULL, 'NO', '0000-00-00', '2027-01-01', '0000-00-00', '0000-00-00', NULL),
(500, 'TN60D7497', '', '', '', 'ASHOK LEYLAND LTD', '2007', '0000-00-00', 'diesel', 'XPR155794', 'XPE002495Y', '', '', '6.30E+13', 'TATA AIG', 'TN6058/TN60/EIB/2007', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 45, 'active', NULL, 'TN251121V5775363', '2027-01-05', '2027-06-29', '0000-00-00', '0000-00-00', NULL),
(501, 'TN60AP3263', '', '', 'bus', 'ASHOK LEYLAND LTD', '2024', '0000-00-00', 'diesel', 'MB1PEECD3RESR4112', 'RSEZ431439', '', '', '6.30E+13', 'TATA AIG', 'TN2025-CC-8657B', '', '', '', 0, 0.00, 'owned', 'SEMI SALOON', 58, 'active', NULL, 'NO', '0000-00-00', '2027-01-01', '0000-00-00', '0000-00-00', NULL),
(502, 'TN55AJ5656', '', '', 'bus', 'ASHOK LEYLAND LTD', '2014', '0000-00-00', 'diesel', 'MB1PBEYCXEEBM5671', 'EBEZ404424', '', '', '6.30E+13', 'TATA AIG', 'TN2022-CC-4421A', '', 'TN06000310008077', '', 0, 0.00, 'owned', 'SEMI SALOON', 56, 'active', NULL, 'TN260120V2831928', '2027-02-04', '2027-05-01', '2027-02-06', '0000-00-00', NULL),
(503, 'TN60AD2901', '', '', '', 'MAHENDRA LTD', '2018', '0000-00-00', 'diesel', 'MA1GH2KNHJ3F15273', 'KNJ4F95982', '', '', '6.30E+13', 'TATA AIG', 'TN6067/TN60/EIB/2018', '', 'TN06000070025243', '', 0, 0.00, 'owned', 'SEMI SALOON', 41, 'active', NULL, 'TN241002V7880122', '2026-10-06', '2027-01-31', '2028-07-10', '0000-00-00', NULL);

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

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`id`, `name`, `license_number`, `license_expiry`, `phone`, `route_id`, `employee_code`, `father_name`, `date_of_birth`, `gender`, `blood_group`, `alternate_mobile`, `email`, `current_address`, `permanent_address`, `native_place`, `district`, `state`, `pincode`, `aadhaar_no`, `photo`, `joining_date`, `employment_type`, `designation`, `experience_years`, `previous_employer`, `epf_applicable`, `epf_uan_no`, `esi_applicable`, `esi_no`, `license_type`, `license_issue_date`, `badge_no`, `badge_expiry_date`, `emergency_contact_name`, `emergency_contact_relation`, `emergency_contact_no`, `daily_trips`, `user_id`, `status`, `institution_id`) VALUES
(1, 'GOPAL R', 'TN0719930002659', '2030-11-18', '7418948697', NULL, '', 'RAMAN', '1972-03-11', 'male', 'O+', '', '', 'W-6,ARJUNA ST,KONDAMANAICKANPATTI,ANDIPPATI (TK),THENI  625512', '', 'KONDAMANAICKANPATT', 'THENI', 'TAMILNADU', '625512', '6181 2139 54', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-11-17', '', '0000-00-00', 'TAMILSELVI', 'WIFE', '8015704423', 2, NULL, 'active', NULL),
(2, 'KANNAN K', 'TN6020010000531', '2031-02-02', '9994422164', NULL, '', 'KRISHNADOSS', '1983-05-04', 'male', 'O+', '', '', '15-3-22/1 SUBASCHANRABOSE STREET PALANICHETTIPATTI THENI 625531', '', 'PALANICHETTIPATTI', 'THENI', 'TAMILNADU', '625531', '4260 2195 84', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-01-27', '', '0000-00-00', '', 'WIFE', '9597067164', 2, NULL, 'active', NULL),
(3, 'KARUPPASAMY A', 'TN6020000001553', '2029-09-24', '8220556153', NULL, '', 'ALAGARSAMY', '1977-06-03', 'male', 'O+', '', '', '54/1 NORTH STREET AMMATCHIYAPURAM ANDIPATTI (TK) THENI 625531', '', 'AMACHIYAPURAM ', 'THENI', 'TAMILNADU', '625531', '2641 8356 55', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2000-07-21', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(4, 'KATHIRVELUSAMY K', 'TN3720060009290', '2026-10-11', '9566337238', NULL, '', 'KARUPPAIYA THEVAR', '1982-02-09', 'male', 'A+', '', '', '256, W-1 THANGAMALPURAM,ANDIPATTI (TK),KADAMALAIKUNDU ,THENI 625579', '', 'THANGAMALPURAM', 'THENI', 'TAMILNADU', '625579', '5916 3292 12', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2006-08-14', '', '0000-00-00', 'GURUSHAKTHI', 'WIFE', '9159078238', 2, NULL, 'active', NULL),
(5, 'MURUGESAN A', 'TN6019920000956', '2026-12-01', '8667447350', NULL, '', 'ATHIMOOLAM ', '1974-05-11', 'male', 'B+', '9655653560', '', '99/4W ,CENTRAL BANK STREET ,SRIRANGAPURAM ,THADICHERI,THENI 625534', '', 'SRIRANGAPURAM', 'THENI', 'TAMILNADU', '625534', '9849 9502 17', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1992-06-25', '', '0000-00-00', '', 'DAUGHTER', '807228449', 2, NULL, 'active', NULL),
(6, 'RAGUPATHI S', 'TN0919940000560', '2031-07-15', '9894887613', NULL, '', 'SUBBAIAH', '1972-08-23', 'male', 'B+', '', '', 'D NO 12A ,JILLAMMAN STREET ,ALLINAGARAM,THENI 625531', '', 'ALLINAGARAM', 'THENI', 'TAMILNADU', '625531', '3094 3936 84', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-07-08', '', '0000-00-00', 'CHITRA', 'WIFE', '9790203353', 2, NULL, 'active', NULL),
(7, 'MUTHUPANDI T', 'TN6019940002369', '2030-03-05', '9003360731', NULL, '', 'THANGAIAH', '1972-07-20', 'male', 'O+', '', '', '7/11,VEERAPANDIKATTAPOMMAN STREET ,T.KALLIPATTI ,PERIYAKULAM ,THENI  625601 ', '', 'T.KALLIPATTI', 'THENI', 'TAMILNADU', '625601', '6822 4904 47', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1994-11-03', '', '0000-00-00', 'PANDIYAMMAL M', 'WIFE', '6385801671', 2, NULL, 'active', NULL),
(8, 'MUTHUVEL  S', 'TN6019870000657', '2030-09-03', '9626668049', NULL, '', 'SANNASI', '1967-07-08', 'male', 'O+', '', '', '55/3 VAITHIYANATHA PURAM ,KAMATCHI NAGAR ,VADAKKARAI ,PERIYAKULAM(TK) THENI ,625601', '', ' VAITHIYANATHA PURAM', 'THENI', 'TAMILNADU', '625601', '7668 9436 61', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-08-21', '', '0000-00-00', 'MUTHUBHARATHI S', 'SON', '7418541140', 2, NULL, 'active', NULL),
(9, 'KASI P', 'TN5820010006969', '2030-09-23', '9788656155', NULL, '', 'PAULPANDI ', '1982-03-06', 'male', 'O+', '', '', 'EAST STREET ,CHOKKALINGAPURAM,ANDIPATTI (TK),PALAKOMBAI ,THENI 625512', '', 'CHOKKALINGAPURAM', 'THENI', 'TAMILNADU', '625512', '3485 0825 45', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-09-23', '', '0000-00-00', 'VIGNESH K', 'MACHAN', '9092839548', 2, NULL, 'active', NULL),
(10, 'PAANDEESWARAN S', 'TN5819980006330', '2028-09-28', '9788677439', NULL, '', 'SELVARAJ', '1973-05-09', 'male', 'A1+', '', '', '4TH STREET ,FOREST ROAD THENI ,625531', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '7496 1079 50', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1998-10-22', '', '0000-00-00', 'KAVITHA P ', 'WIFE', '9994839283', 2, NULL, 'active', NULL),
(11, 'PANDIAN P', 'JK0820039028199', '2027-03-09', '8248222151', NULL, '', 'PERUMAL C', '1973-04-09', 'male', 'B+', '', '', '155-2B TC BAZAR STREET BOMMAYAGOUNDANPATTI THENI 625531', '', 'BOMMAYAGOUNDANPATTI', 'THENI ', 'TAMILNADU', '625531', '5981 6701 86', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2023-12-02', '', '0000-00-00', 'SATHYAVAANI', 'WIFE ', '9345473349', 2, NULL, 'active', NULL),
(12, 'PAANDISWARAN S', 'TN6020110006321', '2031-08-16', '7904758438', NULL, '', 'SEKAR', '1992-06-05', 'male', 'B+', '', '', '17 PALLIVASAL  STREET ,VADAGARAI ,PERIYAKULAM ,THENI 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '2444 4016 27', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2011-08-17', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(13, 'PERUMAL M ', 'TN6019980001601', '2027-06-08', '9486258500', NULL, '', 'MAYAKALAI', '1975-06-08', 'male', 'A-', '', '', '267A/W5 JJ COLONY,PERIYAKULAM,ALAGAPURI ,THENI,625523', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625523', '8524 3021 91', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1998-07-09', '', '0000-00-00', 'RAJADURAI', 'SON', '6379519224', 2, NULL, 'active', NULL),
(14, 'PITCHAIMANI K', 'TN6019810000224', '2026-11-16', '9894388726', NULL, '', 'KARUPPIAH', '1960-05-08', 'male', 'A+', '', '', '255,MADURAI ROAD THENI,ARANMANAIPUDHUR VILAKKU,THENI 625531', '', 'THENI ', 'THENI ', 'TAMILNADU', '625531', '5279 8474 01', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1981-03-31', '', '0000-00-00', 'NITHYA', 'DAUGHTER', '9659017339', 2, NULL, 'active', NULL),
(15, 'PRASATH A', 'TN4520070004457', '2027-02-11', '8681884984', NULL, '', 'ANBARASAN', '1988-04-03', 'male', 'O+', '', '', '117/2 RC STREET ,EAST COLONY,KOTTUR  625534', '', 'KOTTUR ', 'THENI', 'TAMILNADU', '625534', '4997 2351 51', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2007-02-12', '', '0000-00-00', 'PRIYA RATCHANA', 'WIFE', '9789518014', 2, NULL, 'active', NULL),
(16, 'MURUGESAN P', 'TN60Z20060001125', '2031-09-22', '9952560399', NULL, '', 'PALANISAMY', '1986-10-01', 'male', 'AB+', '', '', 'W5/33,NANDHA GOPAL STREET,ODAIPATTI,THENI, 625540', '', 'ODAIPATTI', 'THENI', 'TAMILNADU', '625540', '3081 4403 47', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-05-29', '', '0000-00-00', 'PONMALAR', 'MOTHER', '9786270406', 2, NULL, 'active', NULL),
(17, 'SELVARAJ R', 'TN60Z20010001423', '2029-09-22', '8124494285', NULL, '', 'RAMASAMY', '1976-04-12', 'male', '0+', '', '', 'KAMARAJ NAGAR,KAMATCHIPURAM,UTHAMAPALAYAM,THENI(DT) 625520', '', 'KAMATCHIPURAM', 'THENI', 'TAMILNADU', '625520', '5016 1801 25', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2001-09-10', '', '0000-00-00', 'ELANGOVAN', '', '9551957248', 2, NULL, 'active', NULL),
(18, 'SENTHIL R', 'TN6020020001060', '2029-09-24', '9994222319', NULL, '', 'RAMARAJ', '1983-05-05', 'male', 'B+', '', '', '18/3,NERUJI ROAD 2ND CROSS STREET,BOMMAYAGOUNDANPATTI,THENI 625531', '', 'BOMMAYAGOUNDANPATTI', 'THENI', 'TAMILNADU', '625531', '9578 6918 03', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2002-07-03', '', '0000-00-00', 'KAVITHA ', 'WIFE', '9789355171', 2, NULL, 'active', NULL),
(19, 'THANGAM S', 'TN6019970001538', '2030-06-17', '9787156474', NULL, '', 'SAKKANAN', '1979-05-15', 'male', 'A1-', '', '', '3/84,HIGHER SECONDARY STREET THANGAMMALPURAM,KADAMALAI KUNDU,VARUSANADU ,THENI 625579', '', 'THANGAMMALPURAM', 'THENI', 'TAMILNADU', '625579', '6010 0504 27', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-06-10', '', '0000-00-00', 'MUTHUMARI ', 'WIFE', '9342563338', 2, NULL, 'active', NULL),
(20, 'CHELLAMUTHU A', 'TN6019770000289', '2030-11-04', '9994792996', NULL, '', 'ARUNACHALAM', '1995-03-13', 'male', 'A-', '', '', '43/17,PERIYANDUVAR HIGHWAYS,BODINAYAKKANUR ,THENI 625513', '', 'BODINAYACKANUR', 'THENI', 'TAMILNADU', '625513', '2209 2175 67', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-10-24', '', '0000-00-00', 'CHANDIRA C', 'WIFE', '8220148796', 2, NULL, 'active', NULL),
(21, 'VEERAKUMAR R', 'TN6020200004983', '2029-09-18', '9360351156', NULL, '', 'RAJA', '2001-08-18', 'male', 'B+', '', '', '2/3(1),BALAN NAGAR 2ND STREET ,ALLINAGARAM POMMIYANKAVUNDANPATTI,THENI 625531', '', 'ALLINAGARAM', 'THENI', 'TAMILNADU', '625531', '9267 2804 12', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-10-29', '', '0000-00-00', 'RAJADURAI', 'APPA', '8760097750', 2, NULL, 'active', NULL),
(22, 'VEERASHAKTHI M', 'TN58Y2016000354', '2027-07-04', '9786010617', NULL, '', 'MOKKAYAN', '1994-06-06', 'male', 'B+', '', '', '918,PUDHUR ,USILLAMPATTI (TK) USILAMPATTI 625532', '', 'PUDHUR ', 'THENI', 'TAMILNADU', '625532', '9353 1194 91', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2016-03-07', '', '0000-00-00', 'ALLIKODI', 'AMMA', '9159338422', 2, NULL, 'active', NULL),
(23, 'RAYAPPAN A', 'TN6019850000955', '2031-06-09', '9597174124', NULL, '', 'ALEX ANTONY ', '1962-01-01', 'male', 'O+', '6369852477', '', '22,MATHA KOVIL STREET ,THENKARAI ,THENI PERIYAKULAM,625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '7164 8756 05', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-06-10', '', '0000-00-00', 'JENSI', 'DAUGHTER', '6369852477', 2, NULL, 'active', NULL),
(24, 'SHANMUGASUNDARAM P', 'TN5919920007482', '2029-05-07', '9159885506', NULL, '', 'PATCHAIAPPAN', '1974-06-04', 'male', 'A1B+', '', '', '4/88A,WEST STREET PALAKOMBAI ,ANDIPATTI ,625512', '', 'PALAKOMBAI', 'THENI', 'TAMILNADU', '625512', '7130 3264 44', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1992-11-17', '', '0000-00-00', 'RENUKA', 'WIFE', '9159885506', 2, NULL, 'active', NULL),
(25, 'MURUGAN K', 'TN6019950001113', '2027-07-17', '9750115867', NULL, '', 'KOTTAYAN', '1970-06-05', 'male', 'A1+', '', '', '12B/32 12TH STREET ,FOREST ROAD ,THENI 625531A', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '7227 2995 07', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1995-05-19', '', '0000-00-00', 'KASTHOORI', 'WIFE', '8012293523', 2, NULL, 'active', NULL),
(26, 'MANOJ T', 'TN6020210000640', '2027-06-21', '7094717558', NULL, '', 'THANGAPANDI', '2002-05-05', 'male', 'O+', '', '', '9A OTTANAI ,ANDIPATTI(TK),MYALADUMPARAI,  THENI 625579', '', 'MYALADUMPARAI', 'THENI', 'TAMILNADU', '625579', '2124 7972 58', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2021-01-22', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(27, 'VIJAYRAMAN M', 'TN6020020000856', '2027-06-20', '7695959185', NULL, '', 'MOKKAN', '1982-06-13', 'male', 'O+', '', '', '5/130,SUNNAMBU KALAVASAL STREET ,KALLAR ROAD ,VADAKKARAI ,PERIYAKULAM THENI 625601', '', 'PERIYAKULAM', 'THENI ', 'TAMILNADU', '625601', '8214 8379 17', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2002-06-10', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(28, 'PONRAM K', 'TN5719990001941', '2031-01-18', '7871652724', NULL, '', 'KUMAR SANGAN', '1979-04-01', 'male', 'O+', '', '', '4-5-127 WEST STREET ,OLD BATLAGUNDU ,NILAKOTTAI ,BATLAGUNDU,NILAKKOTTAI ,DINDUGAL 624202', '', 'BATLAGUNDU', 'DINDUGAL', 'TAMILNADU', '624202', '9362 3877 14', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-01-12', '', '0000-00-00', 'RAKKAMMAL', 'WIFE', '7871954713', 2, NULL, 'active', NULL),
(29, 'LAKSHMANA RAO R', 'TN57Z19890000663', '2029-08-28', '9087838235', NULL, '', 'RENGASAMI', '1969-07-14', 'male', 'A+', '', '', '73/26W RAMAIYAH KAVUDAR STREET, CUMBUM, UTHAMAPALAYAM, THENI 625516', '', 'CUMBUM', 'THENI', 'TAMILNADU', '625516', '7164 2791 37', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1989-05-31', '', '0000-00-00', 'MANONMANI', 'DAUGHTER', '9385505086', 2, NULL, 'active', NULL),
(30, 'CHANDRAN M', 'TN6019850000638', '2027-06-23', '6383633480', NULL, '', 'MANIKKAM', '1964-05-25', 'male', 'O+', '', '', 'WEST STREET, MANICKAPURAM, KAMARAJAPURAM, BODINAYAKANUR, THENI 625534', '', 'KAMARAJAPURAM', 'THENI', 'TAMILNADU', '625534', '6228 2795 43', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1985-05-08', '', '0000-00-00', 'MANISH NADHI', 'DAUGHTER', '6383633480', 2, NULL, 'active', NULL),
(31, 'VIJAYATHAVAN J', 'TN6020080000001', '2028-01-01', '9003737379', NULL, '', 'JAYAGURU', '1988-07-15', 'male', 'B+', '', '', 'NO 57, ANTHONIYAR KOVIL STREET, VADAKARAI, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '7617 9277 13', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1988-01-02', '', '0000-00-00', 'JAYACHANDRA', 'SISTER', '9677886577', 2, NULL, 'active', NULL),
(32, 'SIVASANKARAN S', 'TN6019930000063', '2027-08-10', '', NULL, '', 'SUBRAMANI', '1960-03-21', 'male', 'A1+', '', '', '22/1, ARUNCHUNATHEVAR LANE, THENKARAI, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '4108 0947 03', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1993-01-18', '', '0000-00-00', 'MEENA S', 'WIFE', '7904402220', 2, NULL, 'active', NULL),
(33, 'SARAVANPANDIAN P', 'SARAVANPANDIANP', '0000-00-00', '9363495355', NULL, '', 'PALRAJ', '0000-00-00', 'male', '', '', '', 'MELA STREET, THEPPAMPATTI, ANDIPATTI, THENI, 625512', '', 'ANDIPATTI', 'THENI', 'TAMILNADU', '625512', '8602 9179 04', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '0000-00-00', '', '0000-00-00', 'DHANALAKSHMI', 'WIFE', '8300564154', 2, NULL, 'active', NULL),
(34, 'SARATHKUMAR P', 'TN6020110004584', '2031-06-01', '9790127386', NULL, '', 'PANDIARAJ', '1991-01-01', 'male', 'O+', '', '', '21, PALLI OADAI STREET, BOMMAYAGOUNDANPATTI, ALLINAGARAM, THENI, 625531', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '7824 2213 30', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2011-06-02', '', '0000-00-00', 'KALEESHWARI', 'WIFE', '9677612320', 2, NULL, 'active', NULL),
(35, 'MOHAMMED ALIJINNAH K', 'TN6019830000042', '2029-07-25', '7867959529', NULL, '', 'KAJAMAIDEEN', '1960-06-07', 'male', 'O+', '', '', '142, BISMILLAH ILLAM, NADAR MEETING HALL, BANGLAMEDU, ALLINAGARAM, THENI 625531', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '2234 0105 41', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1983-01-17', '', '0000-00-00', 'ROJAMMAL', 'WIFE', '8220145376', 2, NULL, 'active', NULL),
(36, 'PUGAZHANTHI RAJA R', 'TN6020190001839', '2039-05-01', '8056939637', NULL, '', 'RAJENDRAN', '1997-03-18', 'male', 'O+', '', '', '162, VAITHIYANATHAPURAM, VADAGARAI, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '6663 9915 52', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2019-05-02', '', '0000-00-00', 'RAJENDRAN', 'FATHER', '9442969968', 2, NULL, 'active', NULL),
(37, 'SURESH C', 'LIC-SURESHC', '0000-00-00', '8124172625', NULL, '', 'CHINNACHAMI', '1982-01-21', 'male', '', '', '', 'NO 15-6-30, KANDIYAMMAN KOVIL STREET, MEENATCHPURAM, BODINAYAKANUR, THENI, 625582', '', 'BODINAYACKANUR', 'THENI', 'TAMILNADU', '625582', '6263 7804 45', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '0000-00-00', '', '0000-00-00', 'PANDISELVI S', 'WIFE', '7695910582', 2, NULL, 'active', NULL),
(38, 'PICHAI RAM M', 'TN6020090003931', '2029-09-18', '9047414466', NULL, '', 'MURUGAN', '1990-04-03', 'male', 'A+', '', '', '4/66, RAMALINGAPURAM, G USILAMPATTI, AUNDIPATTI, THENI, 625531', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625531', '3127 1604 46', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2009-09-29', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(39, 'RAJAMANI', 'TN60Z20020000049', '2031-02-21', '8489829935', NULL, '', 'AYYASAMY', '1982-05-20', 'male', 'B+', '', '', '1A, PON NAGAR, CHINNAMANUR, THENI 625515', '', 'CHINNAMANUR', 'THENI', 'TAMILNADU', '625515', '7617 6494 71', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-02-02', '', '0000-00-00', 'SANTHI', 'WIFE', '9952755251', 2, NULL, 'active', NULL),
(40, 'KARUPANAKUMAR C', 'TN6020070002832', '2027-07-24', '9788729113', NULL, '', 'CHANDRASEKARAN', '1955-09-25', 'male', 'B+', '', '', 'MOOLAKARAI, SATHYA NAGAR, PERIYAKULAM, THENI 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '4604 8414  9', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2007-07-25', '', '0000-00-00', 'MAHALAKSHMI', 'WIFE', '7845114117', 2, NULL, 'active', NULL),
(41, 'MANOHARAN C', 'TN6019970000374', '2029-11-26', '9843329719', NULL, '', 'CHINNASAMY', '1974-06-23', 'male', 'A+', '', '', 'MELA STREET, CHITHARPATTI, ANDIPATTI, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '8081 9776 31', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1997-02-12', '', '0000-00-00', 'PAVITHRA', 'DAUGTHER IN LAW', '6383266940', 2, NULL, 'active', NULL),
(42, 'AZHAGARSAMY R', 'TN5919771000281', '2031-02-07', '7871957449', NULL, '', 'RAJUNAYUDU', '1958-05-15', 'male', 'O+', '', '', 'NO 76, KUPPI NAYAKKAR STREET, ANNANJI POST, VADAPUDHUPATTI, THENI 625531', '', 'VADAPUDHUPATTI', 'THENI', 'TAMILNADU', '625531', '3752 2208 71', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-02-05', '', '0000-00-00', 'CHANDIRA A ', 'WIFE', '7871957449', 2, NULL, 'active', NULL),
(43, 'PALANISAMY K', 'TN6019820000802', '2029-04-04', '9500735793', NULL, '', 'KANDASAMY', '1964-03-04', 'male', 'O+', '', '', 'NO 3/266 JALLIKATTUSTREET, KANDAMANUR, AUNDIPATTY, THENI, 625517', '', 'KANDAMANUR', 'THENI', 'TAMILNADU', '625517', '9393 2484 24', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1982-09-08', '', '0000-00-00', 'MEENATCHI P', 'WIFE', '9791893345', 2, NULL, 'active', NULL),
(44, 'UDHAYAMOORTHI K', 'TN6020120007036', '2032-07-30', '9655343934', NULL, '', 'KARUMAMOORTHY', '1988-09-13', 'male', 'O+', '', '', '5/91, MUTHALAMMAN STREET, SANGAKAUNDANPATTI, UTHAMAPURAM, MADURAI, 625535', '', 'USILAMPATTI', 'MADURAI', 'TAMILNADU', '625535', '4708 2307 45', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2012-07-31', '', '0000-00-00', 'MUTHUMARI ', 'WIFE', '7373404034', 2, NULL, 'active', NULL),
(45, 'SOLAIRAJ A', 'TN602003000729', '2033-12-11', '9965999246', NULL, '', 'ATHIYAPPAN', '1981-09-28', 'male', 'A1B+', '', '', '167/513 FOREST ROAD 6TH STREET, THENI 625531', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '6943 2482 09', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2003-05-08', '', '0000-00-00', 'ARUNA PANDEESWARI', 'WIFE', '9342329020', 2, NULL, 'active', NULL),
(46, 'PRADEEP PANDI P', 'TN5820110008044', '2031-08-21', '8754608504', NULL, '', 'PITCHAI', '1989-11-23', 'male', '', '', '', 'NO 5/317, KEELAMADARAI, NAKKALAPATTI, USILAMPATTI, MADURAI, 625532', '', 'USILAMPATTI', 'MADURAI', 'TAMILNADU', '625532', '8469 8943 28', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-12-18', '', '0000-00-00', 'PITCHAI', 'FATHER', '9626978394', 2, NULL, 'active', NULL),
(47, 'MURUGAN P', 'TN6019840001443', '2025-09-28', '9943121332', NULL, '', 'PERUMALSAMY', '1962-04-26', 'male', 'O+', '', '', 'VADAPUDDHUPATTI, ANNANJI, UNJAMPATTY, THENI, 625531', '', 'VADAPUDHUPATTI', 'THENI', 'TAMILNADU', '625531', '8811 6554 45', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1984-11-30', '', '0000-00-00', 'PREMA M', 'WIFE', '8667658760', 2, NULL, 'active', NULL),
(48, 'RAMCHINNU R', 'TN60201700004685', '2037-06-21', '9344435592', NULL, '', 'RAMARAJ', '1997-12-14', 'male', 'O+', '', '', '12-3-9 A, ANGDEVAR THERU, PULAKKAPATTI, DEVADANAPATTI, PERIYAKULAM (TK), 625602', '', 'DEVADANAPATTI', 'PERIYAKULAM', 'TAMILNADU', '625602', '2222 8571 60', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2017-06-22', '', '0000-00-00', 'SOBANA', 'MOTHER', '9043235693', 2, NULL, 'active', NULL),
(49, 'ESWARAN P', 'TN60Z20160000599', '2033-06-16', '9715556922', NULL, '', 'PANDIAN', '1983-06-16', 'male', 'B+', '', '', '163/W 2, MIDDLE STREET, KARUNAKKAMUTHANPATTI, UTHAMAPALAYAM, THENI, 625516', '', 'UTHAMAPALAYAM', 'THENI', 'TAMILNADU', '625516', '5773 9512 06', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2016-02-12', '', '0000-00-00', 'KOWSALYA', 'WIFE', '9159556922', 2, NULL, 'active', NULL),
(51, 'SARBUDEEN M', 'TN6019790000209', '2031-03-03', '9629176989', NULL, '', 'MASTHAN', '1955-01-01', 'male', 'O+', '', '', 'VIVEKANANTHA STREET, THAMARAIKULKAM, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '7768 7301 12', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-02-09', '', '0000-00-00', 'SOUDHIYA BHANU', 'DAUGHTHER IN LAW', '9600171057', 2, NULL, 'active', NULL),
(52, 'SARAVANASELVAN B', 'TN6019880001510', '2028-08-30', '9442089745', NULL, '', 'BALAKRISHNAN', '1963-02-07', 'male', 'A+', '', '', '17/2, SAMIKULAM 2ND STREET, CHINNAMANUR, UTHAMAPALAYAM (TK), THENI, 625515', '', 'CHINNAMANUR', 'THENI', 'TAMILNADU', '625515', '9819 7713 57', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1988-11-24', '', '0000-00-00', 'GOKILA', 'WIFE', '8610435605', 2, NULL, 'active', NULL),
(53, 'RAMAN M', 'TN6019800000263', '2027-06-05', '9943907218', NULL, '', 'MAYANDI', '1958-06-02', 'male', 'O+', '', '', 'BALAJI NAGAR, AUNDIPATTY, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '7314 1832 28', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-06-11', '', '0000-00-00', 'PANAKODI', 'WIFE', '9843378430', 2, NULL, 'active', NULL),
(54, 'HAKEEM K', 'TN6019840000573', '2030-06-13', '9894188567', NULL, '', 'KASEEM', '1969-01-01', 'male', '', '', '', 'VADAKARAI, KOTTAI MEDU PALLIVASAL STREET, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '5309 9282 78', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-07-07', '', '0000-00-00', 'PALKEES BHANU', 'WIFE', '8220294717', 2, NULL, 'active', NULL),
(55, 'RAJENDRAN M', 'TN6019840000704', '2027-05-17', '9442969968', NULL, '', 'MUTHAIYA', '1959-06-12', 'male', 'A+', '', '', '2/240 B, GANDHIJI NAGAR, ENDAPULI, PERIYAKULAM, THENI, 625604', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625604', '2347 2028 19', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1984-06-30', '', '0000-00-00', 'PUGALENDHI RAJA', 'SON', '8056939637', 2, NULL, 'active', NULL),
(56, 'RAJAPANDI A', 'TN6019800002953', '2030-01-06', '9894458479', NULL, '', 'ALAGUMALAI', '1956-04-24', 'male', 'O+', '', '', 'EAST STREET, DOMBUCHERY, BODINAYAKANUR, THENI, 625582', '', 'DOMBUCHERRY', 'THENI', 'TAMILNADU', '625582', '5374 7902 51', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1980-11-12', '', '0000-00-00', 'ANNAMAYIL', 'WIFE', '8754367920', 2, NULL, 'active', NULL),
(57, 'ABBAS M', 'TN5719730000726', NULL, '8754153452', NULL, NULL, 'MAITHEEN', NULL, 'male', 'B+', NULL, NULL, '41-11, PALLIVASAL STREET, VADAKARAI, PERIYAKULAM, THENI, 625601', NULL, 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '7849 6727 96', NULL, NULL, 'permanent', 'DRIVER', 0.0, NULL, 0, NULL, 0, NULL, 'LMV', NULL, NULL, NULL, 'JAMAAL MAIDEEN', 'SON', '6381039114', 1, 7, 'active', NULL),
(58, 'DEIVENDRAN P', 'KL0719840000582', '2026-08-18', '9655979266', NULL, '', 'PONNUSAMY', '1964-08-03', 'male', 'B+', '', '', 'NO 140 W-1, KAMARAJ NAGAR, KAMATCHIPURAM, UTHAMAPALAYAM, JANGALPATTY, THENI, 625520', '', 'UTHAMAPALAYAM', 'THENI', 'TAMILNADU', '625520', '7464 8277 14', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1984-06-08', '', '0000-00-00', 'NAGAKANI', 'WIFE', '8124729219', 2, NULL, 'active', NULL),
(59, 'SUBBAIYA R', 'TN6019880001144', '2029-09-09', '8489651096', NULL, '', 'RASAIYA', '1955-06-19', 'male', 'B+', '', '', 'NO 343, KANNAMALPURAM, CHINNAMANUR, THENI, 625515', '', 'CHINNAMANUR', 'THENI', 'TAMILNADU', '625515', '3757 5268 39', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1988-09-13', '', '0000-00-00', 'LATHA', 'WIFE', '9514463542', 2, NULL, 'active', NULL),
(60, 'MURUGAN K', 'TN6019920000417', '2029-09-15', '7708803476', NULL, '', 'KULANDIVEL', '1961-04-07', 'male', 'A+', '', '', 'NO 11 14 10, MOOTHADEVAR STREET, BOOTHPUIRAM, BODUINAYAKANUR, THENI, 625531', '', 'BOOTHIPURAM', 'THENI', 'TAMILNADU', '625531', '3665 9208 10', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1992-03-17', '', '0000-00-00', 'GANDHI', 'DAUGHTER', '9500823476', 2, NULL, 'active', NULL),
(61, 'VALAGURU P', 'TN6019810000057', '2027-02-28', '9788746421', NULL, '', 'PERUMAL', '1958-06-05', 'male', 'O+', '', '', '315, SEETHARAMDOSS NAGAR, SAKKAMPATTI, ANDIPATTY, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '2833 7528 40', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1981-01-29', '', '0000-00-00', '', 'WIFE', '9384351948', 2, NULL, 'active', NULL),
(62, 'ANANDHAN P', 'TN6019770005753', '2029-09-12', '9944438362', NULL, '', 'PONNAIYAH', '1953-04-15', 'male', 'O+', '', '', 'NO 123, PERUMALPURAM, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '7633 8936 36', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1977-09-09', '', '0000-00-00', 'RAJAKUMARI', 'WIFE', '9003646140', 2, NULL, 'active', NULL),
(63, 'RAJENDRAN S', 'TN20Z19810000882', '2030-02-16', '7339280982', NULL, '', 'SITHAN', '1957-04-08', 'male', 'A+', '', '', 'NO 22/5A, BANGARU WEST STREET, BODINAYAKANUR, THENI, 625513', '', 'BODINAYACKANUR', 'THENI', 'TAMILNADU', '625513', '6034 5058 05', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1981-10-21', '', '0000-00-00', 'SUGAPRIYA', 'DAUGHTER', '9840442540', 2, NULL, 'active', NULL),
(64, 'GANESAN V', 'TN6019800000027', '2030-12-09', '9524423842', NULL, '', 'VEERAGOUNDAR', '1960-04-27', 'male', 'O+', '', '', 'NO 31/123 B, PAPPAMMALKOVIL BACKSIDE, PAPPAMALPURAM, AUNDIPATTY, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '4443 2855 92', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-11-27', '', '0000-00-00', 'SUJATHA', 'WIFE', '9524423843', 2, NULL, 'active', NULL),
(65, 'BALAMURUGAN S', 'TN6019990002215', '2034-05-31', '9025757156', NULL, '', 'SREMALAI', '1974-06-01', 'male', 'O+', '', '', 'NO 360, VELUDEVAR STREET, MELAPATTY, KADAMALAIKUNDU, AUNDIPATTY, THENI, 625579', '', 'KADAMALAIKUNDU', 'THENI', 'TAMILNADU', '625579', '4782 0113 40', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-07-02', '', '0000-00-00', 'KARTHIGA', 'WIFE', '8608202378', 2, NULL, 'active', NULL),
(66, 'GOVINDHARAJU P', 'TN0919850001887', '2029-12-30', '9092864371', NULL, '', 'PERUMAL', '1951-02-10', 'male', 'O+', '', '', '11-1, RENGASAMY STREET, KULALARPALAYAM, BODINAYAKANUR, THENI, 625513', '', 'BODINAYACKANUR', 'THENI', 'TAMILNADU', '625513', '4618 2868 26', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1985-10-21', '', '0000-00-00', 'RAJATHI', 'WIFE', '8189998532', 2, NULL, 'active', NULL),
(67, 'KARUPPASAMI A', 'TN6020130006416', '2033-09-22', '8248020512', NULL, '', 'AMMAVASAI', '1985-07-14', 'male', 'O+', '', '', '1/64. OTTANAI, THANGAMALPURAM, AUNDIPATTY TALUK, THENI, 625579', '', 'THANGAMALPURAM', 'THENI', 'TAMILNADU', '625579', '8013 6788 95', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2013-09-23', '', '0000-00-00', 'ALEX PANDIYAN', 'SON', '8072693255', 2, NULL, 'active', NULL),
(68, 'CHINNALAGAN A', 'TN6019990001304', '2028-06-12', '9865148876', NULL, '', 'ALAGAR', '1978-06-13', 'male', 'A+', '', '', '237/1/3, WEST STREET, MARAVAPATTI, POTIDHASANPATTI, AUNDIPATTY, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '5147 7977 90', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1999-05-28', '', '0000-00-00', 'ANNALAKSHMI', 'WIFE', '9791525073', 2, NULL, 'active', NULL),
(69, 'BALASUBRAMANIAN R', 'TN6019710000196', '2030-02-10', '9894527905', NULL, '', 'RAMASAMY', '1952-06-25', 'male', 'A+', '', '', '53, GANDHIMANDAPAM, VADUGAPATTI PO, PERIYAKULAM, THENI, 625603', '', 'VADUGAPATTI', 'THENI', 'TAMILNADU', '625603', '8662 2672 54', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1971-06-25', '', '0000-00-00', 'PERUMAL', 'SON', '9618006573', 2, NULL, 'active', NULL),
(70, 'THANGAVELU A', 'TN6019810000691', '2030-08-27', '9566809162', NULL, '', 'ALAGAR SERVAI', '1962-03-25', 'male', 'A+', '', '', 'NO 673, SANJAY GANDHI STREET, PALANICHETTIPATYI, THENI, 625531', '', 'PALANICHETTIPATTI', 'THENI', 'TAMILNADU', '625531', '6866 9083 91', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-08-12', '', '0000-00-00', 'GANDHMATHI', 'WIFE', '8667033164', 2, NULL, 'active', NULL),
(71, 'THANGESWARAN T', 'TN60Z19990013950', '2029-09-11', '9944751012', NULL, '', 'THANGAIAH', '0000-00-00', 'male', 'O+', '', '', 'D NO 99-120/WARD -2, THIRUPATHI STREET, B NAGALAPURAM, BODINAYAKANUR, THENI, 625528', '', 'NAGALAPURAM', 'THENI', 'TAMILNADU', '625528', '5702 6708 48', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1999-01-18', '', '0000-00-00', 'LAKSHMI', 'MOTHER', '9884075478', 2, NULL, 'active', NULL),
(72, 'MOHAN KUMAR K', 'TN6020110002122', '2031-03-14', '9751510643', NULL, '', 'KALIMUTHU', '1988-06-13', 'male', 'O+', '', '', '39/231, W-2 VINAYAGAR KOVIL STREET, MANJINAYAKANPATTI, BOOTHIPURAM, BODINAYKANUR, THENI, 625531', '', 'BOOTHIPURAM', 'THENI', 'TAMILNADU', '625531', '5420 3076 34', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2011-03-15', '', '0000-00-00', 'KALIMUTHU', 'FATHER', '8428251217', 2, NULL, 'active', NULL),
(73, 'NAGENDRAN P', 'TN6020200003609', '2041-12-10', '8870231517', NULL, '', 'PANDI', '2001-12-11', 'male', 'A+', '', '', '1, COLONY MANIKKAPURAM, UPPUKOTTAI, BODINAYAKANUR, THENI 625534', '', 'UPPUKOTTAI', 'THENI', 'TAMILNADU', '625534', '8962 1377 11', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-07-14', '', '0000-00-00', 'MANIKKASELVI', 'WIFE', '8870231517', 2, NULL, 'active', NULL),
(74, 'NANDEESHKUMAR P', 'TN6020220003257', '2042-06-01', '8248907030', NULL, '', 'PARAMASIVAM', '2002-06-02', 'male', 'B+', '', '', 'NO 179, MADHURAPURI COLONY STREET, MADHUPARI COLONY, PERIYAKULAM, ALAGAPURI, THENI, 625523', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625523', '6186 8866 23', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2022-08-08', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(75, 'KARUPPASAMY R', 'TN6020140006878', '2034-10-29', '9025048016', NULL, '', 'RAJA', '1990-04-18', 'male', 'A+', '', '', 'NO 245, PAMPADUMPARAI, PUDHUR, KOVILPARAI, AUNDIAPTTY TA,UK, KADAMALIGUNDU, THENI, 625579', '', 'KADAMALAIKUNDU', 'THENI', 'TAMILNADU', '625579', '9919 3287 36', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-11-06', '', '0000-00-00', 'SUBDARESWARI', 'WIFE', '9025048016', 2, NULL, 'active', NULL),
(76, 'NANDHARAJ V', 'TN6020090003364', '2029-08-19', '9626078652', NULL, '', 'VELUSAMY', '1991-04-25', 'male', 'A1+', '', '', 'NO 4W153, MELA STREET, CHITHTHARPATTI, ANDIPATTY, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '2810 7507 05', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2009-08-20', '', '0000-00-00', 'SIVARANJANI', 'WIFE', '9585587204', 2, NULL, 'active', NULL),
(77, 'KAMARUDEEN S', 'TN6019860001789', '2027-10-10', '9942571850', NULL, '', 'SAHUL HAMEED', '1967-05-10', 'male', 'A+', '', '', 'NO 4/3, SAVVAS LANE, VADAKARAI, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '3638 1922 57', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1986-09-26', '', '0000-00-00', 'SUGADHA BHANU', 'WIFE', '9962980829', 2, NULL, 'active', NULL),
(78, 'SURIYA V', 'KL6920210004672', '2041-07-03', '8590041785', NULL, '', 'VIJAYAN', '2001-02-23', 'male', 'B+', '', '', 'NO 15-1-72 (3), KOTTAIMETTU STREET, BOOTHPURAM, BODINAYAKANUR, THENI, 625531', '', 'BOOTHIPURAM', 'THENI', 'TAMILNADU', '625531', '8120 0784 08', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-12-31', '', '0000-00-00', 'RAJAMANI', 'MOTHER', '7871408034', 2, NULL, 'active', NULL),
(79, 'NAGARAJ S', 'TN63Z20110004372', '2031-09-06', '6369848424', NULL, '', 'SELVARAJ', '1990-05-15', 'male', 'A+', '', '', 'W6, MGR COLONY, MUTHUTHEVANPATTI, VEERPANDI TALUK, THENI, 625534', '', 'MUTHUTHEVENPATTI', 'THENI', 'TAMILNADU', '625534', '4337 6731 11', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-12-18', '', '0000-00-00', 'ABIRAMI', 'WIFE', '6380881791', 2, NULL, 'active', NULL),
(80, 'RAJKUMAR P', 'TN6020140000209', '2034-01-08', '9842974728', NULL, '', 'PICHAIMANI', '1991-05-23', 'male', 'O+', '', '', 'SOUTH STREET, MELAMANJANAYAKANPATTI, AUNDIPATTY, THENI, 625512', '', 'AUNDIPATTY', 'THENI', 'TAMILNADU', '625512', '7402 1476 25', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2014-01-09', '', '0000-00-00', 'RENGARAJ', 'BROTHER', '9788102571', 2, NULL, 'active', NULL),
(81, 'MANOHARAN S', 'TN6019830000626', '2029-11-26', '9488706984', NULL, '', 'SUBBAIAH', '1961-01-01', 'male', 'O+', '', '', '40, VAITHIYANATHAPURAM, VADAKARAI, PERIYAKULAM, THENI, 6255601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '7694 7468 04', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1983-06-21', '', '0000-00-00', 'VEERAMAL', 'WIFE', '7598059339', 2, NULL, 'active', NULL),
(82, 'RAJAGOPAL A', 'TN58Y20180000320', '2038-02-21', '9952431984', NULL, '', 'ALAGARSAMY', '1999-03-05', 'male', 'O+', '', '', 'NO 7/30 EAST STREET, KUMMANATHTHAM, USILAMPATTI TALUK, VAYYAMPATTI, MADURAI, 625537', '', 'USILAMPATTI', 'THENI', 'TAMILNADU', '625537', '2287 5990 43', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2018-02-22', '', '0000-00-00', 'ALAGARSAMY', 'FATHER', '9788924110', 2, NULL, 'active', NULL),
(83, 'SYEED MASOOD M', 'TN76199640171', '2029-04-02', '9788930355', NULL, '', 'MOHAMMED IBRAHIM', '1966-01-10', 'male', 'B+', '', '', '56/12, 1ST STREET, FOREST ROAD, THENI, 625531', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '8034 0832 62', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1996-01-23', '', '0000-00-00', 'BEHAM', 'WIFE', '9842186448', 2, NULL, 'active', NULL),
(84, 'SIVALINGAM P', 'TN5719890002406', '2027-01-02', '', NULL, '', 'PARAMASIVAM', '1966-03-12', 'male', 'O+', '', '', 'KANNAKU MUTHU LANE, THENKARAI, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '8669 2215 01', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '1989-09-14', '', '0000-00-00', 'VIJAYA', 'WIFE', '9842138369', 2, NULL, 'active', NULL),
(86, 'KALIRAJAN S', 'TN582000006770', '2032-02-22', '7094768482', NULL, '', 'SAMPATH', '1980-06-30', 'male', 'O+', '', '', '1/102, KALIAMMAN KOVIL STREET, ARANMANANIPUDHUR, THENI, 626531', '', 'THENI', 'THENI', 'TAMILNADU', '625531', '7220 3097 63', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2000-08-28', '', '0000-00-00', 'ANNALAKSHMI', 'WIFE', '8940611127', 2, NULL, 'active', NULL),
(87, 'RANGASAMY R', 'LIC-RANGASAMYR', '0000-00-00', '9750079558', NULL, '', 'RATHNAGIRI', '1962-06-18', 'male', '', '', '', 'W-5 180, RENGANATHAR KOVIL STREET, SEEPALAKOTTAI, THENI, 625540', '', 'SEEPALAKOTTAI', 'THENI', 'TAMILNADU', '625540', '3934 7175 30', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '0000-00-00', '', '0000-00-00', 'PANDIAMMAL', 'WIFE', '9498810858', 2, NULL, 'active', NULL),
(88, 'SUBRAMANIAN K', 'TN6019810000915', '2027-08-07', '9442725703', NULL, '', 'KOCHADAI', '1955-06-03', 'male', 'B+', '', '', 'NO 41/1, NORTH STREET, AMACHIYAPURAM, AUNDIPATTY TALUK, KUNNUR, THENI, 62531', '', 'KUNNUR', 'THENI', 'TAMILNADU', '625531', '3855 5237 21', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-12-10', '', '0000-00-00', 'KARUPAAYI', 'WIFE', '9442725704', 2, NULL, 'active', NULL),
(89, 'MARIMUTHU K', 'LIC-MARIMUTHUK', '0000-00-00', '8012063365', NULL, '', 'KANDASAMY', '0000-00-00', 'male', '', '', '', '13, PALLIVASAL STREET, VADAKARAI, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '2830 0981 79', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '0000-00-00', '', '0000-00-00', 'RAJAPANDIAN', 'SON', '9500966582', 2, NULL, 'active', NULL),
(90, 'MURUGESAN C', 'LIC-MURUGESANC', '0000-00-00', '9994658062', NULL, '', 'CHIDAMBARAM', '1957-03-20', 'male', '', '', '', '110, ODAI STREET, JEYAMANGALAM, PERIYAKULAM, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '4829 8468 55', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '0000-00-00', '', '0000-00-00', 'SUMATHI', 'WIFE', '8870947699', 2, NULL, 'active', NULL),
(91, 'VIJAYARAJA A', 'TN6020070000417', '2027-01-30', '8072011703', NULL, '', 'ANTONY DAS', '1986-05-26', 'male', 'O+', '', '', '138, NORTH STREET, SATHYANATHAPURAM, PALLAPATTI, KODUVILARPATTI, THENI, 625534', '', 'KODUVILARPATTI', 'THENI', 'TAMILNADU', '625534', '2517 2168 73', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2007-01-31', '', '0000-00-00', 'ANNALAKSHMI', 'WIFE', '9498187394', 2, NULL, 'active', NULL),
(92, 'MANIKKAVASAGAM M', 'TN6019810000503', '2027-08-29', '8015112795', NULL, '', 'MAHALINGAM', '1961-01-16', 'male', 'O+', '', '', '29, KRP NAIDU STREET, VADAKARAI, PERIYAKULAM TALUK, THENI, 625601', '', 'PERIYAKULAM', 'THENI', 'TAMILNADU', '625601', '8502 1006 45', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-10-08', '', '0000-00-00', 'DEVI', 'WIFE', '7639961942', 2, NULL, 'active', NULL),
(93, 'KRISHNAMOORTHY A', 'TN6019980002297', '2033-12-25', '9965867623', NULL, '', 'ALAGARSAMY', '1973-12-26', 'male', 'O+', '', '', '4-27, PILLAIYAR KOVIL STREET, MUTHULAPURAM, POOSARIPATTI POST, SEVAGAMPATTI, DINDIGUL, 624211', '', 'DINDIGUL', 'THENI', 'TAMILNADU', '624211', '9842 8784 93', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2026-01-30', '', '0000-00-00', '', '', '', 2, NULL, 'active', NULL),
(94, 'BOJJAIAH A', 'AP01519840000575', '2030-09-23', '9486262567', NULL, '', 'ALAGARSAMY', '1960-07-10', 'male', 'AB+', '', '', 'NO 31, RI OFFICE WEST STREET -1, BODINAYAKANNUR, THENI, 625513', '', 'BODINAYACKANUR', 'THENI', 'TAMILNADU', '625513', '9463 9896 42', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-09-23', '', '0000-00-00', 'VIJAYAKUMARI', 'WIFE', '8220376063', 2, NULL, 'active', NULL),
(95, 'SIVAKUMAR M', 'TN60Z20100003098', '2032-04-14', '9361552673', NULL, '', 'MUNIYAANDI', '1992-04-15', 'male', 'O+', '', '', 'NO 43 A/3, WEST STREET, RASINGAPURAM POST, BODINAYAKANUR, THENI, 625528', '', 'BODINAYACKANUR', 'THENI', 'TAMILNADU', '625528', '2041 9337 16', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2025-11-25', '', '0000-00-00', 'CHITHRADEVI', 'WIFE', '9344332835', 2, NULL, 'active', NULL),
(96, 'SIVANANDI K', 'TN60Z20040001362', '2034-08-24', '7418191154', NULL, '', 'KARUTHAKANNAN', '1983-05-14', 'male', 'O+', '', '', 'C/39/4, MAALAIAMMALPURAM, CUMBUM, UTHTHAMAPALAYAM, THENI, 625516', '', 'CUMBUM', 'THENI', 'TAMILNADU', '625516', '3731 7824 58', '', '0000-00-00', '', 'DRIVER', 0.0, '', 0, '', 0, '', '', '2004-07-22', '', '0000-00-00', 'SETHUPATHI', 'COUSIN', '8680679895', 2, NULL, 'active', NULL);

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

--
-- Dumping data for table `fuel_logs`
--

INSERT INTO `fuel_logs` (`id`, `bus_id`, `driver_id`, `liters`, `cost`, `odometer`, `fuel_date`, `created_at`) VALUES
(1, NULL, 3, 40.00, 3800.00, 45250, '2026-07-28', '2026-07-29 07:16:48'),
(2, NULL, 3, 35.50, 3400.00, 45100, '2026-07-23', '2026-07-29 07:16:48'),
(3, NULL, 3, 38.00, 3610.00, 38040, '2026-07-28', '2026-07-29 07:16:48');

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

--
-- Dumping data for table `institutions`
--

INSERT INTO `institutions` (`id`, `code`, `name`, `short_name`) VALUES
(1, 'INST-ENGG', 'Nadar Engineering College', 'Engineering'),
(2, 'INST-ARTS', 'Nadar Arts & Science College', 'Arts & Science'),
(3, 'INST-SCH', 'Nadar Higher Secondary School', 'School'),
(4, 'INST-POLY', 'Nadar Polytechnic College', 'Polytechnic');

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

--
-- Dumping data for table `maintenance_logs`
--

INSERT INTO `maintenance_logs` (`id`, `bus_id`, `service_date`, `service_type`, `cost`, `odometer`, `next_due_date`, `notes`, `created_at`) VALUES
(1, NULL, '2026-06-19', 'General service + oil change', 6500.00, 45000, '2026-08-06', 'Replaced air filter', '2026-07-29 07:16:48'),
(2, NULL, '2026-05-10', 'Brake pads + tyre rotation', 9200.00, 31800, '2026-07-26', 'Front brakes', '2026-07-29 07:16:48');

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
  `origin` varchar(120) NOT NULL,
  `destination` varchar(120) NOT NULL,
  `total_distance` decimal(5,2) NOT NULL DEFAULT 0.00,
  `institution_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`id`, `route_code`, `route_name`, `origin`, `destination`, `total_distance`, `institution_id`) VALUES
(1, 'ROUTE 101', 'THIRUMALAPURAM', 'PARK STOP', 'NSCET CLG', 20.00, 1),
(2, 'ROUTE 102', 'BODI', 'ARANMANAI STOP', 'NSCET CLG', 25.00, 1),
(3, 'ROUTE 103', 'CHINNAMANUR', 'G.H STOP', 'NSCET CLG', 35.00, 1),
(4, 'ROUTE 104', 'AUNDIPATTI', 'AUNDIPATTI POLICESTATION', 'NSCET CLG', 19.00, 1),
(5, 'ROUTE 105', 'KOMBAI', 'KOMBAI', 'NSCET CLG', 48.00, 1),
(6, 'ROUTE 106', 'GUDALUR', 'GUDALUR', 'NSCET CLG', 54.00, 1),
(7, 'ROUTE 107', 'PERIYAKULAM', 'JIO SMART POINT', 'NSCET CLG', 6.00, 1),
(8, 'ROUTE 108', 'MOONDRANTHAL', 'MOONDRANTHAL', 'NSCET CLG', 13.00, 1),
(9, 'ROUTE 109', 'VARUSANADU', 'VARUSANADU', 'NSCET CLG', 65.00, 1),
(10, 'ROUTE 110', 'VEERAPANDI', 'VEERAPANDI', 'NSCET CLG', 13.00, 1),
(11, 'ROUTE 111', 'USILAMPATTY', 'TELC STOP', 'NSCET CLG', 96.00, 1),
(12, 'ROUTE 112', 'T.SUBBULAPURAM', 'T.SUBBULAPURAM', 'NSCET CLG', 23.00, 1),
(13, 'ROUTE 113', 'BOOTHIPURAM', 'BOOTHIPURAM', 'NSCET CLG', 14.00, 1),
(14, 'ROUTE 114', 'MT-PATTI', 'MT-PATTI', 'NSCET CLG', 13.00, 1),
(15, 'ROUTE 115', 'SAMATHARMAPURAM', 'OLD REGISTER OFFICE', 'NSCET CLG', 5.00, 1),
(16, 'ROUTE 116', 'ALLINAGARAM', 'ALLINAGARAM', 'NSCET CLG', 5.00, 1),
(17, 'ROUTE 117', 'ODAIPATTY', 'SEEPALAKOTTAI', 'NSCET CLG', 25.00, 1),
(18, 'ROUTE 118', 'KK PATTI', 'KK PATTI', 'NSCET CLG', 52.00, 1),
(19, 'ROUTE 119', 'JAYAMANGALAM', 'JAYAMANGALAM', 'NSCET CLG', 19.00, 1),
(20, 'ROUTE 120', 'AYYAMPALAYAM', 'AYYAMPALAYAM', 'NSCET CLG', 47.00, 1),
(21, 'ROUTE 121', 'FOREST ROAD', 'NS BOYS SCHOOL', 'NSCET CLG', 5.00, 1),

(22, 'ROUTE-201', 'AUNDIPATTI - SUBBULAPURAM', 'SUBBULAPURAM', 'T.M.H.N.U. SCHOO', 0.00, 3),
(26, 'ROUTE-202', 'AUNDIPATTI - MUDALAKKAMPATTI', 'MUDALAKKAMPATTI', 'T.M.H.N.U. SCHOO', 0.00, 3),
(30, 'ROUTE-203', 'SEDAPATTI - PERUMALKOILPATTI', 'SEDAPATTI', 'T.M.H.N.U. SCHOO', 0.00, 3),
(32, 'ROUTE-205', 'paalakombai', 'G.Usilamapatti ', 'TMHNU Muthuthevanpatti', 25.00, 3),
(38, 'ROUTE-204', 'SODAPATTI - T.M.H.N.U. SCHOOL', 'SODAPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(42, 'ROUTE-206', 'ARASU NAGAR - T.M.H.N.U. SCHOOL', 'ARASU NAGAR', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(43, 'ROUTE-207', 'ALAMARAM - T.M.H.N.U. SCHOOL', 'ALAMARAM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(44, 'ROUTE-208', 'ELLAPATTI - T.M.H.N.U. SCHOOL', 'ELLAPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(45, 'ROUTE-209', 'KOTTUR - T.M.H.N.U. SCHOOL', 'KOTTUR', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(46, 'ROUTE-210', 'ARANMANAIPUDUR - T.M.H.N.U. SCHOOL', 'ARANMANAIPUDUR MEEN KADAI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(47, 'ROUTE-211', 'UPPARPATTI - T.M.H.N.U. SCHOOL', 'UPPARPATTI 1ST STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(48, 'ROUTE-212', 'PERIYAKULAM - T.M.H.N.U. SCHOOL', 'MARIAMMAN PADITHURAI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(49, 'ROUTE-213', 'ALLINAGARAM - T.M.H.N.U. SCHOOL', 'SUKKUVADANPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(50, 'ROUTE-214', 'BODI - T.M.H.N.U. SCHOOL', 'PARK', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(51, 'ROUTE-215', 'P.C. PATTI OUTER - T.M.H.N.U. SCHOOL', 'MARUTHI BAKERY', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(52, 'ROUTE-216', 'THENI LOCAL (EDUSAT) - T.M.H.N.U. SCHOOL', 'PUGAZH COFFEE BAR', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(53, 'ROUTE-217', 'THEVARAM - T.M.H.N.U. SCHOOL', 'THEVARAM BUS STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(54, 'ROUTE-218', 'THENI LOCAL (COLLEGE VAN) - T.M.H.N.U. SCHOOL', 'THIRUPATHI STORE', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(55, 'ROUTE-219', 'AUNDIPATTI - T.M.H.N.U. SCHOOL', 'SEDAPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(56, 'ROUTE-220', 'ODAIPATTI - T.M.H.N.U. SCHOOL', 'SUKKANGALPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(57, 'ROUTE-221', 'CHINNAMANUR - T.M.H.N.U. SCHOOL', 'POLICE QUARTERS', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(58, 'ROUTE-222', 'RATHINAM NAGAR - T.M.H.N.U. SCHOOL', 'RATION SHOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(59, 'ROUTE-223', 'ALLINAGARAM - T.M.H.N.U. SCHOOL', 'B.G. PATTI PILLAYAR KOVIL STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(60, 'ROUTE-224', 'R.M.T.C. COLONY [V2] - T.M.H.N.U. SCHOOL', 'AISHWARYA APARTMENT', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(61, 'ROUTE-225', 'R.M.T.C. COLONY [V1] - T.M.H.N.U. SCHOOL', 'WORKSHOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(62, 'ROUTE-226', 'VEERAPANDI - T.M.H.N.U. SCHOOL', 'WELL STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(63, 'ROUTE-227', 'KODANGIPATTI - T.M.H.N.U. SCHOOL', 'SUBRAMANI KOVIL', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(64, 'ROUTE-228', 'HOSTEL - T.M.H.N.U. SCHOOL', 'HOSTEL', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(65, 'ROUTE-229', 'ARASU NAGAR - T.M.H.N.U. SCHOOL', 'ARASU NAGAR', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(66, 'ROUTE-230', 'BOYS SCHOOL GATE - T.M.H.N.U. SCHOOL', 'BOYS SCHOOL GATE', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(67, 'ROUTE-231', 'UPPARPATTI - T.M.H.N.U. SCHOOL', 'UPPARPATTI MAHAL', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(68, 'ROUTE-232', 'SIVAJI NAGAR - T.M.H.N.U. SCHOOL', 'WORKSHOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(69, 'ROUTE-233', 'G.H - T.M.H.N.U. SCHOOL', 'THIRUPATHI STORE', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(70, 'ROUTE-234', 'TELEPHONE NAGAR - T.M.H.N.U. SCHOOL', 'TELEPHONE NAGAR I STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(71, 'ROUTE-235', 'VISWASAPURAM - T.M.H.N.U. SCHOOL', 'MANIKKAPURAM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(72, 'ROUTE-236', 'AMACHIYAPURAM - T.M.H.N.U. SCHOOL', 'AMACHIYAPURAM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(73, 'ROUTE-237', 'KANDAMANUR - T.M.H.N.U. SCHOOL', 'MEENACHIPURAM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(74, 'ROUTE-238', 'BOOTHIPURAM - T.M.H.N.U. SCHOOL', 'VEERALAKSHMI NAGAR', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(75, 'ROUTE-239', 'R.M.T.C. COLONY - T.M.H.N.U. SCHOOL', 'VINAYAGAR KOVIL', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(76, 'ROUTE-240', 'AUNDIPATTI - BALAKOMBAI - T.M.H.N.U. SCHOOL', 'G. USILAMPATTI STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(77, 'ROUTE-241', 'PERIYAKULAM - T.M.H.N.U. SCHOOL', 'STATE BANK COLONY', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(78, 'ROUTE-242', 'PERIYAKULAM - SENGULATHUPATTI - T.M.H.N.U. SCHOOL', 'SENGULATHUPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(79, 'ROUTE-243', 'JAYAMANGALAM - VADUGAPATTI - T.M.H.N.U. SCHOOL', 'JAYAMANGALAM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(80, 'ROUTE-244', 'BODI - SUBBURAJ NAGAR - T.M.H.N.U. SCHOOL', 'POLICE QUARTERS, KATTABOMMAN STATUE', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(81, 'ROUTE-245', 'BODI - CPA COLLEGE - T.M.H.N.U. SCHOOL', 'C.P.A. COLLEGE', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(82, 'ROUTE-246', 'BODI - MEENACHIPURAM - T.M.H.N.U. SCHOOL', 'MEENACHIPURAM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(83, 'ROUTE-247', 'CHINNAMANUR (GIRLS) - T.M.H.N.U. SCHOOL', 'ROYAL BAKERY', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(84, 'ROUTE-248', 'ERASAI - CHINNAMANUR - T.M.H.N.U. SCHOOL', 'ERASAI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(85, 'ROUTE-249', 'CHINNAMANUR (BOYS) - T.M.H.N.U. SCHOOL', 'MIN NAGAR', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(86, 'ROUTE-250', 'THEVARAM - KOMBAI - T.M.H.N.U. SCHOOL', 'KOMBAI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(87, 'ROUTE-251', 'CUMBUM - T.M.H.N.U. SCHOOL', 'CUMBUM', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(88, 'ROUTE-252', 'IRASINGAPURAM - T.M.H.N.U. SCHOOL', 'DHARMATHUPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(89, 'ROUTE-253', 'PERUMAL GOUNDANPATTI - T.M.H.N.U. SCHOOL', 'PERUMAL GOUNDANPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(90, 'ROUTE-254', 'PULIKUTHI - NAGALAPURAM - T.M.H.N.U. SCHOOL', 'PULIKUTHI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(91, 'ROUTE-255', 'ODAIPATTI - T.M.H.N.U. SCHOOL', 'SUKKANGALPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(92, 'ROUTE-256', 'KAMATCHIPURAM - T.M.H.N.U. SCHOOL', 'SUKKANGALPATTI', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(93, 'ROUTE-257', 'KADAMALAIKUNDU - T.M.H.N.U. SCHOOL', 'VARUSANADU', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(94, 'ROUTE-258', 'KANDAMANUR - T.M.H.N.U. SCHOOL', 'SAMATHUVAPURAM STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(95, 'ROUTE-259', 'POOTHIPURAM - T.M.H.N.U. SCHOOL', 'HIGH SCHOOL 1ST STOP', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(96, 'ROUTE-260', 'MULLAINAGAR - T.M.H.N.U. SCHOOL', 'TEMPLE CITY', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(97, 'ROUTE-261', 'KODUVILARPATTI - BANGALAMEDU - T.M.H.N.U. SCHOOL', 'SOWDAMBAL TEMPLE', 'T.M.H.N.U. SCHOOL', 0.00, 3),
(98, 'ROUTE-262', 'VADAPUDUPATTI - T.M.H.N.U. SCHOOL', 'MADURAPURI', 'T.M.H.N.U. SCHOOL', 0.00, 3);

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

--
-- Dumping data for table `stops`
--

INSERT INTO `stops` (`id`, `route_id`, `stop_name`, `sequence`, `scheduled_time`, `latitude`, `longitude`) VALUES
(8, 1, 'PARK STOP', 1, '08:00:00', 10.01332773, 77.35547360),
(9, 1, 'BODI OLD BUSSTAND', 2, '08:00:00', 10.00843163, 77.34986049),
(10, 1, 'THIRUMALAPURAM', 3, '08:00:00', 10.01650863, 77.35186913),
(11, 1, 'KAMARAJAR STATUE', 4, '08:00:00', 10.00637134, 77.35793817),
(12, 1, 'MEENAVILAKU', 5, '08:00:00', 10.00281855, 77.38120430),
(13, 1, 'KODANGIPATTI', 6, '08:00:00', 9.99476607, 77.41789674),
(14, 1, 'MARIYAMMAN KOVIL PATTI', 7, '09:00:00', 9.99321000, 77.44972177),
(15, 1, 'NSCET CLG', 8, '09:00:00', 10.03030145, 77.50697454),
(16, 2, 'ARANMANAI STOP', 1, '08:00:00', 9.06468741, 77.59170374),
(17, 2, 'PERUMAL KOVIL STOP', 2, '08:00:00', 9.06468741, 77.59170374),
(18, 2, 'NEW BUS STAND', 4, '08:00:00', 10.00862106, 77.34954438),
(19, 2, 'PANKAJAM PGHSS STOP', 5, '08:00:00', 10.00632475, 77.34880617),
(20, 2, 'KRISHNA NAGAR STOP', 6, '08:00:00', 10.01038989, 77.35063717),
(21, 2, 'POLICE STATION STOP', 3, '08:00:00', 10.00862106, 77.34954438),
(22, 2, 'RANGANATHAPURAM STOP', 7, '08:00:00', 9.99634326, 77.34712094),
(23, 2, 'MC PURAM STOP', 8, '08:00:00', NULL, NULL),
(24, 2, 'NSCET CLG', 9, '09:00:00', 10.03032258, 77.50694236),
(25, 3, 'G.H STOP ', 1, '08:00:00', 9.84537788, 77.38581787),
(26, 3, 'VOC ITI', 2, '08:00:00', 9.84247217, 77.38427674),
(27, 3, 'MUTHALAMMAN KOVIL STOP', 3, '08:00:00', 9.84180804, 77.38431949),
(28, 3, 'OM SAKTHI MEDICAL STOP', 4, '08:00:00', 9.84317430, 77.37996552),
(29, 3, 'GANDHI SILAI STOP', 5, '08:00:00', 9.84109154, 77.37934350),
(30, 3, 'CHURCH STOP', 6, '08:00:00', 9.85015163, 77.38313348),
(31, 3, 'NSCET CLG', 7, '09:00:00', 10.03032258, 77.50694236),
(32, 4, 'AUNTIPATTI POLICESTATION', 1, '08:00:00', 9.99951940, 77.62262999),
(33, 4, 'APOLLO PHRAMACY', 2, '08:00:00', 9.99881632, 77.62041880),
(34, 4, 'AVUDAYACHI MAHAL', 3, '08:00:00', 10.00022294, 77.61593590),
(35, 4, 'KANAVILAKU', 4, '08:00:00', 10.00747347, 77.56094895),
(36, 4, 'NSCET CLG', 5, '09:00:00', 10.03032258, 77.50694236),
(37, 5, 'KOMABI', 1, '07:00:00', 9.84885945, 77.29505376),
(38, 5, 'METTUPATTI', 2, '07:00:00', 9.88403325, 77.28596577),
(39, 5, 'THEVARAM', 3, '07:00:00', 9.89671649, 77.28140601),
(40, 5, 'AZHAGARNAYAKKANPATTI', 4, '07:00:00', 9.90407423, 77.30851626),
(41, 5, 'SANGARAPURAM', 5, '08:00:00', 9.90971923, 77.33184126),
(42, 5, 'THIMMINAYAKKANPATTI VILAKU', 6, '08:00:00', 9.92759492, 77.33153562),
(43, 5, 'RASINGAPURAM', 7, '08:00:00', 9.94448492, 77.33632340),
(44, 5, 'SILAMALAI', 8, '08:00:00', 9.96215397, 77.33875934),
(45, 5, 'SILLAMARATHUPATTI', 9, '08:00:00', 9.97307055, 77.35332358),
(46, 5, 'DHARMATHUPPATTI', 10, '08:00:00', 9.99016586, 77.35077977),
(47, 5, 'MEENAKSHIPURAM', 11, '08:00:00', 10.01077781, 77.36109819),
(48, 5, 'NSCET CLG', 12, '09:00:00', 10.03032258, 77.50694236),
(49, 6, 'GUDALUR', 1, '08:00:00', 9.68194147, 77.24483064),
(50, 6, 'KULLALAR MAHAL', 2, '08:00:00', 9.73373566, 77.28329940),
(51, 6, 'YUVARAJA THEATRE ', 3, '08:00:00', 9.73316758, 77.28238105),
(52, 6, 'GANDHI SILAI ', 4, '08:00:00', 9.73615534, 77.28368044),
(53, 6, 'CUMBUM SIGNAL ', 5, '08:00:00', 9.73872489, 77.28439149),
(54, 6, ' POLICE STATION ', 6, '08:00:00', 9.74081958, 77.28540103),
(55, 6, 'PUDHUPATTAI ', 7, '08:00:00', 9.76063973, 77.30258006),
(56, 6, 'HANUMANTHANPATTI ', 8, '08:00:00', 9.78804008, 77.31794496),
(57, 6, 'AMMAPATTI ', 9, '08:00:00', 9.83766323, 77.34118073),
(58, 6, 'ELLAPATTI ', 10, '08:00:00', 9.84169361, 77.34641663),
(59, 6, 'MARKAYANKOTTAI ', 11, '08:00:00', 9.87180858, 77.35042630),
(60, 6, 'KUCHANUR ', 12, '08:00:00', 9.87679591, 77.37459565),
(61, 6, 'KOOLAIYANUR ', 13, '08:00:00', 9.90887556, 77.38844343),
(62, 6, 'PALARPATTI ', 14, '08:00:00', 9.93811674, 77.39988058),
(63, 6, 'UPPUKOTTAI ', 15, '08:00:00', 9.95756042, 77.40815874),
(64, 6, 'MANIKAPURAM ', 16, '08:00:00', 9.96750185, 77.41774182),
(65, 6, 'SADAYALPATTI ', 17, '08:00:00', 9.97135277, 77.42676920),
(66, 6, 'NSCET CLG', 18, '09:00:00', 10.03032258, 77.50694236),
(67, 7, 'JIO SMART POINT', 1, '08:00:00', 10.12808013, 77.55063238),
(68, 7, 'RMTC DEPO', 2, '08:00:00', 10.12552538, 77.54901114),
(69, 7, 'CSI CHURCH', 3, '08:00:00', 10.12376035, 77.54763480),
(70, 7, 'NSCET CLG', 4, '09:00:00', 10.03032258, 77.50694236),
(71, 8, 'MOONDRANTHAL', 1, '08:00:00', 10.11995749, 77.54582714),
(72, 8, 'LAKSHMIPURAM ', 2, '08:00:00', 10.07586394, 77.51668640),
(73, 8, 'NSCET CLG', 3, '09:00:00', 10.03016938, 77.50703891),
(74, 9, 'VARUSANADU', 1, '07:00:00', 9.72768902, 77.51634649),
(75, 9, 'MAYILADUMPARAI', 2, '07:00:00', 9.78771762, 77.51410344),
(76, 9, 'KUMANANTHOLU	', 3, '07:00:00', 9.75507419, 77.47123142),
(77, 9, 'KADAMALAILkUNDU', 4, '07:00:00', 9.81124835, 77.50371222),
(78, 9, 'KUPPINAYAKANPATTI', 5, '08:00:00', 9.87680457, 77.48773839),
(79, 9, 'K.LAKSHMIPURAM	', 6, '08:00:00', 10.07587649, 77.51737508),
(80, 9, 'SOLAITHEVANPATTI	', 7, '08:00:00', 9.79406595, 77.56560139),
(81, 9, 'KANDAMANUR	', 8, '08:00:00', 9.92032410, 77.52238109),
(82, 9, 'PONNAMALPATTI	', 9, '08:00:00', 9.94131867, 77.52787744),
(83, 9, 'SUBBULAPURAM	', 10, '08:00:00', 10.00799307, 77.65104163),
(84, 9, 'KANAVILAKKU', 11, '08:00:00', 10.00726279, 77.56105006),
(85, 9, 'THIRUMALAPURAM	', 12, '08:00:00', 10.03376415, 77.50662574),
(86, 9, 'KUNNUR	', 13, '08:00:00', 10.02638236, 77.47592156),
(87, 9, 'NSCET CLG', 14, '09:00:00', 10.03016938, 77.50703891),
(88, 10, 'VEERAPANDI', 1, '08:00:00', 9.96710473, 77.43495137),
(89, 10, 'VAYALPATTI	', 2, '08:00:00', 9.97376854, 77.46487834),
(90, 10, 'CHATHIRAPATTI	', 3, '08:00:00', 9.99774674, 77.47872205),
(91, 10, 'MULLAINAGAR	', 4, '08:00:00', 9.99265147, 77.48586786),
(92, 10, 'ARANMANAI PUDHUR	', 5, '08:00:00', 10.00030736, 77.48867051),
(93, 10, 'ARANMANAIPUDUR VILAKKU	', 6, '08:00:00', 10.00545306, 77.48864973),
(94, 10, 'NSCET CLG', 7, '09:00:00', 10.03016938, 77.50703891),
(95, 11, 'TELC STOP ', 1, '07:00:00', 9.96075014, 77.78843274),
(96, 11, 'MALAIYANDI THEATRE ', 2, '07:00:00', 9.96502074, 77.79476618),
(97, 11, 'KANNAN THEATRE ', 3, '07:00:00', 9.96580272, 77.79100311),
(98, 11, ' MURUGAN TEMPLE', 4, '07:00:00', 9.96582207, 77.78675606),
(99, 11, 'RC SCHOOL STOP', 5, '07:00:00', 9.96759246, 77.78293740),
(100, 11, 'NSCET CLG', 6, '09:00:00', 10.03016938, 77.50703891),
(101, 12, 'T.SUBBULAPURAM', 1, '08:00:00', 10.00923083, 77.65252762),
(102, 12, 'KONDAMANAYAKAN PATTY', 2, '08:00:00', 10.00260275, 77.62999064),
(103, 12, 'BSNL STOP', 3, '08:00:00', 10.00311046, 77.63123567),
(104, 12, 'VAARUNI HOSPITAL', 4, '08:00:00', 10.00111532, 77.61881948),
(105, 12, 'ANJANAYAR KOVIL', 5, '08:00:00', 10.00066522, 77.61228407),
(106, 12, 'RANGANATHAPURAM	', 6, '08:00:00', 10.00451655, 77.58311582),
(107, 12, 'MUTHANAM PATTY', 7, '08:00:00', 10.00668660, 77.56749351),
(108, 12, 'NSCET CLG', 8, '09:00:00', 10.03016938, 77.50703891),
(109, 13, 'BOOTHIPURAM ', 1, '08:00:00', 10.00575008, 77.44633230),
(110, 13, 'URAVINMURAI OFFICE ', 2, '08:00:00', 10.01085759, 77.47693548),
(111, 13, 'STATE BANK ', 3, '08:00:00', 10.00766591, 77.47330526),
(112, 13, 'VANI SWEETS ', 4, '08:00:00', 10.01531162, 77.47901275),
(113, 13, 'GOWMARI SWEETS ', 5, '08:00:00', 10.01755127, 77.47924444),
(114, 13, 'ARAVIND EYE HOSPITAL ', 6, '08:00:00', 10.02381431, 77.47964999),
(115, 13, 'PULLUKATTU STOP ', 7, '08:00:00', 10.02597853, 77.47941414),
(116, 13, 'CAFE MILAN ', 8, '08:00:00', 10.03990559, 77.49182070),
(117, 13, 'THATIVILAS ', 9, '08:00:00', 10.01895286, 77.47972464),
(118, 13, ' RMTC-ROUND ', 10, '08:00:00', 10.04847896, 77.50067655),
(119, 13, 'ANNAINJI VILAKU ', 11, '08:00:00', 10.04847896, 77.50067655),
(120, 13, 'ANNAINJI PALAM ', 12, '08:00:00', 10.04399968, 77.49707747),
(121, 13, 'ANNAINJI ', 13, '08:00:00', 10.04307687, 77.50273334),
(122, 13, ' ANNAINJI PALLIVASAL ', 14, '08:00:00', 10.04686035, 77.49941887),
(123, 13, ' VADAPUTHUPETTI BUS STAND ', 15, '08:00:00', 10.04273224, 77.50823783),
(124, 13, 'VADAPUTHUPETTI ', 16, '08:00:00', 10.04275168, 77.50827908),
(125, 13, 'NSCET CLG', 17, '09:00:00', 10.03016938, 77.50703891),
(126, 14, 'MT-PATTI	', 1, '08:00:00', 9.98501806, 77.45497867),
(127, 14, 'ARASU NAGAR	', 2, '08:00:00', 9.98346255, 77.44776629),
(128, 14, 'EB STOP	', 3, '08:00:00', 10.00158919, 77.46802885),
(129, 14, 'MUTHU NAGAR	', 4, '08:00:00', 10.00445891, 77.46910749),
(130, 14, 'CHANDRAPANDIAN MANDABAM	', 5, '08:00:00', 10.00497461, 77.47114190),
(131, 14, 'JANAP TEXTILE	', 6, '08:00:00', 10.00883570, 77.47512724),
(132, 14, 'NSM STOP	', 7, '08:00:00', 10.01010824, 77.48495220),
(133, 14, 'BANGALAMEDU	', 8, '08:00:00', 10.00863843, 77.48095055),
(134, 14, 'NSCET CLG', 9, '09:00:00', 10.03016938, 77.50703891),
(135, 15, 'OLD REGISTER OFFICE	', 1, '08:00:00', 10.01466800, 77.48273600),
(136, 15, 'SAMATHARMAPURAM	', 2, '08:00:00', 8.72529170, 77.74428605),
(137, 15, 'OLD GH	', 3, '08:00:00', 10.01924113, 77.48430888),
(138, 15, 'OLD GH AUTO STAND	', 4, '08:00:00', 10.01733000, 77.48349000),
(139, 15, 'RATHNA NAGAR STOP	', 5, '08:00:00', 10.04298975, 77.49604137),
(140, 15, ' NSCET STOP', 6, '09:00:00', 10.03016938, 77.50703891),
(141, 16, 'ALLINAGARAM	', 1, '08:00:00', 10.00934408, 77.48703180),
(142, 16, 'KOHILA HOSPITAL	', 2, '08:00:00', 10.02989746, 77.48078168),
(143, 16, 'B.K PATTI	', 3, '08:00:00', 10.03422984, 77.48333820),
(144, 16, 'NSCET CLG', 4, '09:00:00', 10.03016938, 77.50703891),
(145, 17, 'SEEPALAKOTTAI ', 1, '08:00:00', 9.84839192, 77.45002217),
(146, 17, 'KAMATCHIPURAM ', 2, '08:00:00', 9.86510962, 77.45404256),
(147, 17, 'V.C PURAM ', 3, '08:00:00', 9.91898496, 77.47258042),
(148, 17, 'KATTUNAYAKANPATTI ', 4, '08:00:00', 9.92407765, 77.46627309),
(149, 17, 'THAPPUGUNDU ', 5, '08:00:00', 9.92984833, 77.46410803),
(150, 17, 'KODUVILARPATTI ', 6, '08:00:00', 9.97927136, 77.49136232),
(151, 17, 'PASUMAI NAGAR ', 7, '08:00:00', 9.98861173, 77.48981776),
(152, 17, 'ARANMANAIPUTHUR ', 8, '08:00:00', 10.00145025, 77.48878978),
(153, 17, 'NSCET CLG', 9, '09:00:00', 10.03016938, 77.50703891),
(154, 18, 'KK PATTI	', 1, '07:00:00', 9.74014386, 77.31606258),
(155, 18, 'ROYAPPANPATTI	', 2, '07:00:00', 9.77103949, 77.33446147),
(156, 18, 'ANAIMALAYAN PATTI	', 3, '07:00:00', 9.78169355, 77.33725728),
(157, 18, 'GOKILAPURAM	', 4, '07:00:00', 9.78497091, 77.33750878),
(158, 18, 'PTR COLONY	', 5, '07:00:00', 9.79503857, 77.32337140),
(159, 18, 'PALAYAM BYPASS	', 6, '07:00:00', 9.80286363, 77.32834035),
(160, 18, 'PALAYAM BUS STOP	', 7, '07:00:00', 9.80528174, 77.33549463),
(161, 18, 'SEELAYAMPATTI	', 8, '08:00:00', 9.87333952, 77.39267182),
(162, 18, 'KOTTUR	', 9, '08:00:00', 9.90433671, 77.40425520),
(163, 18, 'UPPARPATTI	', 10, '08:00:00', 9.95329689, 77.41989145),
(164, 18, 'VEERAPANDI	', 11, '08:00:00', 9.96511147, 77.43530065),
(165, 18, 'NSCET STOP	', 12, '09:00:00', 10.03016131, 77.50638467),
(166, 19, 'JAYAMANGALAM', 1, '08:00:00', 10.09382765, 77.60936566),
(167, 19, 'MELMANGALAM', 2, '08:00:00', 10.10095980, 77.58408564),
(168, 19, 'VADUGAPATTI', 3, '08:00:00', 10.10395191, 77.57308346),
(169, 19, 'VADUGAPATTI BUS STOP', 4, '08:00:00', 10.10627457, 77.57197153),
(170, 19, 'THAMARAIKULAM', 5, '08:00:00', 10.10531085, 77.56357753),
(171, 19, 'THAMARAIKULAM SUB-COLLECTOR OFFICE', 6, '08:00:00', 10.10951657, 77.55106421),
(172, 19, 'J.A.COLLEGE', 7, '08:00:00', 10.10873353, 77.54619296),
(173, 19, 'KALLIPATTI', 8, '08:00:00', 10.10678365, 77.54345607),
(174, 19, 'KAILASAPATTI', 9, '08:00:00', 10.09421087, 77.52966894),
(175, 19, 'VADAPUDUPATTI', 10, '08:00:00', 10.04105490, 77.51173238),
(176, 19, 'NSCET STOP', 11, '08:00:00', 10.03034564, 77.50570938),
(177, 20, 'AYYAMPALAYAM', 1, '08:00:00', 10.22718308, 77.74839019),
(178, 20, 'DEVARADANPATTI PIRIVU', 2, '08:00:00', 10.21869171, 77.75635869),
(179, 20, 'PATTIVEERANPATTI', 3, '08:00:00', 10.21271145, 77.76170667),
(180, 20, 'BATLAGUNDU', 4, '08:00:00', 10.16388368, 77.75856241),
(181, 20, 'SLR CAMP', 5, '08:00:00', NULL, NULL),
(182, 20, 'KANAVAI PATTI', 6, '08:00:00', 10.18522327, 77.73444901),
(183, 20, 'G.THUMMALA PATTI', 7, '08:00:00', 10.18623849, 77.71314119),
(184, 20, 'GENGUVAR PATTI', 8, '08:00:00', 10.17055452, 77.69695733),
(185, 20, 'KAAT ROAD', 9, '08:00:00', 10.15525496, 77.69150092),
(186, 20, 'SAATHA KOVIL PATTI', 10, '08:00:00', 10.14857268, 77.66502120),
(187, 20, 'DEVATHANA PATTI', 11, '08:00:00', 10.14246944, 77.64311511),
(188, 20, 'THANGAMUTHU POLY', 12, '08:00:00', 10.13000090, 77.60178855),
(189, 20, 'E.PUTHU PATTI', 13, '08:00:00', 10.12914686, 77.57685303),
(190, 20, 'LAKSHMIPURAM BYPASS', 14, '08:00:00', 10.07253672, 77.52420191),
(191, 20, 'ANNANJI', 15, '08:00:00', 10.04304458, 77.50274919),
(192, 20, 'NSCET CLG', 16, '09:00:00', 10.03034564, 77.50570938),
(193, 21, 'NS BOYS SCHOOL', 1, '08:00:00', 10.01019637, 77.48498212),
(194, 21, 'ANNAPARAJA MAHAL', 2, '08:00:00', 10.01298896, 77.48377550),
(195, 21, 'SHIVAJI NAGAR', 3, '08:00:00', 10.01433779, 77.48783642),
(196, 21, 'NSCET CLG', 4, '09:00:00', 10.03034564, 77.50570938),
(197, 22, 'P. SUBBULAPURAM - FIRST STOP', 1, '07:00:00', NULL, NULL),
(198, 22, 'T. SUBBULAPURAM - SECOND STOP', 2, '07:03:00', NULL, NULL),
(199, 22, 'RENGAMPATTI', 3, '07:30:00', NULL, NULL),
(200, 22, 'BALAJI NAGAR', 4, '07:32:00', NULL, NULL),
(201, 22, 'KAMARAJ NAGAR - FIRST STOP', 5, '07:35:00', NULL, NULL),
(202, 22, 'KAMARAJ NAGAR - SECOND STOP', 6, '07:40:00', NULL, NULL),
(203, 22, 'POLICE STATION', 7, '08:00:00', NULL, NULL),
(204, 22, 'NSCET CLG', 8, '08:10:00', NULL, NULL),
(217, 26, 'MUDALAKKAMPATTI', 1, '07:00:00', NULL, NULL),
(218, 26, 'JAMBULIYATHUR', 2, '07:20:00', NULL, NULL),
(219, 26, 'VELANGANNI SCHOOL', 3, '07:27:00', NULL, NULL),
(220, 26, 'ALAMARAM STOP', 4, '07:29:00', NULL, NULL),
(221, 26, 'ANBU STORE', 5, '07:30:00', NULL, NULL),
(222, 26, 'B.S.N.L STOP', 6, '07:31:00', NULL, NULL),
(223, 26, 'THIRUVALLUVAR COLONY', 7, '07:32:00', NULL, NULL),
(224, 26, 'T.V.S STOP', 8, '07:33:00', NULL, NULL),
(225, 26, 'A.T.M STOP', 9, '07:35:00', NULL, NULL),
(226, 26, 'ANJANEYAR TEMPLE', 10, '07:40:00', NULL, NULL),
(227, 26, 'PETROL BUNK', 11, '07:42:00', NULL, NULL),
(228, 26, 'RENGANATHAPURAM VILAKKU', 12, '07:44:00', NULL, NULL),
(229, 26, 'NSCET CLG', 13, '08:10:00', NULL, NULL),
(256, 30, 'SEDAPATTI', 1, '07:05:00', NULL, NULL),
(257, 30, 'SIVALAKKURAMPATTI', 2, '07:07:00', NULL, NULL),
(258, 30, 'SEKKAPATTI', 3, '07:10:00', NULL, NULL),
(259, 30, 'T. SINGAPUR', 4, '07:12:00', NULL, NULL),
(260, 30, 'BHAGAVATHI AMMAN TEMPLE', 5, '07:14:00', NULL, NULL),
(261, 30, 'BOYS SCHOOL STOP', 6, '07:15:00', NULL, NULL),
(262, 30, 'BUS STOP', 7, '07:17:00', NULL, NULL),
(263, 30, 'NATTAR STREET', 8, '07:25:00', NULL, NULL),
(264, 30, 'S.L. PURAM', 9, '07:30:00', NULL, NULL),
(265, 30, 'KARUTHUMALAIPATTI, PERUMALKOILPATTI', 10, '07:35:00', NULL, NULL),
(266, 30, 'NSCET CLG', 11, '08:05:00', NULL, NULL),
(300, 38, 'SODAPATTI', 1, '07:05:00', NULL, NULL),
(301, 38, 'SILUKKUVARPATTI', 2, '07:07:00', NULL, NULL),
(302, 38, 'CHECKPOST', 3, '07:10:00', NULL, NULL),
(303, 38, 'D.S.P OFFICE', 4, '07:12:00', NULL, NULL),
(304, 38, 'BAGAVATHIAMMAN TEMPLE', 5, '07:14:00', NULL, NULL),
(305, 38, 'BOYS SCHOOL STOP', 6, '07:15:00', NULL, NULL),
(306, 38, 'BUS STOP', 7, '07:17:00', NULL, NULL),
(307, 38, 'NADAR STREET', 8, '07:25:00', NULL, NULL),
(308, 38, 'S.S. PURAM', 9, '07:30:00', NULL, NULL),
(309, 38, 'KAZHUTHAIMALAIPATTI, PERUMALKOVILPATTI', 10, '07:35:00', NULL, NULL),
(310, 38, 'T.M.H.N.U. SCHOOL', 11, '08:05:00', NULL, NULL),
(313, 42, 'ARASU NAGAR', 1, '09:15:00', NULL, NULL),
(314, 42, 'T.M.H.N.U. SCHOOL', 2, '09:25:00', NULL, NULL),
(315, 43, 'ALAMARAM', 1, '08:30:00', NULL, NULL),
(316, 43, 'THIRUMALAINAICKERPATTI', 2, '08:32:00', NULL, NULL),
(317, 43, 'ANJANEYAR TEMPLE', 3, '08:34:00', NULL, NULL),
(318, 43, 'T.V.S', 4, '08:40:00', NULL, NULL),
(319, 43, 'KAMALAIKKADU', 5, '09:00:00', NULL, NULL),
(320, 43, 'THANGAKKALAYANPATTI', 6, '09:05:00', NULL, NULL),
(321, 43, 'PILLAR NAGAR', 7, '09:10:00', NULL, NULL),
(322, 43, 'ARAPPADITHEVANPATTI', 8, '09:12:00', NULL, NULL),
(323, 43, 'KARUVELNAYAKKANPATTI', 9, '09:15:00', NULL, NULL),
(324, 43, 'T.M.H.N.U. SCHOOL', 10, '09:30:00', NULL, NULL),
(325, 44, 'ELLAPATTI', 1, '08:00:00', NULL, NULL),
(326, 44, 'MARKKAYAN KOTTAI', 2, '08:10:00', NULL, NULL),
(327, 44, 'KUCHANUR', 3, '08:15:00', NULL, NULL),
(328, 44, 'DURAISAMYPURAM', 4, '08:20:00', NULL, NULL),
(329, 44, 'KOOLAYANUR', 5, '08:25:00', NULL, NULL),
(330, 44, 'BALARPATTI', 6, '08:30:00', NULL, NULL),
(331, 44, 'AYYANARPURAM', 7, '08:34:00', NULL, NULL),
(332, 44, 'KUNDALNAYAKKANPATTI', 8, '08:36:00', NULL, NULL),
(333, 44, 'UPPUKOTTAI 1ST STOP', 9, '08:39:00', NULL, NULL),
(334, 44, 'UPPUKOTTAI 2ND STOP', 10, '08:40:00', NULL, NULL),
(335, 44, 'SADAIYALPATTI BAKERY', 11, '08:42:00', NULL, NULL),
(336, 44, 'BODENTHRAPURAM', 12, '08:45:00', NULL, NULL),
(337, 44, 'T.M.H.N.U. SCHOOL', 13, '08:55:00', NULL, NULL),
(338, 45, 'KOTTUR', 1, '08:30:00', NULL, NULL),
(339, 45, 'BALAGURUNATHAPURAM', 2, '08:35:00', NULL, NULL),
(340, 45, 'VEERAPANDI BYPASS', 3, '08:38:00', NULL, NULL),
(341, 45, 'VEERAPANDI BANK', 4, '08:50:00', NULL, NULL),
(342, 45, 'T.M.H.N.U. SCHOOL', 5, '09:05:00', NULL, NULL),
(343, 46, 'ARANMANAIPUDUR MEEN KADAI', 1, '08:30:00', NULL, NULL),
(344, 46, 'VINAYAKA HOSPITAL', 2, '08:35:00', NULL, NULL),
(345, 46, 'NEERMATTAM', 3, '08:37:00', NULL, NULL),
(346, 46, 'MULLAI NAGAR TURNING', 4, '08:40:00', NULL, NULL),
(347, 46, 'THIRUPATHI STORE', 5, '08:43:00', NULL, NULL),
(348, 46, 'MULLAI NAGAR BUS STOP', 6, '08:50:00', NULL, NULL),
(349, 46, 'DAKSHINAMURTHY TEMPLE', 7, '08:55:00', NULL, NULL),
(350, 46, 'BRINDAVAN', 8, '08:57:00', NULL, NULL),
(351, 46, 'VAYALPATTI', 9, '09:00:00', NULL, NULL),
(352, 46, 'VEERAPANDI KINATRU STOP', 10, '09:05:00', NULL, NULL),
(353, 46, 'VEPPAMARAM', 11, '09:15:00', NULL, NULL),
(354, 46, 'VEERAPANDI ANNASILAI', 12, '09:17:00', NULL, NULL),
(355, 46, 'T.M.H.N.U. SCHOOL', 13, '09:20:00', NULL, NULL),
(356, 47, 'UPPARPATTI 1ST STOP', 1, '08:30:00', NULL, NULL),
(357, 47, 'UPPARPATTI 2ND STOP', 2, '08:35:00', NULL, NULL),
(358, 47, 'POLICE QUARTERS', 3, '08:40:00', NULL, NULL),
(359, 47, 'K.M.S STOP', 4, '08:43:00', NULL, NULL),
(360, 47, 'AMMAN NAGAR', 5, '08:45:00', NULL, NULL),
(361, 47, 'VEERAPANDI TEMPLE', 6, '08:50:00', NULL, NULL),
(362, 47, 'POLICE STATION', 7, '08:52:00', NULL, NULL),
(363, 47, 'L.S MILL', 8, '08:55:00', NULL, NULL),
(364, 47, 'MIN ARASU NAGAR', 9, '08:57:00', NULL, NULL),
(365, 47, 'T.M.H.N.U. SCHOOL', 10, '09:05:00', NULL, NULL),
(366, 48, 'MARIAMMAN PADITHURAI', 1, '07:30:00', NULL, NULL),
(367, 48, 'VALLUVAR SILAI', 2, '07:35:00', NULL, NULL),
(368, 48, 'NSN MAHAL', 3, '07:37:00', NULL, NULL),
(369, 48, 'GIRLS HIGHER SECONDARY SCHOOL', 4, '07:45:00', NULL, NULL),
(370, 48, 'RATION SHOP', 5, '07:47:00', NULL, NULL),
(371, 48, 'MALLIGAI MAHAL', 6, '07:50:00', NULL, NULL),
(372, 48, 'J.C BULK', 7, '07:53:00', NULL, NULL),
(373, 48, 'THEVAR SILAI', 8, '07:58:00', NULL, NULL),
(374, 48, 'PARVATHI THEATER', 9, '08:00:00', NULL, NULL),
(375, 48, 'AYYAPPAN TEMPLE', 10, '08:02:00', NULL, NULL),
(376, 48, 'KAILASAPATTI', 11, '08:10:00', NULL, NULL),
(377, 48, 'LAKSHMIPURAM', 12, '08:15:00', NULL, NULL),
(378, 48, 'SRI RENUKA VIDYALAYA', 13, '08:20:00', NULL, NULL),
(379, 48, 'SOWDESWARI NAGAR', 14, '08:25:00', NULL, NULL),
(380, 48, 'AMMAPATTI J.J COLONY', 15, '08:30:00', NULL, NULL),
(381, 48, 'VADAPUDUPATTI', 16, '08:35:00', NULL, NULL),
(382, 48, 'ANNANCHI PALLIVASAL', 17, '08:37:00', NULL, NULL),
(383, 48, 'ANNANCHI RATION SHOP', 18, '08:40:00', NULL, NULL),
(384, 48, 'ANNANCHI BUS STOP', 19, '08:42:00', NULL, NULL),
(385, 48, 'BALAM SCHOOL', 20, '08:45:00', NULL, NULL),
(386, 48, 'MANI NAGAR', 21, '09:05:00', NULL, NULL),
(387, 48, 'T.M.H.N.U. SCHOOL', 22, '09:20:00', NULL, NULL),
(388, 49, 'SUKKUVADANPATTI', 1, '08:45:00', NULL, NULL),
(389, 49, 'SUKKUVADANPATTI TEA SHOP', 2, '08:48:00', NULL, NULL),
(390, 49, 'YANAIMILL', 3, '08:50:00', NULL, NULL),
(391, 49, 'JAYAM NAGAR', 4, '08:53:00', NULL, NULL),
(392, 49, 'B.G. PATTI BUS STOP', 5, '08:58:00', NULL, NULL),
(393, 49, 'KOKILA HOSPITAL', 6, '09:00:00', NULL, NULL),
(394, 49, 'ALLINAGARAM BUS STOP', 7, '09:02:00', NULL, NULL),
(395, 49, 'ALLINAGARAM PILLAYAR KOVIL', 8, '09:04:00', NULL, NULL),
(396, 49, 'VETNERI', 9, '09:06:00', NULL, NULL),
(397, 49, 'ARAVIND HOSPITAL', 10, '09:08:00', NULL, NULL),
(398, 49, 'FIRE SERVICE', 11, '09:10:00', NULL, NULL),
(399, 49, 'STATE BANK', 12, '09:12:00', NULL, NULL),
(400, 49, 'JANAB TEX', 13, '09:15:00', NULL, NULL),
(401, 49, 'T.M.H.N.U. SCHOOL', 14, '09:25:00', NULL, NULL),
(402, 50, 'PARK', 1, '08:15:00', NULL, NULL),
(403, 50, 'VETRI THEATER', 2, '08:20:00', NULL, NULL),
(404, 50, 'KUNDALEESWARAR TEMPLE', 3, '08:22:00', NULL, NULL),
(405, 50, 'SUBBURAJ NAGAR BRIDGE', 4, '08:25:00', NULL, NULL),
(406, 50, 'MARAVAR MANDAPAM', 5, '08:27:00', NULL, NULL),
(407, 50, 'UZHAVAR SANDHAI', 6, '08:30:00', NULL, NULL),
(408, 50, 'POLICE QUARTERS', 7, '08:35:00', NULL, NULL),
(409, 50, 'KATTABOMMAN', 8, '08:40:00', NULL, NULL),
(410, 50, 'VALLUVAR SILAI', 9, '08:42:00', NULL, NULL),
(411, 50, 'POLICE STATION', 10, '08:44:00', NULL, NULL),
(412, 50, 'SURYA MEDICAL', 11, '08:45:00', NULL, NULL),
(413, 50, 'SENAITHALAIVAR MANDAPAM', 12, '08:50:00', NULL, NULL),
(414, 50, 'KALIAMMAN TEMPLE', 13, '08:53:00', NULL, NULL),
(415, 50, 'KAMARAJAR SILAI', 14, '08:55:00', NULL, NULL),
(416, 50, 'MARIAMMAN TEMPLE', 15, '08:57:00', NULL, NULL),
(417, 50, 'NADAR SCHOOL', 16, '09:00:00', NULL, NULL),
(418, 50, 'CHOKKANATHAPURAM', 17, '09:04:00', NULL, NULL),
(419, 50, 'MEENACHIPURAM', 18, '09:06:00', NULL, NULL),
(420, 50, 'DURAIRAJAPURAM', 19, '09:15:00', NULL, NULL),
(421, 50, 'THEERTHATHOTTI', 20, '09:13:00', NULL, NULL),
(422, 50, 'OTHA VEEDU', 21, '09:15:00', NULL, NULL),
(423, 50, 'T.M.H.N.U. SCHOOL', 22, '09:30:00', NULL, NULL),
(424, 51, 'MARUTHI BAKERY', 1, '09:00:00', NULL, NULL),
(425, 51, 'VIDYA HOSPITAL', 2, '09:03:00', NULL, NULL),
(426, 51, 'EB STOP', 3, '09:05:00', NULL, NULL),
(427, 51, 'MUTHU NAGAR', 4, '09:07:00', NULL, NULL),
(428, 51, 'CHANDRA PANDIYAN MAHAL', 5, '09:10:00', NULL, NULL),
(429, 51, 'MEENATCHI MARBLE', 6, '09:15:00', NULL, NULL),
(430, 51, 'MUTHUTHEVANPATTI', 7, '09:18:00', NULL, NULL),
(431, 51, 'T.M.H.N.U. SCHOOL', 8, '09:20:00', NULL, NULL),
(432, 52, 'PUGAZH COFFEE BAR', 1, '08:30:00', NULL, NULL),
(433, 52, 'KRISHNA METALS', 2, '08:32:00', NULL, NULL),
(434, 52, 'GANAPATHY SILK', 3, '08:33:00', NULL, NULL),
(435, 52, 'FOREST ROAD 1ST STREET', 4, '08:34:00', NULL, NULL),
(436, 52, 'BOYS SCHOOL GATE', 5, '08:35:00', NULL, NULL),
(437, 52, 'PATTAI COMPANY', 6, '08:37:00', NULL, NULL),
(438, 52, 'ANNAPPARAJA MAHAL', 7, '08:41:00', NULL, NULL),
(439, 52, 'SIVAJI NAGAR', 8, '08:42:00', NULL, NULL),
(440, 52, 'RATION SHOP', 9, '08:43:00', NULL, NULL),
(441, 52, 'K.R.R NAGAR', 10, '08:45:00', NULL, NULL),
(442, 52, 'J.K STORE', 11, '08:48:00', NULL, NULL),
(443, 52, 'G.H WATER TANK', 12, '08:49:00', NULL, NULL),
(444, 52, 'AUTO STAND', 13, '08:50:00', NULL, NULL),
(445, 52, 'MANIMEGALAI STORE', 14, '08:51:00', NULL, NULL),
(446, 52, 'POST OFFICE', 15, '08:52:00', NULL, NULL),
(447, 52, 'T.M.H.N.U. SCHOOL', 16, '09:10:00', NULL, NULL),
(448, 53, 'THEVARAM BUS STOP', 1, '07:40:00', NULL, NULL),
(449, 53, 'LAKSHMINAYAKKANPATTI', 2, '07:50:00', NULL, NULL),
(450, 53, 'VEMBAKOTTAI', 3, '07:53:00', NULL, NULL),
(451, 53, 'SANKARAPURAM', 4, '07:55:00', NULL, NULL),
(452, 53, 'RASINGAPURAM', 5, '08:00:00', NULL, NULL),
(453, 53, 'RASINGAPURAM KALIAMMAN TEMPLE', 6, '08:02:00', NULL, NULL),
(454, 53, 'SILAMALAI', 7, '08:04:00', NULL, NULL),
(455, 53, 'SILAMARATHUPATTI LIBRARY', 8, '08:07:00', NULL, NULL),
(456, 53, 'SILAMARATHUPATTI BUS STAND', 9, '08:10:00', NULL, NULL),
(457, 53, 'THARUMATHUPATTI', 10, '08:13:00', NULL, NULL),
(458, 53, 'RENGANATHAPURAM', 11, '08:15:00', NULL, NULL),
(459, 53, 'KRISHNA NAGAR', 12, '08:20:00', NULL, NULL),
(460, 53, 'R.M.T.C DEPOT', 13, '08:22:00', NULL, NULL),
(461, 53, 'PANKAJAM SCHOOL', 14, '08:25:00', NULL, NULL),
(462, 53, 'THEVAR SILAI', 15, '08:30:00', NULL, NULL),
(463, 53, 'SURYA MEDICAL', 16, '08:35:00', NULL, NULL),
(464, 53, 'OLD BUS STAND', 17, '08:40:00', NULL, NULL),
(465, 53, 'VETRILAICHAVADI', 18, '08:39:00', NULL, NULL),
(466, 53, 'T.M.H.N.U. SCHOOL', 19, '09:05:00', NULL, NULL),
(467, 54, 'THIRUPATHI STORE', 1, '08:15:00', NULL, NULL),
(468, 54, 'SIVARAM NAGAR', 2, '08:20:00', NULL, NULL),
(469, 54, 'BETHANATCHI MAHAL', 3, '08:25:00', NULL, NULL),
(470, 54, 'VENGALA NAGAR', 4, '08:27:00', NULL, NULL),
(471, 54, 'BALAN NAGAR', 5, '08:35:00', NULL, NULL),
(472, 54, 'TELEPHONE NAGAR', 6, '08:40:00', NULL, NULL),
(473, 54, 'T.M.H.N.U. SCHOOL', 7, '09:15:00', NULL, NULL),
(474, 55, 'SEDAPATTI', 1, '08:00:00', NULL, NULL),
(475, 55, 'SEELAKUVARPATTI', 2, '08:05:00', NULL, NULL),
(476, 55, 'CHECKPOST', 3, '08:10:00', NULL, NULL),
(477, 55, 'BAGAVATHI AMMAN TEMPLE', 4, '08:14:00', NULL, NULL),
(478, 55, 'BOYS SCHOOL', 5, '08:17:00', NULL, NULL),
(479, 55, 'AUNDIPATTI BUS STOP', 6, '08:20:00', NULL, NULL),
(480, 55, 'POLICE STATION', 7, '08:25:00', NULL, NULL),
(481, 55, 'KAMARAJAR STOP', 8, '08:30:00', NULL, NULL),
(482, 55, 'BALAJI NAGAR', 9, '08:33:00', NULL, NULL),
(483, 55, 'NADAR STOP', 10, '08:36:00', NULL, NULL),
(484, 55, 'T.M.H.N.U. SCHOOL', 11, '09:10:00', NULL, NULL),
(485, 56, 'SUKKANGALPATTI', 1, '07:30:00', NULL, NULL),
(486, 56, 'ODAIPATTI PETROL BUNK', 2, '07:35:00', NULL, NULL),
(487, 56, 'ODAIPATTI SCHOOL STOP', 3, '07:40:00', NULL, NULL),
(488, 56, 'ODAIPATTI 3RD STOP', 4, '07:45:00', NULL, NULL),
(489, 56, 'SEEPALAKKOTTAI', 5, '07:50:00', NULL, NULL),
(490, 56, 'ERAKKOTTAIPATTI', 6, '08:00:00', NULL, NULL),
(491, 56, 'KAMATCHIPURAM', 7, '08:05:00', NULL, NULL),
(492, 56, 'VEEPAMPATTI', 8, '08:10:00', NULL, NULL),
(493, 56, 'POOMALAIKUNDU', 9, '08:15:00', NULL, NULL),
(494, 56, 'DHARMAPURI 1ST STOP', 10, '08:20:00', NULL, NULL),
(495, 56, 'DHARMAPURI 2ND STOP', 11, '08:25:00', NULL, NULL),
(496, 56, 'DHARMAPURI 3RD STOP', 12, '08:26:00', NULL, NULL),
(497, 56, 'KOTTUR 1', 13, '08:30:00', NULL, NULL),
(498, 56, 'KOTTUR 2', 14, '08:32:00', NULL, NULL),
(499, 56, 'T.M.H.N.U. SCHOOL', 15, '08:50:00', NULL, NULL),
(500, 57, 'POLICE QUARTERS', 1, '08:15:00', NULL, NULL),
(501, 57, 'ARCH', 2, '08:16:00', NULL, NULL),
(502, 57, 'G.H', 3, '08:17:00', NULL, NULL),
(503, 57, 'ITI', 4, '08:19:00', NULL, NULL),
(504, 57, 'RICE SHOP', 5, '08:20:00', NULL, NULL),
(505, 57, 'MIN NAGAR', 6, '08:22:00', NULL, NULL),
(506, 57, 'KALLAR MANDAPAM', 7, '08:24:00', NULL, NULL),
(507, 57, 'KRISHNA IYER HIGHER SECONDARY SCHOOL', 8, '08:26:00', NULL, NULL),
(508, 57, 'SIVAN TEMPLE', 9, '08:28:00', NULL, NULL),
(509, 57, 'MUTHALAMMAN TEMPLE', 10, '08:30:00', NULL, NULL),
(510, 57, 'PONNUCHAMY THEATER', 11, '08:40:00', NULL, NULL),
(511, 57, 'BANK', 12, '08:42:00', NULL, NULL),
(512, 57, 'LAKSHMI MEDICAL', 13, '08:44:00', NULL, NULL),
(513, 57, 'TIMBER SHOP', 14, '08:46:00', NULL, NULL),
(514, 57, 'KANNAMMA GARDEN', 15, '08:48:00', NULL, NULL),
(515, 57, 'SEELAYAMPATTI NURSERY', 16, '08:50:00', NULL, NULL),
(516, 57, 'SEELAYAMPATTI FLOWER SHOP', 17, '08:52:00', NULL, NULL),
(517, 57, 'SEELAYAMPATTI CHICKEN SHOP', 18, '08:54:00', NULL, NULL),
(518, 57, 'BUS STOP', 19, '08:56:00', NULL, NULL),
(519, 57, 'PALLIVASAL 1', 20, '08:58:00', NULL, NULL),
(520, 57, 'VEPPAMPATTI', 21, '09:00:00', NULL, NULL),
(521, 57, 'T.M.H.N.U. SCHOOL', 22, '09:15:00', NULL, NULL),
(522, 58, 'RATION SHOP', 1, '07:25:00', NULL, NULL),
(523, 58, 'CHANDRA STOP', 2, '07:27:00', NULL, NULL),
(524, 58, 'BETHANATCHI MAHAL', 3, '07:30:00', NULL, NULL),
(525, 58, 'MAHAGANAPATHY KADAI', 4, '07:32:00', NULL, NULL),
(526, 58, 'MASANI AMMAN KOVIL', 5, '07:35:00', NULL, NULL),
(527, 58, 'TEA SHOP', 6, '07:36:00', NULL, NULL),
(528, 58, 'G.P.A. MAHAL', 7, '07:40:00', NULL, NULL),
(529, 58, 'SUKKUVADANPATTI', 8, '07:45:00', NULL, NULL),
(530, 58, 'MANI NAGAR', 9, '07:48:00', NULL, NULL),
(531, 58, 'RATHINAM NAGAR', 10, '07:50:00', NULL, NULL),
(532, 58, 'ANUGRAHA NAGAR', 11, '07:52:00', NULL, NULL),
(533, 58, 'T.M.H.N.U. SCHOOL', 12, '08:10:00', NULL, NULL),
(534, 59, 'B.G. PATTI PILLAYAR KOVIL STOP', 1, '07:30:00', NULL, NULL),
(535, 59, 'B.G. PATTI BUS STOP', 2, '07:32:00', NULL, NULL),
(536, 59, 'SARAVANA KUDIL STOP', 3, '07:34:00', NULL, NULL),
(537, 59, 'KOKILA HOSPITAL', 4, '07:35:00', NULL, NULL),
(538, 59, 'ALLINAGARAM BUS STOP', 5, '07:36:00', NULL, NULL),
(539, 59, 'ALLINAGARAM PILLAYAR KOVIL STOP', 6, '07:37:00', NULL, NULL),
(540, 59, 'VETNERI STOP', 7, '07:40:00', NULL, NULL),
(541, 59, 'ARAVIND HOSPITAL', 8, '07:42:00', NULL, NULL),
(542, 59, 'FIRE SERVICE STOP', 9, '07:44:00', NULL, NULL),
(543, 59, 'MARUTHI BAKERY STOP', 10, '07:45:00', NULL, NULL),
(544, 59, 'T.M.H.N.U. SCHOOL', 11, '08:00:00', NULL, NULL),
(545, 60, 'AISHWARYA APARTMENT', 1, '07:40:00', NULL, NULL),
(546, 60, 'SUPER MARKET', 2, '07:45:00', NULL, NULL),
(547, 60, 'JEGANATHAPURAM VILAKKU', 3, '07:46:00', NULL, NULL),
(548, 60, 'NAGAMMAN TEMPLE', 4, '07:48:00', NULL, NULL),
(549, 60, 'MURUGAN TEMPLE', 5, '07:50:00', NULL, NULL),
(550, 60, 'TOWER STOP', 6, '07:55:00', NULL, NULL),
(551, 60, 'RMTC TURNING', 7, '07:57:00', NULL, NULL),
(552, 60, 'T.M.H.N.U. SCHOOL', 8, '08:00:00', NULL, NULL),
(553, 61, 'WORKSHOP', 1, '07:25:00', NULL, NULL),
(554, 61, 'K.M.C. COLONY', 2, '07:27:00', NULL, NULL),
(555, 61, 'C.E.O. SCHOOL', 3, '07:30:00', NULL, NULL),
(556, 61, 'JEGANATHAPURAM VILAKKU', 4, '07:32:00', NULL, NULL),
(557, 61, 'NAGAMMAN TEMPLE', 5, '07:35:00', NULL, NULL),
(558, 61, 'MURUGAN TEMPLE', 6, '07:36:00', NULL, NULL),
(559, 61, 'R.M.T.C. COLONY', 7, '07:40:00', NULL, NULL),
(560, 61, 'T.M.H.N.U. SCHOOL', 8, '07:50:00', NULL, NULL),
(561, 62, 'WELL STOP', 1, '07:20:00', NULL, NULL),
(562, 62, 'VEPPAMARAM STOP', 2, '07:25:00', NULL, NULL),
(563, 62, 'ANNA STATUE', 3, '07:28:00', NULL, NULL),
(564, 62, 'BANK STOP', 4, '07:30:00', NULL, NULL),
(565, 62, 'SCHOOL STOP', 5, '07:35:00', NULL, NULL),
(566, 62, 'T.M.H.N.U. SCHOOL', 6, '07:40:00', NULL, NULL),
(567, 63, 'SUBRAMANI KOVIL', 1, '07:55:00', NULL, NULL),
(568, 63, 'ALLAH KOVIL', 2, '07:57:00', NULL, NULL),
(569, 63, 'THEVAR SILAI', 3, '07:59:00', NULL, NULL),
(570, 63, 'NATTU KOZHI KADAI', 4, '08:01:00', NULL, NULL),
(571, 63, 'C.S.V. AVENUE', 5, '08:04:00', NULL, NULL),
(572, 63, 'SAIBABA KOVIL', 6, '08:07:00', NULL, NULL),
(573, 63, 'T.M.H.N.U. SCHOOL', 7, '08:15:00', NULL, NULL),
(574, 64, 'HOSTEL', 1, '07:30:00', NULL, NULL),
(575, 64, 'T.M.H.N.U. SCHOOL', 2, '07:45:00', NULL, NULL),
(576, 65, 'ARASU NAGAR', 1, '07:40:00', NULL, NULL),
(577, 65, 'T.M.H.N.U. SCHOOL', 2, '07:50:00', NULL, NULL),
(578, 66, 'BOYS SCHOOL GATE', 1, '07:30:00', NULL, NULL),
(579, 66, 'PATTAI COMPANY', 2, '07:35:00', NULL, NULL),
(580, 66, 'N.R.D. KOVIL', 3, '07:40:00', NULL, NULL),
(581, 66, 'N.R.D. ENTRANCE', 4, '07:45:00', NULL, NULL),
(582, 66, 'WHITE HOUSE', 5, '07:47:00', NULL, NULL),
(583, 66, 'STATE BANK', 6, '07:50:00', NULL, NULL),
(584, 66, 'EDAMAL ENTRANCE', 7, '07:51:00', NULL, NULL),
(585, 66, 'T.M.H.N.U. SCHOOL', 8, '08:00:00', NULL, NULL),
(586, 67, 'UPPARPATTI MAHAL', 1, '07:30:00', NULL, NULL),
(587, 67, 'UPPARPATTI BUS STOP', 2, '07:32:00', NULL, NULL),
(588, 67, 'UPPARPATTI TAILOR SHOP STOP', 3, '07:33:00', NULL, NULL),
(589, 67, 'UPPARPATTI SCHOOL STOP', 4, '07:35:00', NULL, NULL),
(590, 67, 'VEERAPANDI POLICE QUARTERS', 5, '07:40:00', NULL, NULL),
(591, 67, 'VEERAPANDI AMMAN NAGAR', 6, '07:43:00', NULL, NULL),
(592, 67, 'VEERAPANDI KOVIL', 7, '07:45:00', NULL, NULL),
(593, 67, 'L.S. MILL', 8, '07:50:00', NULL, NULL),
(594, 67, 'T.M.H.N.U. SCHOOL', 9, '07:53:00', NULL, NULL),
(595, 68, 'WORKSHOP', 1, '07:30:00', NULL, NULL),
(596, 68, 'SIVAJI NAGAR', 2, '07:38:00', NULL, NULL),
(597, 68, 'JYOTHI STORE', 3, '07:40:00', NULL, NULL),
(598, 68, 'K.R.R. NAGAR', 4, '07:43:00', NULL, NULL),
(599, 68, 'VIDYA HOSPITAL', 5, '07:50:00', NULL, NULL),
(600, 68, 'P.C. PATTI BUS STOP', 6, '07:53:00', NULL, NULL),
(601, 68, 'MARUTHI BAKERY', 7, '07:55:00', NULL, NULL),
(602, 68, 'T.M.H.N.U. SCHOOL', 8, '08:00:00', NULL, NULL),
(603, 69, 'THIRUPATHI STORE', 1, '07:30:00', NULL, NULL),
(604, 69, 'G.H. WATER TANK', 2, '07:31:00', NULL, NULL),
(605, 69, 'J.K. STORE', 3, '07:32:00', NULL, NULL),
(606, 69, 'MALLIGAI MAHAL', 4, '07:33:00', NULL, NULL),
(607, 69, 'JANAB TEX', 5, '07:37:00', NULL, NULL),
(608, 69, 'CHANDRAPANDIYAN MANDAPAM', 6, '07:38:00', NULL, NULL),
(609, 69, 'MUTHU NAGAR', 7, '07:40:00', NULL, NULL),
(610, 69, 'VAIGAI SCAN', 8, '07:42:00', NULL, NULL),
(611, 69, 'Y. AMEGALAI STORE', 9, '07:44:00', NULL, NULL),
(612, 69, 'POST OFFICE', 10, '07:45:00', NULL, NULL),
(613, 69, 'T.N.E.B.', 11, '07:50:00', NULL, NULL),
(614, 69, 'P.C. PATTI WATER TANK', 12, '07:55:00', NULL, NULL),
(615, 69, 'T.M.H.N.U. SCHOOL', 13, '08:00:00', NULL, NULL),
(616, 70, 'TELEPHONE NAGAR I STOP', 1, '07:10:00', NULL, NULL),
(617, 70, 'MANI NAGAR I STOP', 2, '07:30:00', NULL, NULL),
(618, 70, 'MANI NAGAR II STOP', 3, '07:35:00', NULL, NULL),
(619, 70, 'T.M.H.N.U. SCHOOL', 4, '07:45:00', NULL, NULL),
(620, 71, 'MANIKKAPURAM', 1, '07:15:00', NULL, NULL),
(621, 71, 'MANIKKAPURAM COLONY', 2, '07:18:00', NULL, NULL),
(622, 71, 'PATHRAKALIPURAM', 3, '07:35:00', NULL, NULL),
(623, 71, 'PATHRAKALIPURAM 1ST STOP', 4, '07:40:00', NULL, NULL),
(624, 71, 'PATHRAKALIPURAM 2ND STOP', 5, '07:42:00', NULL, NULL),
(625, 71, 'PATHRAKALIPURAM 3RD STOP', 6, '07:44:00', NULL, NULL),
(626, 71, 'PATHRAKALIPURAM BUS STOP', 7, '07:45:00', NULL, NULL),
(627, 71, 'DOMPUSERY ROAD', 8, '07:48:00', NULL, NULL),
(628, 71, 'KAMARAJAPURAM OUTER', 9, '07:55:00', NULL, NULL),
(629, 71, 'SADAIYALPATTI', 10, '08:00:00', NULL, NULL),
(630, 71, 'T.M.H.N.U. SCHOOL', 11, '08:05:00', NULL, NULL),
(631, 72, 'AMACHIYAPURAM', 1, '07:20:00', NULL, NULL),
(632, 72, 'AYYANARPURAM', 2, '07:30:00', NULL, NULL),
(633, 72, 'PALLAPATTI', 3, '07:35:00', NULL, NULL),
(634, 72, 'MARIAMMAN KOVIL PATTI', 4, '08:00:00', NULL, NULL),
(635, 72, 'T.M.H.N.U. SCHOOL', 5, '08:10:00', NULL, NULL),
(636, 73, 'MEENACHIPURAM', 1, '07:20:00', NULL, NULL),
(637, 73, 'KANDAMANUR OUTER', 2, '07:40:00', NULL, NULL),
(638, 73, 'KANDAMANUR', 3, '07:45:00', NULL, NULL),
(639, 73, 'AMBEDKAR SILAI', 4, '07:46:00', NULL, NULL),
(640, 73, 'VENKATACHALAPURAM', 5, '08:03:00', NULL, NULL),
(641, 73, 'THADISERI', 6, '08:15:00', NULL, NULL),
(642, 73, 'SRI RENGAPURAM', 7, '08:20:00', NULL, NULL),
(643, 73, 'VCV TOWN', 8, '08:25:00', NULL, NULL),
(644, 73, 'KODUVILARPATTI', 9, '08:30:00', NULL, NULL),
(645, 73, 'PASUMAI NAGAR', 10, '08:35:00', NULL, NULL),
(646, 73, 'VALLAMAI GOPURAM', 11, '08:47:00', NULL, NULL),
(647, 73, 'ARANMANAI', 12, '08:48:00', NULL, NULL),
(648, 73, 'T.M.H.N.U. SCHOOL', 13, '09:15:00', NULL, NULL),
(649, 74, 'VEERALAKSHMI NAGAR', 1, '08:30:00', NULL, NULL),
(650, 74, 'HIGH SCHOOL', 2, '08:35:00', NULL, NULL),
(651, 74, 'VALAYAPATTI', 3, '08:37:00', NULL, NULL),
(652, 74, 'PERUMAL KOVIL', 4, '08:39:00', NULL, NULL),
(653, 74, 'THENNAIMARAM STOP', 5, '08:40:00', NULL, NULL),
(654, 74, 'VALAIYATHUPATTI', 6, '08:43:00', NULL, NULL),
(655, 74, 'BUREAU COMPANY', 7, '08:45:00', NULL, NULL),
(656, 74, 'VASANTHAM NAGAR', 8, '08:47:00', NULL, NULL),
(657, 74, 'AISHWARYA AVENUE', 9, '08:50:00', NULL, NULL),
(658, 74, 'AATHIPATTI', 10, '08:52:00', NULL, NULL),
(659, 74, 'KMC STOP', 11, '08:55:00', NULL, NULL),
(660, 74, 'CEOA SCHOOL', 12, '09:00:00', NULL, NULL),
(661, 74, 'T.M.H.N.U. SCHOOL', 13, '09:10:00', NULL, NULL),
(662, 75, 'VINAYAGAR KOVIL', 1, '08:40:00', NULL, NULL),
(663, 75, 'RATION SHOP', 2, '08:42:00', NULL, NULL),
(664, 75, 'TOWER STOP', 3, '08:45:00', NULL, NULL),
(665, 75, 'MURUGAN KOVIL', 4, '08:47:00', NULL, NULL),
(666, 75, 'E-SEVA CENTER', 5, '08:55:00', NULL, NULL),
(667, 75, 'NAGAMMAN KOVIL', 6, '08:56:00', NULL, NULL),
(668, 75, 'JEGANATHAPURAM VILAKKU', 7, '08:58:00', NULL, NULL),
(669, 75, 'KRISHNAN KOVIL', 8, '08:59:00', NULL, NULL),
(670, 75, 'PALANIAPPA SCHOOL', 9, '09:00:00', NULL, NULL),
(671, 75, 'AMMAN KOVIL', 10, '09:03:00', NULL, NULL),
(672, 75, 'T.M.H.N.U. SCHOOL', 11, '09:05:00', NULL, NULL),
(673, 76, 'G. USILAMPATTI STOP', 1, '07:00:00', NULL, NULL),
(674, 76, 'SITHARPATTI STOP', 2, '07:10:00', NULL, NULL),
(675, 76, 'RAJADHANI', 3, '07:12:00', NULL, NULL),
(676, 76, 'THEPPAMPATTI STOP', 4, '07:15:00', NULL, NULL),
(677, 76, 'BALAKOMBAI STOP', 5, '07:20:00', NULL, NULL),
(678, 76, 'ALAGAPURI', 6, '07:25:00', NULL, NULL),
(679, 76, 'KATHIRI NARASINGAPURAM STOP', 7, '07:30:00', NULL, NULL),
(680, 76, 'KANNIYAPPAPILLAIPATTI STOP', 8, '07:35:00', NULL, NULL),
(681, 76, 'KOTHULUTHU STOP', 9, '07:40:00', NULL, NULL),
(682, 76, 'PICHAMPATTI STOP', 10, '07:45:00', NULL, NULL),
(683, 76, 'PICHAMPATTI SECOND STOP', 11, '07:45:00', NULL, NULL),
(684, 76, 'AROKIYA STOP', 12, '07:50:00', NULL, NULL),
(685, 76, 'SRINIVASA NAGAR 1ST & 2ND STOP', 13, '07:55:00', NULL, NULL),
(686, 76, 'AMIRTHA GARDEN STOP', 14, '08:05:00', NULL, NULL),
(687, 76, 'SIVASAKTHI MANDAPAM STOP', 15, '08:10:00', NULL, NULL),
(688, 76, 'THANGAKALA MANDAPAM STOP', 16, '08:10:00', NULL, NULL),
(689, 76, 'KANA VILAKKU POLICE STOP', 17, '08:15:00', NULL, NULL),
(690, 76, 'BISMY NAGAR STOP', 18, '08:15:00', NULL, NULL),
(691, 76, 'RAHMAN GARDEN STOP', 19, '08:20:00', NULL, NULL),
(692, 76, 'THIRUMALAPURAM STOP', 20, '08:20:00', NULL, NULL),
(693, 76, 'KUNNUR STOP', 21, '08:25:00', NULL, NULL),
(694, 76, 'KADUVEL NAYAKKANPATTI', 22, '08:30:00', NULL, NULL),
(695, 76, 'T.M.H.N.U. SCHOOL', 23, '08:35:00', NULL, NULL),
(696, 77, 'STATE BANK COLONY', 1, '07:00:00', NULL, NULL),
(697, 77, 'AMBEDKAR STATUE', 2, '07:10:00', NULL, NULL),
(698, 77, 'NSN MAHAL', 3, '07:15:00', NULL, NULL),
(699, 77, 'AGRAHARAM', 4, '07:16:00', NULL, NULL),
(700, 77, 'LIBRARY STOP', 5, '07:20:00', NULL, NULL),
(701, 77, 'SOURASHTRA MANDAPAM', 6, '07:21:00', NULL, NULL),
(702, 77, 'GIRLS HIGHER SECONDARY SCHOOL', 7, '07:23:00', NULL, NULL),
(703, 77, 'V.R.P. NAIDU TURNING', 8, '07:25:00', NULL, NULL),
(704, 77, 'RATION SHOP STOP', 9, '07:27:00', NULL, NULL),
(705, 77, 'MALLIGAI MAHAL', 10, '07:30:00', NULL, NULL),
(706, 77, 'NEW BUS STAND', 11, '07:32:00', NULL, NULL),
(707, 77, 'SARATHUPATTI', 12, '07:50:00', NULL, NULL),
(708, 77, 'T.M.H.N.U. SCHOOL', 13, '08:05:00', NULL, NULL),
(709, 78, 'SENGULATHUPATTI', 1, '07:00:00', NULL, NULL),
(710, 78, 'ENDAPULIPUTHUPATTI', 2, '07:15:00', NULL, NULL),
(711, 78, 'SARATHUPATTI VILAKKU', 3, '07:20:00', NULL, NULL),
(712, 78, 'R.M.T.C. SHED', 4, '07:25:00', NULL, NULL),
(713, 78, 'JEYA THEATER', 5, '07:27:00', NULL, NULL),
(714, 78, 'MOONRANDHAL', 6, '07:30:00', NULL, NULL),
(715, 78, 'THEVAR STATUE', 7, '07:32:00', NULL, NULL),
(716, 78, 'BHARATHI NAGAR', 8, '07:34:00', NULL, NULL),
(717, 78, 'KALLUPATTI', 9, '07:38:00', NULL, NULL),
(718, 78, 'R.T.O. OFFICE', 10, '07:40:00', NULL, NULL),
(719, 78, 'UZHAVAR SANDHAI', 11, '07:42:00', NULL, NULL),
(720, 78, 'KAILASAPATTI', 12, '07:45:00', NULL, NULL),
(721, 78, 'LAKSHMIPURAM', 13, '07:50:00', NULL, NULL),
(722, 78, 'MEENA VILAKKU', 14, '07:55:00', NULL, NULL),
(723, 78, 'T.M.H.N.U. SCHOOL', 15, '08:15:00', NULL, NULL),
(724, 79, 'JAYAMANGALAM', 1, '07:00:00', NULL, NULL),
(725, 79, 'MELMANGALAM', 2, '07:10:00', NULL, NULL),
(726, 79, 'KALIAMMAN TEMPLE', 3, '07:15:00', NULL, NULL),
(727, 79, 'BUS STOP', 4, '07:20:00', NULL, NULL),
(728, 79, 'UNION OFFICE', 5, '07:22:00', NULL, NULL),
(729, 79, 'KALLU KATTU', 6, '07:25:00', NULL, NULL),
(730, 79, 'VADUGAPATTI THEATER STOP', 7, '07:30:00', NULL, NULL),
(731, 79, 'LIBRARY STOP', 8, '07:30:00', NULL, NULL),
(732, 79, 'BHAGAVATHIAMMAN TEMPLE', 9, '07:37:00', NULL, NULL),
(733, 79, 'THAMARAIKULAM PERUMAL TEMPLE', 10, '07:38:00', NULL, NULL),
(734, 79, 'V.O.C. STATUE', 11, '07:39:00', NULL, NULL),
(735, 79, 'LAKSHMIPURAM S.B.T. STOP', 12, '07:45:00', NULL, NULL),
(736, 79, 'T.M.H.N.U. SCHOOL', 13, '08:05:00', NULL, NULL),
(737, 80, 'POLICE QUARTERS, KATTABOMMAN STATUE', 1, '07:20:00', NULL, NULL),
(738, 80, 'UZHAVAR SANDHAI', 2, '07:24:00', NULL, NULL),
(739, 80, 'DURAIYAPPA MANDAPAM', 3, '07:30:00', NULL, NULL),
(740, 80, 'MARAVAR MANDAPAM', 4, '07:35:00', NULL, NULL),
(741, 80, 'ICE COMPANY', 5, '07:37:00', NULL, NULL),
(742, 80, 'VALLUVAR STATUE', 6, '07:40:00', NULL, NULL),
(743, 80, 'POLICE STATION', 7, '07:42:00', NULL, NULL),
(744, 80, 'THEVAR STATUE', 8, '07:45:00', NULL, NULL),
(745, 80, 'SURYA MEDICAL', 9, '07:48:00', NULL, NULL),
(746, 80, 'OLD BUS STAND', 10, '07:50:00', NULL, NULL),
(747, 80, 'PARK STOP', 11, '08:00:00', NULL, NULL),
(748, 80, 'MEENA VILAKKU', 12, '08:05:00', NULL, NULL),
(749, 80, 'T.M.H.N.U. SCHOOL', 13, '08:20:00', NULL, NULL),
(750, 81, 'C.P.A. COLLEGE', 1, '07:00:00', NULL, NULL),
(751, 81, 'KUNDALEESWARAR TEMPLE', 2, '07:20:00', NULL, NULL),
(752, 81, 'VETRI THEATER', 3, '07:31:00', NULL, NULL),
(753, 81, 'SURYA MEDICAL', 4, '07:40:00', NULL, NULL),
(754, 81, 'OLD BUS STAND', 5, '07:45:00', NULL, NULL),
(755, 81, 'SENAITHALAIVAR MANDAPAM', 6, '07:45:00', NULL, NULL),
(756, 81, 'KALIAMMAN TEMPLE', 7, '07:50:00', NULL, NULL),
(757, 81, 'KAMARAJAR STATUE', 8, '07:55:00', NULL, NULL),
(758, 81, 'T.M.H.N.U. SCHOOL', 9, '08:15:00', NULL, NULL),
(759, 82, 'MEENACHIPURAM', 1, '07:15:00', NULL, NULL),
(760, 82, 'KEEZHA CHOKKANATHAPURAM', 2, '07:28:00', NULL, NULL),
(761, 82, 'MELA CHOKKANATHAPURAM 1ST STOP', 3, '07:31:00', NULL, NULL),
(762, 82, 'MELA CHOKKANATHAPURAM 2ND STOP', 4, '07:33:00', NULL, NULL),
(763, 82, 'KARATTUPATTI', 5, '07:35:00', NULL, NULL),
(764, 82, 'RANGANATHAPURAM 1ST STOP', 6, '07:38:00', NULL, NULL),
(765, 82, 'RANGANATHAPURAM 2ND STOP', 7, '07:40:00', NULL, NULL),
(766, 82, 'KRISHNA NAGAR', 8, '07:42:00', NULL, NULL),
(767, 82, 'PANKAJAM HOUSE', 9, '07:44:00', NULL, NULL),
(768, 82, 'VETRILAICHAVADI', 10, '07:45:00', NULL, NULL),
(769, 82, 'CHURCH STOP', 11, '07:46:00', NULL, NULL),
(770, 82, 'PARK STOP', 12, '07:50:00', NULL, NULL),
(771, 82, 'T.M.H.N.U. SCHOOL', 13, '08:01:00', NULL, NULL),
(772, 83, 'ROYAL BAKERY', 1, '07:25:00', NULL, NULL),
(773, 83, 'GLASS SHOP', 2, '07:30:00', NULL, NULL),
(774, 83, 'MUTHALAMMAN TEMPLE', 3, '07:32:00', NULL, NULL),
(775, 83, 'KALLAR MANDAPAM', 4, '07:34:00', NULL, NULL),
(776, 83, 'MIN NAGAR', 5, '07:40:00', NULL, NULL),
(777, 83, 'SIVAN TEMPLE', 6, '07:42:00', NULL, NULL),
(778, 83, 'IIT STOP', 7, '07:48:00', NULL, NULL),
(779, 83, 'BUILDING SOCIETY 1ST STOP', 8, '07:50:00', NULL, NULL),
(780, 83, 'ICE COMPANY', 9, '07:52:00', NULL, NULL),
(781, 83, 'KANNAMMAL TEMPLE', 10, '07:58:00', NULL, NULL),
(782, 83, 'SEELAYAMPATTI 1', 11, '08:00:00', NULL, NULL),
(783, 83, 'SEELAYAMPATTI 2 BUS STOP', 12, '08:05:00', NULL, NULL),
(784, 83, 'SEELAYAMPATTI - VEPPAMPATTI', 13, '08:05:00', NULL, NULL),
(785, 83, 'T.M.H.N.U. SCHOOL', 14, '08:20:00', NULL, NULL),
(786, 84, 'ERASAI', 1, '07:00:00', NULL, NULL),
(787, 84, 'KANNISERVAIPATTI', 2, '07:05:00', NULL, NULL),
(788, 84, 'PUTHAMPATTI', 3, '07:10:00', NULL, NULL),
(789, 84, 'APPIPATTI', 4, '07:15:00', NULL, NULL),
(790, 84, 'KARICHIPATTI', 5, '07:25:00', NULL, NULL),
(791, 84, 'AYYANARPURAM', 6, '07:30:00', NULL, NULL),
(792, 84, 'OTHAVEEDU', 7, '07:33:00', NULL, NULL),
(793, 84, 'THEVAR NAGAR', 8, '07:35:00', NULL, NULL),
(794, 84, 'CHINNAMANUR', 9, '07:37:00', NULL, NULL),
(795, 84, 'THERADI NAGAR', 10, '07:39:00', NULL, NULL),
(796, 84, 'I.T.I. STOP', 11, '07:40:00', NULL, NULL),
(797, 84, 'BUILDING SOCIETY 1ST STOP', 12, '07:42:00', NULL, NULL),
(798, 84, 'BUILDING SOCIETY 2ND STOP', 13, '07:45:00', NULL, NULL),
(799, 84, 'KANNAMMAAL GARDEN', 14, '07:46:00', NULL, NULL),
(800, 84, 'SEELAYAMPATTI OUTER', 15, '07:52:00', NULL, NULL),
(801, 84, 'T.M.H.N.U. SCHOOL', 16, '08:10:00', NULL, NULL),
(802, 85, 'MIN NAGAR', 1, '07:30:00', NULL, NULL),
(803, 85, 'PECHIAMMAN TEMPLE', 2, '07:32:00', NULL, NULL),
(804, 85, 'HIGH SCHOOL', 3, '07:35:00', NULL, NULL),
(805, 85, 'SIVAN TEMPLE', 4, '07:37:00', NULL, NULL),
(806, 85, 'MUTHALAMMAN TEMPLE', 5, '07:40:00', NULL, NULL),
(807, 85, 'GLASS SHOP', 6, '07:42:00', NULL, NULL),
(808, 85, 'PONNUCHAMY THEATER', 7, '07:50:00', NULL, NULL),
(809, 85, 'MAHARAJA', 8, '07:52:00', NULL, NULL),
(810, 85, 'ROYAL BAKERY', 9, '07:55:00', NULL, NULL),
(811, 85, 'SEELAYAMPATTI 1ST STOP', 10, '07:57:00', NULL, NULL),
(812, 85, 'SEELAYAMPATTI 2ND STOP', 11, '08:00:00', NULL, NULL),
(813, 85, 'BALAGURUNATHAPURAM', 12, '08:05:00', NULL, NULL),
(814, 85, 'T.M.H.N.U. SCHOOL', 13, '08:12:00', NULL, NULL),
(815, 86, 'KOMBAI', 1, '06:40:00', NULL, NULL),
(816, 86, 'MALLINGAPURAM', 2, '06:55:00', NULL, NULL),
(817, 86, 'METTUPATTI', 3, '06:56:00', NULL, NULL),
(818, 86, 'THEVARAM', 4, '07:00:00', NULL, NULL),
(819, 86, 'OVULAPURAM', 5, '07:05:00', NULL, NULL),
(820, 86, 'LAKSHMINAYAKKANPATTI', 6, '07:10:00', NULL, NULL),
(821, 86, 'ALAGARNAYAKKANPATTI', 7, '07:20:00', NULL, NULL),
(822, 86, 'VEMBAKOTTAI', 8, '07:21:00', NULL, NULL),
(823, 86, 'SANKARAPURAM', 9, '07:35:00', NULL, NULL),
(824, 86, 'THEENAVILAKKU', 10, '07:50:00', NULL, NULL),
(825, 86, 'KARAYANPATTI 1ST STOP', 11, '07:55:00', NULL, NULL),
(826, 86, 'KARAYANPATTI 2ND STOP', 12, '07:56:00', NULL, NULL),
(827, 86, 'UPPUKOTTAI', 13, '08:05:00', NULL, NULL),
(828, 86, 'T.M.H.N.U. SCHOOL', 14, '08:15:00', NULL, NULL),
(829, 87, 'CUMBUM', 1, '07:00:00', NULL, NULL),
(830, 87, 'ANUMANTHANPATTI', 2, '07:15:00', NULL, NULL),
(831, 87, 'PALAYAM BUS STOP', 3, '07:20:00', NULL, NULL),
(832, 87, 'PALAYAM BYPASS', 4, '07:25:00', NULL, NULL),
(833, 87, 'AMMAPATTI VILAKKU', 5, '07:26:00', NULL, NULL),
(834, 87, 'PUDUR', 6, '07:30:00', NULL, NULL),
(835, 87, 'ELLAPATTI', 7, '07:40:00', NULL, NULL),
(836, 87, 'MARKAYANKOTTAI', 8, '07:45:00', NULL, NULL),
(837, 87, 'KUCHANUR 1ST STOP', 9, '07:50:00', NULL, NULL),
(838, 87, 'KUCHANUR 2ND STOP', 10, '08:00:00', NULL, NULL),
(839, 87, 'KUCHANUR 3RD STOP', 11, '08:02:00', NULL, NULL),
(840, 87, 'KUCHANUR 4TH STOP', 12, '08:03:00', NULL, NULL),
(841, 87, 'DURAISAMYPURAM', 13, '08:05:00', NULL, NULL),
(842, 87, 'KOOLAYANUR', 14, '08:06:00', NULL, NULL),
(843, 87, 'BALARPATTI', 15, '08:10:00', NULL, NULL),
(844, 87, 'KUNDALANAYAKKANPATTI', 16, '08:15:00', NULL, NULL),
(845, 87, 'T.M.H.N.U. SCHOOL', 17, '08:20:00', NULL, NULL),
(846, 88, 'DHARMATHUPATTI', 1, '07:10:00', NULL, NULL),
(847, 88, 'SILAMARATHUPATTI', 2, '07:20:00', NULL, NULL),
(848, 88, 'SILAMALAI', 3, '07:30:00', NULL, NULL),
(849, 88, 'IRASINGAPURAM 1ST STOP', 4, '07:40:00', NULL, NULL),
(850, 88, 'THIMMINAYAKKANPATTI', 5, '07:50:00', NULL, NULL),
(851, 88, 'POTTIPURAM', 6, '07:55:00', NULL, NULL),
(852, 88, 'IRASINGAPURAM', 7, '08:05:00', NULL, NULL),
(853, 88, 'I.O.B. BANK', 8, '08:06:00', NULL, NULL),
(854, 88, 'T.M.H.N.U. SCHOOL', 9, '08:25:00', NULL, NULL),
(855, 89, 'PERUMAL GOUNDANPATTI', 1, '07:35:00', NULL, NULL),
(856, 89, 'DOMPUCHERY 1ST STOP', 2, '07:38:00', NULL, NULL),
(857, 89, 'DOMPUCHERY 2ND STOP', 3, '07:40:00', NULL, NULL),
(858, 89, 'G.H STOP', 4, '07:45:00', NULL, NULL),
(859, 89, 'UPPUKOTTAI - MG MAHAL', 5, '07:50:00', NULL, NULL),
(860, 89, 'UPPUKOTTAI - I BUS STOP', 6, '07:55:00', NULL, NULL),
(861, 89, 'UPPUKOTTAI - II BUS STOP', 7, '07:57:00', NULL, NULL),
(862, 89, 'MANICKAPURAM - BUS STOP', 8, '07:59:00', NULL, NULL),
(863, 89, 'BODENTHIRAPURAM - I BUS STOP', 9, '08:05:00', NULL, NULL),
(864, 89, 'BODENTHIRAPURAM - II BUS STOP', 10, '08:05:00', NULL, NULL),
(865, 89, 'T.M.H.N.U. SCHOOL', 11, '08:10:00', NULL, NULL),
(866, 90, 'PULIKUTHI I & II', 1, '07:00:00', NULL, NULL),
(867, 90, 'NAGALAPURAM', 2, '07:30:00', NULL, NULL),
(868, 90, 'T.M.H.N.U. SCHOOL', 3, '08:15:00', NULL, NULL),
(869, 91, 'SUKKANGALPATTI', 1, '07:10:00', NULL, NULL),
(870, 91, 'MURTHINAYAKKANPATTI', 2, '07:14:00', NULL, NULL),
(871, 91, 'ODAIPATTI', 3, '07:21:00', NULL, NULL),
(872, 91, 'SEEPALAKOTTAI', 4, '07:30:00', NULL, NULL),
(873, 91, 'KAMATCHIPURAM', 5, '07:36:00', NULL, NULL),
(874, 91, 'VEPPAMPATTI', 6, '07:48:00', NULL, NULL),
(875, 91, 'POOMALAIKUNDU', 7, '07:55:00', NULL, NULL),
(876, 91, 'DHARMAPURI', 8, '08:00:00', NULL, NULL),
(877, 91, 'KOTTUR', 9, '08:13:00', NULL, NULL),
(878, 91, 'T.M.H.N.U. SCHOOL', 10, '08:31:00', NULL, NULL),
(879, 92, 'SUKKANGALPATTI', 1, '06:50:00', NULL, NULL),
(880, 92, 'MURTHI NAYAKKANPATTI', 2, '06:55:00', NULL, NULL),
(881, 92, 'ODAIPATTI SAMATHUVAPURAM - GANDHI STATUE', 3, '07:05:00', NULL, NULL),
(882, 92, 'ODAIPATTI SAMATHUVAPURAM - RICE MILL', 4, '07:10:00', NULL, NULL),
(883, 92, 'ODAIPATTI SAMATHUVAPURAM - THEATER STOP', 5, '07:15:00', NULL, NULL),
(884, 92, 'ODAIPATTI SAMATHUVAPURAM - BRIDGE STOP', 6, '07:17:00', NULL, NULL),
(885, 92, 'ODAIPATTI - KARIKADAI', 7, '07:20:00', NULL, NULL),
(886, 92, 'SEEPALAKOTTAI', 8, '07:35:00', NULL, NULL),
(887, 92, 'SEEPALAKOTTAI - RATION SHOP', 9, '07:37:00', NULL, NULL),
(888, 92, 'KAMATCHIPURAM', 10, '07:40:00', NULL, NULL),
(889, 92, 'VEPPAMPATTI', 11, '07:45:00', NULL, NULL),
(890, 92, 'POOMALAIKUNDU', 12, '07:50:00', NULL, NULL),
(891, 92, 'DHARMAPURI', 13, '07:55:00', NULL, NULL),
(892, 92, 'KOTTUR', 14, '08:00:00', NULL, NULL),
(893, 92, 'T.M.H.N.U. SCHOOL', 15, '08:15:00', NULL, NULL),
(894, 93, 'VARUSANADU', 1, '06:45:00', NULL, NULL),
(895, 93, 'MAYILADUMPARAI', 2, '07:00:00', NULL, NULL),
(896, 93, 'KADAMALAIKUNDU 1ST STOP', 3, '07:10:00', NULL, NULL),
(897, 93, 'KADAMALAIKUNDU 2ND STOP', 4, '07:12:00', NULL, NULL),
(898, 93, 'KADAMALAIKUNDU 3RD STOP', 5, '07:15:00', NULL, NULL),
(899, 93, 'KADAMALAIKUNDU 4TH STOP', 6, '07:17:00', NULL, NULL),
(900, 93, 'KADAMALAIKUNDU 5TH STOP', 7, '07:18:00', NULL, NULL),
(901, 93, 'PALUTHU STOP', 8, '07:20:00', NULL, NULL),
(902, 93, 'DURAISAMYPURAM', 9, '07:25:00', NULL, NULL),
(903, 93, 'KUPPINAYAKKANPATTI', 10, '07:35:00', NULL, NULL),
(904, 93, 'LAKSHMIPURAM', 11, '07:45:00', NULL, NULL),
(905, 93, 'GOVINDHA NAGARAM', 12, '07:50:00', NULL, NULL),
(906, 93, 'KONAMPATTI', 13, '08:00:00', NULL, NULL),
(907, 93, 'KODUVILARPATTI', 14, '08:10:00', NULL, NULL),
(908, 93, 'T.M.H.N.U. SCHOOL', 15, '08:30:00', NULL, NULL),
(909, 94, 'SAMATHUVAPURAM STOP', 1, '06:50:00', NULL, NULL),
(910, 94, 'PONNAMMALPATTI, KANDAMANUR', 2, '06:55:00', NULL, NULL),
(911, 94, 'MAYA DRIVING SCHOOL', 3, '06:56:00', NULL, NULL),
(912, 94, 'KANDAMANUR OUTER STOP', 4, '07:00:00', NULL, NULL),
(913, 94, 'MARIAMMAN TEMPLE STOP', 5, '07:02:00', NULL, NULL),
(914, 94, 'MEDICAL STOP', 6, '07:04:00', NULL, NULL),
(915, 94, 'KANDAMANUR BUS STOP', 7, '07:10:00', NULL, NULL),
(916, 94, 'KANDAMANUR VINAYAGAR, MURUGAN TEMPLE', 8, '07:15:00', NULL, NULL),
(917, 94, 'VENKATACHALAPURAM', 9, '07:30:00', NULL, NULL),
(918, 94, 'KATTUNAYAKKANPATTI', 10, '07:35:00', NULL, NULL),
(919, 94, 'THAPPUKUNDU', 11, '07:38:00', NULL, NULL),
(920, 94, 'THADICHERY', 12, '07:40:00', NULL, NULL),
(921, 94, 'SRI RENGAPURAM', 13, '07:50:00', NULL, NULL),
(922, 94, 'VAYALPATTI STOP', 14, '07:58:00', NULL, NULL),
(923, 94, 'T.M.H.N.U. SCHOOL', 15, '08:15:00', NULL, NULL),
(924, 95, 'HIGH SCHOOL 1ST STOP', 1, '07:25:00', NULL, NULL),
(925, 95, 'HIGH SCHOOL 2ND STOP', 2, '07:27:00', NULL, NULL),
(926, 95, 'VAZHAIYATHUPATTI', 3, '07:29:00', NULL, NULL),
(927, 95, 'PERUMAL TEMPLE STOP', 4, '07:32:00', NULL, NULL),
(928, 95, 'COCONUT TREE STOP', 5, '07:35:00', NULL, NULL),
(929, 95, 'VAZHAIYATHUPATTI 2ND STOP', 6, '07:37:00', NULL, NULL),
(930, 95, 'BUREAU COMPANY STOP', 7, '07:40:00', NULL, NULL),
(931, 95, 'ADHIPATTI STOP', 8, '07:45:00', NULL, NULL),
(932, 95, 'SUBIKSHAM AVENUE', 9, '07:52:00', NULL, NULL),
(933, 95, 'NANDHA OIL MILL STOP', 10, '07:53:00', NULL, NULL),
(934, 95, 'T.M.H.N.U. SCHOOL', 11, '08:00:00', NULL, NULL),
(935, 96, 'TEMPLE CITY', 1, '07:15:00', NULL, NULL),
(936, 96, 'DAKSHINAMURTHY TEMPLE', 2, '07:20:00', NULL, NULL),
(937, 96, 'MULLAINAGAR 1ST STOP', 3, '07:25:00', NULL, NULL),
(938, 96, 'MULLAINAGAR 2ND STOP', 4, '07:27:00', NULL, NULL);
INSERT INTO `stops` (`id`, `route_id`, `stop_name`, `sequence`, `scheduled_time`, `latitude`, `longitude`) VALUES
(939, 96, 'MULLAINAGAR 3RD STOP', 5, '07:29:00', NULL, NULL),
(940, 96, 'NEERMATTAM', 6, '07:32:00', NULL, NULL),
(941, 96, 'VINAYAGAR HOSPITAL', 7, '07:35:00', NULL, NULL),
(942, 96, 'AMBEDKAR STATUE', 8, '07:37:00', NULL, NULL),
(943, 96, 'PUDUR VILAKKU', 9, '07:39:00', NULL, NULL),
(944, 96, 'PUGAZH COFFEE BAR', 10, '07:45:00', NULL, NULL),
(945, 96, 'THITTASALAI', 11, '07:50:00', NULL, NULL),
(946, 96, 'T.M.H.N.U. SCHOOL', 12, '07:59:00', NULL, NULL),
(947, 97, 'SOWDAMBAL TEMPLE', 1, '07:35:00', NULL, NULL),
(948, 97, 'GOVERNMENT SCHOOL', 2, '07:36:00', NULL, NULL),
(949, 97, 'AMMAN SILKS', 3, '07:37:00', NULL, NULL),
(950, 97, 'ELECTRIC CITY', 4, '07:39:00', NULL, NULL),
(951, 97, 'PASUMAI NAGAR', 5, '07:40:00', NULL, NULL),
(952, 97, 'VALLAMAI GOPURAM', 6, '07:41:00', NULL, NULL),
(953, 97, 'SPORTS CLUB', 7, '07:43:00', NULL, NULL),
(954, 97, 'POST OFFICE - ARANMANAIPUDUR', 8, '07:45:00', NULL, NULL),
(955, 97, 'BANGALAMEDU', 9, '07:50:00', NULL, NULL),
(956, 97, 'GANAPATHY SILKS', 10, '07:55:00', NULL, NULL),
(957, 97, 'LMC', 11, '08:00:00', NULL, NULL),
(958, 97, 'T.M.H.N.U. SCHOOL', 12, '08:10:00', NULL, NULL),
(959, 98, 'MADURAPURI', 1, '07:15:00', NULL, NULL),
(960, 98, 'VADAPUDUPATTI', 2, '07:25:00', NULL, NULL),
(961, 98, 'ANNANJI', 3, '07:30:00', NULL, NULL),
(962, 98, 'PALLIVASAL', 4, '07:32:00', NULL, NULL),
(963, 98, 'KRISHNAN TEMPLE', 5, '07:35:00', NULL, NULL),
(964, 98, 'ANBU STORE', 6, '07:40:00', NULL, NULL),
(965, 98, 'YAANAI MILL STOP', 7, '07:42:00', NULL, NULL),
(966, 98, 'JEYAM NAGAR', 8, '07:44:00', NULL, NULL),
(967, 98, 'T.M.H.N.U. SCHOOL', 9, '08:00:00', NULL, NULL);

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
  `shift` enum('morning','evening') DEFAULT 'morning',
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trip_logs`
--

INSERT INTO `trip_logs` (`id`, `bus_id`, `driver_id`, `log_date`, `shift`, `start_time`, `start_km`, `end_time`, `end_km`, `end_stop`, `start_stop`, `created_at`) VALUES
(1, NULL, 3, '2026-07-28', 'trip1', '2026-07-28 12:46:48', 45200, '2026-07-28 14:46:48', 45250, 'Aundipatti', NULL, '2026-07-29 07:16:48'),
(2, NULL, 3, '2026-07-28', 'trip2', '2026-07-29 04:46:48', 45250, '2026-07-29 06:46:48', 45276, 'College', NULL, '2026-07-29 07:16:48'),
(3, NULL, 3, '2026-07-28', 'trip1', '2026-07-28 12:46:48', 38010, '2026-07-28 14:46:48', 38040, 'Kanavilaku', NULL, '2026-07-29 07:16:48');

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

--
-- Dumping data for table `tyres`
--

INSERT INTO `tyres` (`id`, `bus_id`, `tyre_position`, `tyre_brand`, `tyre_size`, `year_of_make`, `tyre_quality`, `serial_no`, `purchase_date`, `purchase_price`, `fitted_date`, `fitted_odometer_km`, `current_km_run`, `expected_life_km`, `condition_status`, `tyre_status`, `remarks`, `created_at`) VALUES
(1, NULL, 'Front Left', 'MRF', '10.00 R20', '2024', 'original', NULL, '2026-01-10', 18500.00, '2026-01-15', 42000.00, 40000.00, 60000.00, 'good', 'active', NULL, '2026-07-29 07:16:48'),
(2, NULL, 'Front Right', 'Apollo', '10.00 R20', '2024', 'original', NULL, '2026-01-10', 18200.00, '2026-01-15', 42000.00, 40000.00, 60000.00, 'good', 'active', NULL, '2026-07-29 07:16:48'),
(3, NULL, 'Rear Left Outer', 'CEAT', '10.00 R20', '2023', 'second', NULL, '2025-06-24', 9500.00, '2025-06-29', 30000.00, 55000.00, 55000.00, 'worn', 'replaced', NULL, '2026-07-29 07:16:48');

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
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `institution_id`, `created_at`) VALUES
(1, 'Admin Office', 'admin@tms.in', '9000000001', '$2a$12$ZTvTgykmAiMJ8vE3AsyKXeijguMY5uKNAZGIhF0xzk0a9WKmtsbty', 'admin', NULL, '2026-07-29 07:16:48'),
(2, 'Murugan (Incharge)', 'incharge@tms.in', '9000000002', '$2a$10$je792hzoLgx91pF633iRNuKz/nDTcfW7vYejqeJ.XGtEya5ZBrwxS', 'incharge', 1, '2026-07-29 07:16:48'),
(3, 'Selvam (Driver)', 'driver@tms.in', '9000000003', '$2a$10$je792hzoLgx91pF633iRNuKz/nDTcfW7vYejqeJ.XGtEya5ZBrwxS', 'driver', 1, '2026-07-29 07:16:48'),
(4, 'Lakshmi (Parent)', 'parent@tms.in', '9000000004', '$2a$10$je792hzoLgx91pF633iRNuKz/nDTcfW7vYejqeJ.XGtEya5ZBrwxS', 'parent', NULL, '2026-07-29 07:16:48'),
(5, 'Executive Office', 'executive@tms.in', '9000000009', '$2a$12$ZTvTgykmAiMJ8vE3AsyKXeijguMY5uKNAZGIhF0xzk0a9WKmtsbty', 'executive', NULL, '2026-07-29 07:16:48'),
(6, 'Institution Incharge', 'institution@tms.in', '9000000010', '$2a$12$ZTvTgykmAiMJ8vE3AsyKXeijguMY5uKNAZGIhF0xzk0a9WKmtsbty', 'institution', 1, '2026-07-29 07:16:48'),
(7, 'ABBAS M', '8754153452@tms.in', '8754153452', '$2a$10$HUSHTV8lsxPpeKxf/1Lsr.uWHS6Bo/kfHcGbrWR7MWJ4R31/pTfMK', 'driver', NULL, '2026-08-23 05:40:57'),
(8, 'Nagaraja', 'nagaraja@tms.in', NULL, '$2a$10$gPqVTrys4In3Zpm3joxVCue9wRM.vaKng32BZ67TPK5ShrGuQ/jPi', 'institution', 1, '2026-08-23 05:42:57'),
(9, 'deva', 'nsschool@gmail.com', NULL, '$2a$10$htS0Y3MmNHCyv8aLeQOy8Oc.b5FBD61ah9C5TnXSuSa5VmvBAGSnC', 'institution', 3, '2026-08-24 10:27:39');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `buses`
--
ALTER TABLE `buses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=504;

--
-- AUTO_INCREMENT for table `bus_locations`
--
ALTER TABLE `bus_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `institutions`
--
ALTER TABLE `institutions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `maintenance_logs`
--
ALTER TABLE `maintenance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `stops`
--
ALTER TABLE `stops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=968;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `trip_logs`
--
ALTER TABLE `trip_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tyres`
--
ALTER TABLE `tyres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
