function c(id, category, text) { return { id, category, text }; }

export const CHALLENGES = [
  // A. Physical Fun (12)
  c(1,'Physical Fun','Drink a full glass of water.'),
  c(2,'Physical Fun','Walk 10 steps around the room.'),
  c(3,'Physical Fun','Do 5 arm stretches.'),
  c(4,'Physical Fun','Stand up and sit down 3 times.'),
  c(5,'Physical Fun','Try to touch your toes for 10 seconds.'),
  c(6,'Physical Fun','Do 10 jumping jacks.'),
  c(7,'Physical Fun','Hold a plank for 15 seconds.'),
  c(8,'Physical Fun','Stretch your neck left and right 5 times.'),
  c(9,'Physical Fun','Do 5 squats.'),
  c(10,'Physical Fun','Roll your shoulders 10 times.'),
  c(11,'Physical Fun','Do 5 high knees on the spot.'),
  c(12,'Physical Fun','Balance on one leg for 15 seconds.'),
  // B. Singing (12)
  c(13,'Singing','Sing your favourite song chorus.'),
  c(14,'Singing','Sing a song without music for 10 seconds.'),
  c(15,'Singing','Sing the alphabet in a funny voice.'),
  c(16,'Singing','Hum a tune and let others guess it.'),
  c(17,'Singing','Sing a Bollywood chorus.'),
  c(18,'Singing','Sing happy birthday to any player.'),
  c(19,'Singing','Sing a song in a whisper.'),
  c(20,'Singing','Sing a children\'s rhyme.'),
  c(21,'Singing','Make up a song about Ludo and sing it.'),
  c(22,'Singing','Sing the last song you heard.'),
  c(23,'Singing','Sing a duet with another player.'),
  c(24,'Singing','Sing a line in an opera voice.'),
  // C. Poetry (12)
  c(25,'Poetry','Recite a short poem from memory.'),
  c(26,'Poetry','Create a 4-line poem about Ludo.'),
  c(27,'Poetry','Recite your favourite poem.'),
  c(28,'Poetry','Make a rhyme with your own name.'),
  c(29,'Poetry','Recite a 2-line poem on friendship.'),
  c(30,'Poetry','Create a rhyme about dice.'),
  c(31,'Poetry','Recite a poem in a dramatic voice.'),
  c(32,'Poetry','Make a poem about your university.'),
  c(33,'Poetry','Recite the first poem you ever learned.'),
  c(34,'Poetry','Create a haiku about the game.'),
  c(35,'Poetry','Recite a poem to a chosen player.'),
  c(36,'Poetry','Freestyle a 2-line rhyme.'),
  // D. Storytelling (12)
  c(37,'Storytelling','Tell a funny personal story in 30 seconds.'),
  c(38,'Storytelling','Make up a fictional story about a magical die.'),
  c(39,'Storytelling','Share a memorable university moment.'),
  c(40,'Storytelling','Tell a story using 3 random words: dragon, pencil, pizza.'),
  c(41,'Storytelling','Tell a 20-second ghost story.'),
  c(42,'Storytelling','Describe your dream vacation.'),
  c(43,'Storytelling','Tell a story about your best friend.'),
  c(44,'Storytelling','Narrate your day so far as a movie trailer.'),
  c(45,'Storytelling','Tell a story with a surprise ending.'),
  c(46,'Storytelling','Describe a funny childhood memory.'),
  c(47,'Storytelling','Tell a story about your first day at DIU.'),
  c(48,'Storytelling','Invent a new game and describe it.'),
  // E. Acting (14)
  c(49,'Acting','Act like a monkey for 10 seconds.'),
  c(50,'Acting','Imitate a robot.'),
  c(51,'Acting','Act as a news presenter reading the weather.'),
  c(52,'Acting','Pretend to be a fictional character for 15 seconds.'),
  c(53,'Acting','Imitate a famous movie scene.'),
  c(54,'Acting','Act like a cat for 10 seconds.'),
  c(55,'Acting','Pretend to be a strict teacher.'),
  c(56,'Acting','Imitate a cricket commentator.'),
  c(57,'Acting','Act out a dramatic breakup scene.'),
  c(58,'Acting','Pretend to be on a sinking ship.'),
  c(59,'Acting','Imitate a superhero landing.'),
  c(60,'Acting','Act like you just won the lottery.'),
  c(61,'Acting','Pretend to eat the most delicious food.'),
  c(62,'Acting','Imitate a sports commentator.'),
  // F. Knowledge (14)
  c(63,'Knowledge','Name the capital of Bangladesh.'),
  c(64,'Knowledge','Solve this quickly: 7 + 5 × 2 = ?'),
  c(65,'Knowledge','Name 3 programming languages.'),
  c(66,'Knowledge','Name 5 countries that start with M.'),
  c(67,'Knowledge','Explain what HTML stands for.'),
  c(68,'Knowledge','What year was DIU founded?'),
  c(69,'Knowledge','Name 3 fruits beginning with A.'),
  c(70,'Knowledge','What is the chemical symbol for gold?'),
  c(71,'Knowledge','Name 3 planets starting with J, M, or S.'),
  c(72,'Knowledge','Spell "Ludo" backwards.'),
  c(73,'Knowledge','How many continents are there?'),
  c(74,'Knowledge','What is the fastest land animal?'),
  c(75,'Knowledge','Name 5 colours in a rainbow.'),
  c(76,'Knowledge','What does CPU stand for?'),
  // G. Friendship (12)
  c(77,'Friendship','Compliment the player to your right.'),
  c(78,'Friendship','Share a positive memory with another player.'),
  c(79,'Friendship','Say one nice thing about everyone in the room.'),
  c(80,'Friendship','Thank someone who helped you recently.'),
  c(81,'Friendship','Describe your classmate in three positive words.'),
  c(82,'Friendship','Give a virtual hug to another player.'),
  c(83,'Friendship','Share what you appreciate about the batch.'),
  c(84,'Friendship','Name three things you love about your friends.'),
  c(85,'Friendship','Send a kind message to a random player.'),
  c(86,'Friendship','Dedicate a song to a friend.'),
  c(87,'Friendship','Share a favourite memory with the class.'),
  c(88,'Friendship','Name a friend who inspires you and why.'),
  // H. Surprise (12)
  c(89,'Surprise','Say the alphabet backwards for 10 seconds.'),
  c(90,'Surprise','Do your best impression of another player.'),
  c(91,'Surprise','Make the silliest face you can for 5 seconds.'),
  c(92,'Surprise','Talk in a made-up language for 10 seconds.'),
  c(93,'Surprise','Name 5 things you can see right now in 5 seconds.'),
  c(94,'Surprise','Complete this sentence: "If I could fly..."'),
  c(95,'Surprise','Say "banana" 10 times fast.'),
  c(96,'Surprise','Make someone in the room laugh in 10 seconds.')
];

export function getChallengeByIndex(i) {
  return CHALLENGES[i] || CHALLENGES[0];
}

export function getCategoryColor(cat) {
  const map = {
    'Physical Fun': '#ef4444', 'Singing': '#f97316', 'Poetry': '#eab308',
    'Storytelling': '#22c55e', 'Acting': '#06b6d4', 'Knowledge': '#3b82f6',
    'Friendship': '#a855f7', 'Surprise': '#ec4899'
  };
  return map[cat] || '#7c6fef';
}