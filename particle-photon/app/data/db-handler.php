<?php header('Content-Type: application/json');

if (isset($_POST['action'])) {
	switch ($_POST['action']) {
		case 'get':
			echo getHighscore();
			break;
		case 'add':
			if(isset($_POST['name']) || isset($_POST['score'])) 
				echo addHighscore($_POST['name'],$_POST['score']);
			break;
		case 'reset':
			echo resetHighscore();
			break;
		}
} else if (isset($_GET['action'])) {
	if ($_GET['action'] == 'get') echo getHighscore();
} else echo "define action to call";


function getHighscore() {

	$db = new SQLite3('pacman.db');
	createDataBase($db);
	$results = $db->query('SELECT name, score FROM highscore WHERE cheater = 0 ORDER BY score DESC LIMIT 10');
	while ($row = $results->fetchArray()) {
		$tmp["name"] = htmlspecialchars($row['name']);
		$tmp["score"] = strval($row['score']);
		$response[] = $tmp;		
	}
	if (!isset($response) || is_null($response)) return "[]";
	else return json_encode($response);
}

function addHighscore($name,$score) {

	$db = new SQLite3('pacman.db');
	$date = date('Y-m-d h:i:s', time());
	createDataBase($db);
	$ref = isset($_SERVER[ 'HTTP_REFERER']) ? $_SERVER[ 'HTTP_REFERER'] : "";
	$ua = isset($_SERVER[ 'HTTP_USER_AGENT']) ? $_SERVER[ 'HTTP_USER_AGENT'] : "";
	$remA = isset($_SERVER[ 'REMOTE_ADDR']) ? $_SERVER[ 'REMOTE_ADDR'] : "";
	$remH = isset($_SERVER[ 'REMOTE_HOST']) ? $_SERVER[ 'REMOTE_HOST'] : "";

	// some simple checks to avoid cheaters
	$ref_assert = preg_match('/http:\/\/.*pacman.platzh1rsch.ch/', $ref) > 0;
	$ua_assert = ($ua != "");
	$cheater = 0;
	if (!$ref_assert || !$ua_assert) {
		$cheater = 1;
	}

	$name_clean = htmlspecialchars($name);
	$score_clean = htmlspecialchars($score);

	$db->exec('INSERT INTO highscore VALUES ("' . $name . '", ' . $score . ', "' . $date . '", "' . $ref .'", "'. $ua . '", "' . $remA .'", "'. $remH . '", "'. $cheater.'")');

	$response['status'] = "success";
	$response['name'] = $name;
	$response['score'] = $score;
	$response['cheater'] = $cheater;
	return json_encode($response);
}

function resetHighscore() {
	$db = new SQLite3('pacman.db');
	$date = date('Y-m-d h:i:s', time());
	$db->exec('DROP TABLE IF EXISTS highscore');
	createDataBase($db);
}

function createDataBase($db) {
	$db->exec('CREATE TABLE IF NOT EXISTS highscore(name VARCHAR(60),score INT, date DATETIME, log_referer VARCHAR(200), log_user_agent VARCHAR(200), log_remote_addr VARCHAR(200), log_remote_host VARCHAR(200), cheater BOOLEAN)');
}

?>