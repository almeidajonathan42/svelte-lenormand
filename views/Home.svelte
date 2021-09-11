<script>
  import {
    appState,
    numberOfCards,
    currentQuestion,
    pastQuestions,
    cardData
  } from "../stores.js";
  import Card from "../components/Card.svelte";

  const startReading = (number, question) => {
    appState.set("reading");
    numberOfCards.set(number);
    currentQuestion.set(question);
  };

  let inputText = "";
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
  .main-input {
    height: 15px;
    width: 500px;
    padding: 8px;
    font-size: 15px;
    border: solid black 2px;
    border-radius: 5px;
    text-align: center;
  }
  .main-button {
    height: 40px;
    width: 200px;
    margin-bottom: 20px;
    border: none;
    background: black;
    color: white;
    border-radius: 5px;
    cursor: pointer;
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
	<h1>Lenormand</h1>
  <p> Think about what you want to ask </p>
  <input class="main-input" type="text" placeholder={'Write your question here'} bind:value={inputText} />
  
  <p> Choose the type of reading... </p>
  <button class="main-button" on:click={() => startReading(2, inputText)}>Read simple question</button>
  <button class="main-button" on:click={() => startReading(6, inputText)}>Read past, present, future</button>

  <h2>Past questions</h2>
  {#each $pastQuestions as question}
    <p> {question.question}</p>
    <div class="tutorial-cards-container">
      {#each question.cards as card}
        <Card cardData={$cardData[card]}/>
      {/each}
    </div>
  {/each}
</main>