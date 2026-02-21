-- Inject more sessions for Tom
INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 5, 120, 230, 0.460 FROM profiles WHERE username = 'SprintKing_Tom';

INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 7, 45, 270, 0.203 FROM profiles WHERE username = 'SprintKing_Tom';

-- Inject more sessions for Sarah
INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 3, 150, 200, 0.500 FROM profiles WHERE username = 'MountainGoat_Sarah';

INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 6, 60, 250, 0.250 FROM profiles WHERE username = 'MountainGoat_Sarah';

-- Inject sessions for Dave
INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 1, 90, 280, 0.420 FROM profiles WHERE username = 'AeroDynamic_Dave';

INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 2, 75, 290, 0.363 FROM profiles WHERE username = 'AeroDynamic_Dave';

INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 5, 120, 260, 0.520 FROM profiles WHERE username = 'AeroDynamic_Dave';

INSERT INTO sessions (user_id, date, minutes, average_wattage, kwh) 
SELECT id, CURRENT_DATE - 8, 60, 300, 0.300 FROM profiles WHERE username = 'AeroDynamic_Dave';
