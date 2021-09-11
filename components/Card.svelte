<script>
  export let cardData;

  const cardImagePath = "./" + cardData["name"].toLowerCase() + ".png";
</script>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
  }
  .outter-card-container {
    margin: 4px;
  }
  .card-container {
    position: relative;
    height: 200px;
    width: 120px;
    background: black;
    border-radius: 10px;

    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card-number {
    color: white;
    margin: 0;
    position: absolute;
    top: 10px;
    left: 10px;
  }
  .card-name {
    color: white;
    margin: 0;
    position: absolute;
    bottom: 5px;
    right: 10px;
  }
  .card-image {
    width: 100px;
    filter: invert(100%);
  }
  .meaning-1,
  .meaning-2,
  .meaning-3 {
    margin: 0;
    color: white;
    width: 120px;
    font-size: 12px;
  }
  .meaning-1-container,
  .meaning-2-container,
  .meaning-3-container {
    margin-top: 7px;
    background-color: black;
    width: 120px;
    height: 25px;
    border-radius: 100px;

    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

<main>
  <div class="outter-card-container">
    <div class="card-container">
      <p class="card-number"> {cardData['number']} </p>
      <p class="card-name"> {cardData['name']} </p>
      <img class="card-image" src={cardImagePath} alt={cardData["name"]} />
    </div>

    <div class='meaning-1-container'>
      <p class='meaning-1'> {cardData['meaning-1']} </p>
    </div>
    <div class='meaning-2-container'>
      <p class='meaning-2'> {cardData['meaning-2']} </p>
    </div>
    <div class='meaning-3-container'>
      <p class='meaning-3'> {cardData['meaning-3']} </p>
    </div>
  </div>
</main>