<input type="range" id="yearSlider" min="2021" max="2050" value="2022" oninput="updateSliderValue(this.value)">
<label for="yearSlider">Year: <span id="sliderValue">2022</span></label>
<script>
  window._year = "2022"; 
  console.log('the initial year is ',window._year)
  // Function to update the display and global variable when the slider changes
  function updateSliderValue(value) {
    document.getElementById('sliderValue').textContent = value;
    window._year = value;  // Set the global variable to the current slider value
    console.log('the new year is: ', window._year);
    // Fetch data and update chart
    window.fetchDataAndUpdateChart().then(window.renderSankeyChart).catch(error => {
      console.error("Error fetching data or rendering chart:", error);
    });
  }

  // Set up the event listener for the slider
  document.getElementById('yearSlider').addEventListener('input', function() {
    updateSliderValue(this.value);
  });
</script>

<style>
  #yearSlider {
    width: 100%;
    margin: 10px 0;
  }
</style>
