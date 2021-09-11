<script>
  import {
    appState,
    cardData,
    numberOfCards,
    currentQuestion,
    pastQuestions
  } from "../stores.js";
  import Card from "../components/Card.svelte";

  const addCurrentQuestionToPastQuestion = () => {
    $pastQuestions = [
      ...$pastQuestions,
      {
        question: $currentQuestion,
        cards: drawnCards
      }
    ];
  };

  const stopReading = () => {
    appState.set("home");
    addCurrentQuestionToPastQuestion();
  };

  const drawCard = cardsArray => {
    const newNumber = Math.floor(Math.random() * 35);
    const newNumberIsRepeated = cardsArray.find(cardNumber => {
      cardNumber == newNumber;
    });

    if (newNumberIsRepeated) {
      drawCard(cardsArray);
    } else {
      return newNumber;
    }
  };

  let drawnCards = [];
  for (let i = 0; i < $numberOfCards; i++) {
    drawnCards.push(drawCard(drawnCards));
  }
</script>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
  }
  .outter-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .cards-container {
    display: flex;
  }
  .main-button {
    height: 40px;
    width: 100px;
    margin-top: 30px;
    border: none;
    background: black;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }
  .tutorial-header {
    margin: 0;
    margin-top: 20px;
  }
  .tutorial-cards-container {
    zoom: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
  }
</style>

<main class="outter-container">
	<h1>{$currentQuestion}</h1>
  <div class="cards-container">
    {#each drawnCards as card}
      <Card cardData={$cardData[card]}/>
    {/each}
  </div>
  <button class="main-button" on:click={() => stopReading()}>Go back</button>
  
  <h2 class="tutorial-header"> HOW TO READ </h2>
  <p> Read the cards in pairs. <br> 
  The first card acts as a noun. <br> 
  The second card acts as an adjective.</p>
  <p> For example: </p>
  <div class="tutorial-cards-container">
    <Card cardData={$cardData[11]}/>
    <Card cardData={$cardData[12]}/>
  </div>
  <p> Inocent communication <br>
  Beginning of gossiping <br>
  Inexperienced speech</p>

  <p> Cards may have multiple meanings. <br> Interpret them according to your context.</p>
</main>