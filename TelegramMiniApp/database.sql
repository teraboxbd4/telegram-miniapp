-- MySQL dump 10.13  Distrib 8.4.6, for Linux (x86_64)
--
-- Host: localhost    Database: your_database_name
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'admin','CHANGE_THIS_PASSWORD_HASH');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ads_config`
--

DROP TABLE IF EXISTS `ads_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ads_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position` varchar(50) DEFAULT NULL,
  `script` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ads_config`
--

LOCK TABLES `ads_config` WRITE;
/*!40000 ALTER TABLE `ads_config` DISABLE KEYS */;
INSERT INTO `ads_config` VALUES (1,'quiz_start','<!-- Add your rewarded ad code here -->','2025-01-01 12:00:00'),(2,'after_4_questions','<!-- Add your interstitial ad code here -->','2025-01-01 12:00:00'),(3,'withdraw_click','<!-- Add your withdraw click ad code here -->','2025-01-01 12:00:00'),(4,'quiz_top_banner','<!-- Add your top banner ad code here -->','2025-01-01 12:00:00'),(5,'quiz_bottom_banner','<!-- Add your bottom banner ad code here -->','2025-01-01 12:00:00'),(6,'dashboard_300x250','<!-- Add your 300x250 ad code here -->','2025-01-01 12:00:00'),(7,'dashboard_300x50','','2025-01-01 12:00:00');
/*!40000 ALTER TABLE `ads_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'Welcome! This is a demo notification.',0,'2025-01-01 12:00:00');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_requests`
--

DROP TABLE IF EXISTS `payment_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `points` int DEFAULT NULL,
  `usd_value` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payment_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_requests`
--

LOCK TABLES `payment_requests` WRITE;
/*!40000 ALTER TABLE `payment_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_results`
--

DROP TABLE IF EXISTS `quiz_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `telegram_id` varchar(50) DEFAULT NULL,
  `quiz_id` int DEFAULT NULL,
  `score` int DEFAULT '0',
  `played_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_results`
--

LOCK TABLES `quiz_results` WRITE;
/*!40000 ALTER TABLE `quiz_results` DISABLE KEYS */;
INSERT INTO `quiz_results` VALUES (1,'tg_demo_001',17,15,'2025-01-02 12:00:00'),(2,'tg_demo_002',18,20,'2025-01-02 13:00:00');
/*!40000 ALTER TABLE `quiz_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `question1` text,
  `option1a` varchar(200) DEFAULT NULL,
  `option1b` varchar(200) DEFAULT NULL,
  `option1c` varchar(200) DEFAULT NULL,
  `option1d` varchar(200) DEFAULT NULL,
  `correct1` varchar(200) DEFAULT NULL,
  `question2` text,
  `option2a` varchar(200) DEFAULT NULL,
  `option2b` varchar(200) DEFAULT NULL,
  `option2c` varchar(200) DEFAULT NULL,
  `option2d` varchar(200) DEFAULT NULL,
  `correct2` varchar(200) DEFAULT NULL,
  `total_points` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `question3` text,
  `option3a` varchar(200) DEFAULT NULL,
  `option3b` varchar(200) DEFAULT NULL,
  `option3c` varchar(200) DEFAULT NULL,
  `option3d` varchar(200) DEFAULT NULL,
  `correct3` varchar(200) DEFAULT NULL,
  `question4` text,
  `option4a` varchar(200) DEFAULT NULL,
  `option4b` varchar(200) DEFAULT NULL,
  `option4c` varchar(200) DEFAULT NULL,
  `option4d` varchar(200) DEFAULT NULL,
  `correct4` varchar(200) DEFAULT NULL,
  `question5` text,
  `option5a` varchar(200) DEFAULT NULL,
  `option5b` varchar(200) DEFAULT NULL,
  `option5c` varchar(200) DEFAULT NULL,
  `option5d` varchar(200) DEFAULT NULL,
  `correct5` varchar(200) DEFAULT NULL,
  `question6` text,
  `option6a` varchar(200) DEFAULT NULL,
  `option6b` varchar(200) DEFAULT NULL,
  `option6c` varchar(200) DEFAULT NULL,
  `option6d` varchar(200) DEFAULT NULL,
  `correct6` varchar(200) DEFAULT NULL,
  `question7` text,
  `option7a` varchar(200) DEFAULT NULL,
  `option7b` varchar(200) DEFAULT NULL,
  `option7c` varchar(200) DEFAULT NULL,
  `option7d` varchar(200) DEFAULT NULL,
  `correct7` varchar(200) DEFAULT NULL,
  `question8` text,
  `option8a` varchar(200) DEFAULT NULL,
  `option8b` varchar(200) DEFAULT NULL,
  `option8c` varchar(200) DEFAULT NULL,
  `option8d` varchar(200) DEFAULT NULL,
  `correct8` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES (17,'Worldwide Cricket Quiz','Who has the most runs in Cricket history?','Ricky Ponting','Sachin Tendulkar','Kumar Sangakkara','Virat Kohli','Sachin Tendulkar','Which team won the T20 World Cup 2024?','South Africa','Australia','India','England','India',20,'2026-01-20 22:36:03','Which bowler is called Rawalpindi Express?','Brett Lee','Shoaib Akhtar','Shaun Tait','Wasim Akram','Shoaib Akhtar','In which year was the first Cricket World Cup played?','1975','1979','1983','1971','1975','Who hit the fastest century (100 runs) in ODI cricket?','Shahid Afridi','Corey Anderson','AB de Villiers','Chris Gayle','AB de Villiers','The Ashes is played between which two teams?','India vs Pakistan','England vs Australia','New Zealand vs South Africa','Australia vs West Indies','England vs Australia','How many wickets does Muttiah Muralitharan have in Test cricket?','700','708','800','810','800','How long is a cricket pitch?','20 yards','22 yards','24 yards','18 yards','22 yards'),(18,'Hollywood & Movies Quiz','Which movie made the most money in the world?','Avengers: Endgame','Titanic','Avatar','Star Wars','Avatar','Who played Iron Man in the movies?','Chris Evans','Robert Downey Jr.','Chris Hemsworth','Mark Ruffalo','Robert Downey Jr.',20,'2026-01-20 22:36:15','Who was the director of the movie Titanic?','Steven Spielberg','Christopher Nolan','James Cameron','Quentin Tarantino','James Cameron','Who played the Joker in The Dark Knight?','Joaquin Phoenix','Heath Ledger','Jared Leto','Jack Nicholson','Heath Ledger','Which house is Harry Potter in?','Slytherin','Hufflepuff','Ravenclaw','Gryffindor','Gryffindor','Why did John Wick take revenge in the first movie?','They stole his car','They killed his dog','They burned his house','They took his watch','They killed his dog','Which character says Ill be back?','Rambo','Terminator','Rocky','Robocop','Terminator','What was the name of Simbas father in The Lion King?','Scar','Timon','Mufasa','Rafiki','Mufasa'),(19,'Anime World Quiz','Who is the main hero of Dragon Ball Z?','Vegeta','Gohan','Goku','Piccolo','Goku','What is the name of the Shinigami (Death God) in Death Note?','Rem','Ryuk','Sidoh','Gelus','Ryuk',20,'2026-01-20 22:36:23','What is Luffys dream in One Piece?','Best Swordsman','Marine Admiral','Pirate King','Hokage','Pirate King','Which monster is inside Naruto?','One-Tailed Shukaku','Eight-Tails','Nine-Tailed Fox','Two-Tails','Nine-Tailed Fox','What are the names of the walls in Attack on Titan?','Maria, Rose, Sina','Alpha, Beta, Gamma','One, Two, Three','Gold, Silver, Bronze','Maria, Rose, Sina','Who is Tanjiros demon sister in Demon Slayer?','Kanao','Nezuko','Shinobu','Mitsuri','Nezuko','What is Saitamas hero name in One Punch Man?','Silver Fang','Caped Baldy','King','Mumen Rider','Caped Baldy','What type of Pokemon is Pikachu?','Fire','Water','Grass','Electric','Electric'),(20,'Cricket Records (Expert Level)','Which player hit 3 double centuries (200 runs) in ODI?','Chris Gayle','Virender Sehwag','Rohit Sharma','Martin Guptill','Rohit Sharma','When did Pakistan win the ODI World Cup?','1987','1992','1996','1999','1992',20,'2026-01-20 22:36:31','Who has the most wickets in the IPL?','Lasith Malinga','Yuzvendra Chahal','Dwayne Bravo','Jasprit Bumrah','Yuzvendra Chahal','Who scored 400 runs in a single Test match inning?','Brian Lara','Matthew Hayden','Don Bradman','Mahela Jayawardene','Brian Lara','Which player is known as Captain Cool?','Kane Williamson','MS Dhoni','Sarfaraz Ahmed','Steve Waugh','MS Dhoni','Which stadium is called the Home of Cricket?','MCG (Melbourne)','Eden Gardens (Kolkata)','Lords (London)','Gaddafi Stadium (Lahore)','Lords (London)','What is Babar Azams shirt number?','10','18','56','99','56','Who won the 2019 ODI World Cup?','New Zealand','India','Australia','England','England'),(21,'Mixed Entertainment (Movies & Anime)','What is the movie Interstellar about?','Car Racing','Space and Time Travel','War','Magic','Space and Time Travel','What color are Gojos eyes in Jujutsu Kaisen?','Red','Green','Blue','Black','Blue',20,'2026-01-20 22:36:38','What did Gabbar Singh ask in Sholay?','Are you happy?','How many men were there?','Do you know me?','Where is the money?','How many men were there?','What is Ichigos job in Bleach?','Soul Reaper','Ninja','Pirate','Alchemist','Soul Reaper','What is Tom Cruises name in Mission: Impossible?','James Bond','Jason Bourne','Ethan Hunt','Jack Reacher','Ethan Hunt','Who directed the movie Spirited Away?','Makoto Shinkai','Hayao Miyazaki','Mamoru Hosoda','Isao Takahata','Hayao Miyazaki','What is the name of the country in Black Panther?','Zamunda','Wakanda','Genosha','Latveria','Wakanda','What is Edward Elric called in Fullmetal Alchemist?','Flame Alchemist','Strong Arm Alchemist','Fullmetal Alchemist','Water Alchemist','Fullmetal Alchemist'),(22,'Action Movies & Anime Mix 1','What is Narutos favorite food?','Ramen','Sushi','Pizza','Burger','Ramen','Where does Batman live?','Gotham City','New York','Tokyo','London','Gotham City',20,'2026-01-20 22:38:03','How many Dragon Balls are there?','5','6','7','8','7','Who is the actor in The Terminator?','Arnold Schwarzenegger','Brad Pitt','Tom Cruise','The Rock','Arnold Schwarzenegger','What kind of hat does Luffy wear in One Piece?','Straw Hat','Cowboy Hat','Baseball Cap','Helmet','Straw Hat','What are the pill colors in The Matrix?','Red and Blue','Green and Yellow','Black and White','Purple and Orange','Red and Blue','What covers Kakashis face in Naruto?','A Mask','Scars','Glasses','Nothing','A Mask','What animals are in Jurassic Park?','Dinosaurs','Lions','Aliens','Robots','Dinosaurs'),(23,'Action Movies & Anime Mix 2','What is Supermans real human name?','Clark Kent','Bruce Wayne','Tony Stark','Steve Rogers','Clark Kent','Who is Sasukes brother in Naruto?','Itachi','Naruto','Kakashi','Madara','Itachi',20,'2026-01-20 22:38:11','Who is the main toy in Toy Story?','Woody','Buzz','Rex','Ham','Woody','How does L sit in Death Note?','With knees up','Legs crossed','Standing','Lying down','With knees up','What sport does Rocky Balboa play?','Boxing','Football','Cricket','Tennis','Boxing','What color is Gokus hair when Super Saiyan?','Yellow','Red','Blue','Black','Yellow','What is the boys name in Home Alone?','Kevin','John','Mike','Sam','Kevin','What item is used to catch Pokemon?','Poke Ball','Net','Box','Bag','Poke Ball');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referrals`
--

DROP TABLE IF EXISTS `referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referrals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ref_by` int DEFAULT NULL,
  `ref_user` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referrals`
--

LOCK TABLES `referrals` WRITE;
/*!40000 ALTER TABLE `referrals` DISABLE KEYS */;
/*!40000 ALTER TABLE `referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `reward` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `telegram_id` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `points` int DEFAULT '0',
  `binance_email` varchar(100) DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `balance` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `telegram_id` (`telegram_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'tg_demo_001','Demo User One',100,'demo1@example.com','2025-01-01 12:00:00',5.00),(2,'tg_demo_002','Demo User Two',50,'demo2@example.com','2025-01-01 12:00:00',2.50);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawals`
--

DROP TABLE IF EXISTS `withdrawals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdrawals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `method` varchar(50) DEFAULT 'Binance',
  `binance_email` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','paid','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawals`
--

LOCK TABLES `withdrawals` WRITE;
/*!40000 ALTER TABLE `withdrawals` DISABLE KEYS */;
INSERT INTO `withdrawals` VALUES (1,1,'Binance','demo1@example.com',2.50,'paid','2025-01-02 12:00:00','2025-01-02 12:00:00'),(2,2,'Binance','demo2@example.com',1.50,'pending','2025-01-03 12:00:00','2025-01-03 12:00:00');
/*!40000 ALTER TABLE `withdrawals` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-05 12:22:39
